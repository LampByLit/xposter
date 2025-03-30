import { CronJob } from 'cron';
import fetch from 'node-fetch';
import { BaseBot } from '../../shared/types';
import { XApiClient } from '../../shared/x-api/client';
import { createBotLogger } from '../../shared/logging';
import { Article, ArticlesResponse } from './types';
import { filterArticlesByPosts, selectRandomArticle, formatTweet } from './utils';
import { writeLatestPost } from '../../shared/utils/latest-post';

export class Article1Poster implements BaseBot {
  name = 'article1';
  schedule: string;
  private cronJob: CronJob | null = null;
  private logger = createBotLogger('article1');
  private xClient: XApiClient;
  private articleSourceUrl: string;

  constructor(xClient: XApiClient, schedule: string) {
    this.xClient = xClient;
    this.schedule = schedule;
    this.articleSourceUrl = process.env.ARTICLE_SOURCE_URL || 'https://pol-ai-production.up.railway.app/articles';
  }

  async start(): Promise<void> {
    this.logger.info('Starting Article1Poster bot');
    
    this.cronJob = new CronJob(
      this.schedule,
      () => this.postArticle(),
      null,
      true
    );
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping Article1Poster bot');
    this.cronJob?.stop();
  }

  private decodeHtmlEntities(text: string): string {
    const entities: { [key: string]: string } = {
      '&quot;': '"',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&#39;': "'",
      '&apos;': "'",
    };
    return text.replace(/&quot;|&amp;|&lt;|&gt;|&#39;|&apos;/g, match => entities[match]);
  }

  private findJsonBoundaries(text: string): { start: number; end: number } | null {
    let start = -1;
    let end = -1;
    let braceCount = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (char === '\\' && !escaped) {
          escaped = true;
          continue;
        }
        if (char === '"' && !escaped) {
          inString = false;
        }
        escaped = false;
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === '{') {
        if (braceCount === 0) {
          start = i;
        }
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          end = i + 1;
          // Found complete JSON object
          break;
        }
      }
    }

    if (start === -1 || end === -1 || braceCount !== 0) {
      return null;
    }

    return { start, end };
  }

  private async fetchArticles(): Promise<Article[]> {
    try {
      this.logger.debug(`Fetching articles from ${this.articleSourceUrl}`);
      
      const response = await fetch(this.articleSourceUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch articles: ${response.status}`);
      }

      // Get the HTML content
      const htmlContent = await response.text();
      this.logger.debug(`Received HTML content length: ${htmlContent.length}`);

      // Find proper JSON boundaries
      const boundaries = this.findJsonBoundaries(htmlContent);
      if (!boundaries) {
        throw new Error('Could not find valid JSON content in HTML');
      }
      
      this.logger.debug(`JSON content bounds: ${boundaries.start} to ${boundaries.end}`);
      
      let jsonContent = htmlContent.slice(boundaries.start, boundaries.end);
      
      // Decode HTML entities
      jsonContent = this.decodeHtmlEntities(jsonContent);
      
      this.logger.debug(`Extracted JSON content length: ${jsonContent.length}`);
      this.logger.debug(`JSON content preview: ${jsonContent.substring(0, 200)}...`);
      
      try {
        const data: ArticlesResponse = JSON.parse(jsonContent);
        this.logger.debug(`Successfully parsed JSON, found ${data.articles.length} articles`);
        return data.articles;
      } catch (parseError) {
        this.logger.error('JSON parse error', { parseError, jsonPreview: jsonContent.substring(0, 500) });
        throw new Error(`Failed to parse JSON content: ${parseError}`);
      }

    } catch (error) {
      this.logger.error('Error fetching articles', { 
        error,
        url: this.articleSourceUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private async postArticle(): Promise<void> {
    try {
      // Fetch and filter articles
      const articles = await this.fetchArticles();
      const eligibleArticles = filterArticlesByPosts(articles, 200);
      
      // Select random article
      const selectedArticle = selectRandomArticle(eligibleArticles);
      if (!selectedArticle) {
        this.logger.warn('No eligible articles found');
        return;
      }

      // Format and post tweet
      const tweet = formatTweet(selectedArticle);
      const result = await this.xClient.post(tweet);

      if (result.success) {
        this.logger.info('Successfully posted article', {
          threadId: selectedArticle.threadId,
          tweetId: result.tweetId
        });

        // Write latest post info
        await writeLatestPost({
          tweetId: result.tweetId!,
          threadId: selectedArticle.threadId,
          timestamp: new Date().toISOString()
        });
      } else {
        this.logger.error('Failed to post article', {
          threadId: selectedArticle.threadId,
          error: result.error
        });
      }
    } catch (error) {
      this.logger.error('Error in postArticle', { error });
    }
  }
} 