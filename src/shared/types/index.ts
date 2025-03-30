export interface XConfig {
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

export interface PostResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

export interface BaseBot {
  name: string;
  schedule: string;
  start(): Promise<void>;
  stop(): Promise<void>;
} 