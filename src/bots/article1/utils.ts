import { Article } from './types';

// Maximum tweet length
const MAX_TWEET_LENGTH = 280;

// Format the 4plebs URL for a thread
export function get4PlebsUrl(threadId: number): string {
  return `https://archive.4plebs.org/pol/thread/${threadId}`;
}

// Filter articles by total posts and age
export function filterArticlesByPosts(articles: Article[], maxPosts: number): Article[] {
  const MAX_AGE_HOURS = 24; // Only consider articles from last 24 hours
  const cutoffTime = Date.now() - (MAX_AGE_HOURS * 60 * 60 * 1000);
  
  return articles.filter(article => 
    article.metadata.totalPosts < maxPosts && 
    article.metadata.generatedAt > cutoffTime
  );
}

// Select a random article from an array
export function selectRandomArticle(articles: Article[]): Article | null {
  if (articles.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * articles.length);
  return articles[randomIndex];
}

// Format article text to fit in a tweet
export function formatTweet(article: Article): string {
  const url = get4PlebsUrl(parseInt(article.threadId, 10));
  const hashtag = '#4chan';
  const newlines = '\n\n';
  const space = ' ';
  
  return `${article.article}${newlines}${url} ${hashtag}`;
} 