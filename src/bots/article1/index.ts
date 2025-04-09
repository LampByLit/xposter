import { CronJob } from 'cron';
import fetch from 'node-fetch';
import { BaseBot } from '../../shared/types';
import { XApiClient } from '../../shared/x-api/client';
import { createBotLogger } from '../../shared/logging';
import { Article, ArticlesResponse } from './types';
import { selectRandomArticle, formatTweet } from './utils';
import { writeLatestPost } from '../../shared/utils/latest-post';
import path from 'path';
import fs from 'fs/promises';
import { getDataPath } from '../../utils/paths';

export class Article1Poster implements BaseBot {
  name = 'article1';
  schedule: string;
  private cronJob: CronJob | null = null;
  private logger = createBotLogger('article1');
  private xClient: XApiClient;
  private articleSourceUrl: string;
  private lastProcessedTime: number = 0;
  private dataPath: string;

  constructor(xClient: XApiClient, schedule: string) {
    this.xClient = xClient;
    this.schedule = schedule;
    this.logger.info('Environment variable value', { envUrl: process.env.ARTICLE_SOURCE_URL });
    this.articleSourceUrl = 'https://pol-ai-production.up.railway.app/api/articles';
    this.logger.info('Final URL value', { url: this.articleSourceUrl });
    this.dataPath = path.resolve(getDataPath(), 'article1');
  }

  async start(): Promise<void> {
    this.logger.info('Starting Article1Poster bot');
    await this.initializeDataDirectory();
    
    this.cronJob = new CronJob(
      this.schedule,
      () => this.processAndPost(),
      null,
      true
    );
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Article1Poster bot');
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

  private async fetchArticles(): Promise<Article[]> {
    try {
      this.logger.debug(`Fetching articles from ${this.articleSourceUrl}`);
      const response = await fetch(this.articleSourceUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'XPoster/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.statusText}`);
      }
      
      const data = await response.json() as ArticlesResponse;
      this.logger.debug(`Successfully fetched ${data.articles.length} articles`);
      return data.articles;
    } catch (error) {
      this.logger.error('Error fetching articles', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  async processAndPost(): Promise<void> {
    try {
      this.lastProcessedTime = await this.loadLastProcessedTime();
      const articles = await this.fetchArticles();
      const newArticles = articles.filter(a => a.metadata.generatedAt > this.lastProcessedTime);

      this.logger.info(`Found ${newArticles.length} new articles to process`);

      // Select one random article to post
      const selectedArticle = selectRandomArticle(newArticles);
      if (!selectedArticle) {
        this.logger.warn('No new articles to post');
        return;
      }

      const tweet = formatTweet(selectedArticle);
      const result = await this.xClient.post(tweet);
      
      if (result.success && result.tweetId) {
        this.logger.info('Successfully posted article', {
          threadId: selectedArticle.threadId,
          tweetId: result.tweetId
        });

        // Write latest post info
        await writeLatestPost({
          tweetId: result.tweetId,
          threadId: parseInt(selectedArticle.threadId, 10),
          timestamp: new Date().toISOString()
        });
        
        // Update last processed time to the selected article's time
        this.lastProcessedTime = selectedArticle.metadata.generatedAt;
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