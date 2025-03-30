import path from 'path';
import { XConfig } from './types';

// X API Configuration
export const X_CONFIG: XConfig = {
  apiKey: process.env.X_API_KEY || '',
  apiKeySecret: process.env.X_API_KEY_SECRET || '',
  accessToken: process.env.X_ACCESS_TOKEN || '',
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
};

// X API Endpoints and Rate Limits
export const X_API = {
  baseUrl: 'https://api.twitter.com/2',
  tweetEndpoint: '/tweets',
  rateLimit: {
    windowMs: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
    tweetsPerWindow: 300, // 300 tweets per 3 hours
  },
};

// File Paths
export const PATHS = {
  articlesJson: path.resolve(process.env.DATA_DIR || '', 'analysis', 'articles.json'),
  postedJson: path.resolve(process.env.DATA_DIR || '', 'xposter', 'posted.json'),
}; 