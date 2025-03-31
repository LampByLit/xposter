import { CronJob } from 'cron';
import { BaseBot } from '../../shared/types';
import { XApiClient } from '../../shared/x-api/client';
import { createBotLogger } from '../../shared/logging';
import { XparaApiResponse, XparaArticle } from './types';
import path from 'path';
import fs from 'fs/promises';
import { getDataPath } from '../../utils/paths';
import { writeXparaLatestPost } from '../../shared/utils/xpara-latest-post';

export class XparaBot implements BaseBot {
  name = 'xpara';
  schedule: string;
  private cronJob: CronJob | null = null;
  private logger = createBotLogger('xpara');
  private xClient: XApiClient;
  private lastProcessedTime: number = 0;
  private dataPath: string;

  constructor(xClient: XApiClient, schedule: string) {
    this.xClient = xClient;
    this.schedule = schedule;
    this.dataPath = path.resolve(getDataPath(), 'xpara');
  }

  async start(): Promise<void> {
    this.logger.info('Starting XparaBot');
    await this.initializeDataDirectory();
    
    this.cronJob = new CronJob(
      this.schedule,
      () => this.processAndPost(),
      null,
      true
    );
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping XparaBot');
    this.cronJob?.stop();
  }

  private async initializeDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create data directory', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        path: this.dataPath
      });
      throw error;
    }
  }

  private async loadLastProcessedTime(): Promise<number> {
    try {
      const stateFile = path.resolve(this.dataPath, 'state.json');
      const data = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(data) as { lastProcessedTime: number };
      return state.lastProcessedTime || 0;
    } catch (error) {
      this.logger.error('Error loading last processed time', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return 0;
    }
  }

  private async saveLastProcessedTime(time: number): Promise<void> {
    const stateFile = path.resolve(this.dataPath, 'state.json');
    await fs.writeFile(stateFile, JSON.stringify({ lastProcessedTime: time }));
  }

  private async fetchArticles(): Promise<XparaArticle[]> {
    try {
      this.logger.debug('Fetching articles from Xpara API');
      const response = await fetch('https://xpara-ai-production.up.railway.app/api/articles');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      
      const data = await response.json() as XparaApiResponse;
      this.logger.debug(`Successfully fetched ${data.articles.length} articles`);
      return data.articles;
    } catch (error) {
      this.logger.error('Error fetching articles', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private get4PlebsUrl(threadId: string): string {
    return `https://archive.4plebs.org/x/thread/${threadId}`;
  }

  private formatTweet(article: XparaArticle): string {
    const MAX_TWEET_LENGTH = 280;
    const url = this.get4PlebsUrl(article.threadId);
    const hashtag = '#4chan';
    const newlines = '\n\n';
    const space = ' ';
    
    // Calculate exact space needed for fixed elements
    const reservedLength = url.length + hashtag.length + newlines.length + space.length;
    const maxTextLength = MAX_TWEET_LENGTH - reservedLength;
    
    let text = article.article;
    
    // Only truncate if necessary
    if (text.length > maxTextLength) {
      // Try to find a sentence break near the limit
      let truncateIndex = text.lastIndexOf('. ', maxTextLength);
      
      // If no sentence break, try to find a word break
      if (truncateIndex === -1 || truncateIndex < maxTextLength - 30) {
        truncateIndex = text.lastIndexOf(' ', maxTextLength - 3);
      }
      
      // If still no good break point, just cut at the limit
      if (truncateIndex === -1 || truncateIndex < maxTextLength - 50) {
        truncateIndex = maxTextLength - 3;
      }
      
      text = text.substring(0, truncateIndex) + '...';
    }
    
    return `${text}${newlines}${url} ${hashtag}`;
  }

  private selectRandomArticle(articles: XparaArticle[]): XparaArticle | null {
    if (articles.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * articles.length);
    return articles[randomIndex];
  }

  private async processAndPost(): Promise<void> {
    try {
      this.lastProcessedTime = await this.loadLastProcessedTime();
      const articles = await this.fetchArticles();
      const newArticles = articles.filter(a => a.generatedAt > this.lastProcessedTime);

      this.logger.info(`Found ${newArticles.length} new articles to process`);

      // Select one random article to post
      const selectedArticle = this.selectRandomArticle(newArticles);
      if (!selectedArticle) {
        this.logger.warn('No new articles to post');
        return;
      }

      const tweet = this.formatTweet(selectedArticle);
      const result = await this.xClient.post(tweet);
      
      if (result.success && result.tweetId) {
        this.logger.info('Successfully posted article', {
          threadId: selectedArticle.threadId,
          tweetId: result.tweetId
        });

        // Write latest post info
        await writeXparaLatestPost({
          tweetId: result.tweetId,
          threadId: parseInt(selectedArticle.threadId, 10),
          timestamp: new Date().toISOString()
        });
        
        // Update last processed time to the selected article's time
        this.lastProcessedTime = selectedArticle.generatedAt;
        await this.saveLastProcessedTime(this.lastProcessedTime);
      } else {
        this.logger.error('Failed to post article', {
          threadId: selectedArticle.threadId,
          error: result.error
        });
      }
    } catch (error) {
      this.logger.error('Error in processAndPost', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 