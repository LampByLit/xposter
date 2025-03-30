import { Article } from './types';

// Maximum tweet length
const MAX_TWEET_LENGTH = 280;

// Format the 4plebs URL for a thread
export function get4PlebsUrl(threadId: number): string {
  return `https://archive.4plebs.org/pol/thread/${threadId}`;
}

// Filter articles by total posts
export function filterArticlesByPosts(articles: Article[], maxPosts: number): Article[] {
  return articles.filter(article => article.metadata.totalPosts < maxPosts);
}

// Select a random article from an array
export function selectRandomArticle(articles: Article[]): Article | null {
  if (articles.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * articles.length);
  return articles[randomIndex];
}

// Format article text to fit in a tweet
export function formatTweet(article: Article): string {
  const url = get4PlebsUrl(article.threadId);
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