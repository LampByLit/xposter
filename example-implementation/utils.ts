import fs from 'fs/promises';
import { Article, PostedArticle } from './types';

export async function readArticles(filePath: string): Promise<Article[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading articles:', error);
    return [];
  }
}

export async function readPostedArticles(filePath: string): Promise<PostedArticle[]> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    console.error('Error reading posted articles:', error);
    return [];
  }
}

export async function savePostedArticle(filePath: string, article: PostedArticle): Promise<void> {
  try {
    const posted = await readPostedArticles(filePath);
    posted.push(article);
    await fs.writeFile(filePath, JSON.stringify(posted, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving posted article:', error);
    throw error;
  }
}

export function formatTweet(article: Article): string {
  // Format the tweet text with headline and article content
  // Ensure it fits within X's character limit
  const maxLength = 280;
  const ellipsis = '...';
  
  let tweet = `${article.headline}\n\n${article.article}`;
  
  if (tweet.length > maxLength) {
    tweet = tweet.slice(0, maxLength - ellipsis.length) + ellipsis;
  }
  
  return tweet;
}

export function sortArticlesByReplies(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => a.metadata.totalPosts - b.metadata.totalPosts);
}

export function filterUnpostedArticles(articles: Article[], posted: PostedArticle[]): Article[] {
  const postedIds = new Set(posted.map(p => p.threadId));
  return articles.filter(article => !postedIds.has(article.threadId));
} 