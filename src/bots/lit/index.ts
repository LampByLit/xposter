import { CronJob } from 'cron';
import { BaseBot } from '../../shared/types';
import { XApiClient } from '../../shared/x-api/client';
import { createBotLogger } from '../../shared/logging';
import { LitApiResponse, LitArticle } from './types';
import path from 'path';
import fs from 'fs/promises';
import { getDataPath } from '../../utils/paths';
import { writeLitLatestPost } from '../../shared/utils/lit-latest-post';

export class LitBot implements BaseBot {
  name = 'lit';
  schedule: string;
  private cronJob: CronJob | null = null;
  private logger = createBotLogger('lit');
  private xClient: XApiClient;
  private lastProcessedTime: number = 0;
  private dataPath: string;

  constructor(xClient: XApiClient, schedule: string) {
    this.xClient = xClient;
    this.schedule = schedule;
    this.dataPath = path.resolve(getDataPath(), 'lit');
  }

  async start(): Promise<void> {
    this.logger.info('Starting LitBot');
    await this.initializeDataDirectory();
    
    this.cronJob = new CronJob(
      this.schedule,
      () => this.processAndPost(),
      null,
      true
    );
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping LitBot');
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

  private async fetchArticles(): Promise<LitArticle[]> {
    try {
      this.logger.debug('Fetching articles from Lit API');
      const response = await fetch('https://lit-ai-production.up.railway.app/api/articles');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      
      const data = await response.json() as LitApiResponse;
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
    return `https://archive.4plebs.org/lit/thread/${threadId}`;
  }

  private formatTweet(article: LitArticle): string {
    const url = this.get4PlebsUrl(article.threadId);
    const hashtag = '#4chan';
    const newlines = '\n\n';
    const space = ' ';
    
    return `${article.article}${newlines}${url} ${hashtag}`;
  }

  private selectRandomArticle(articles: LitArticle[]): LitArticle | null {
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
        await writeLitLatestPost({
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