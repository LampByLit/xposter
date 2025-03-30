import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { XConfig, PostResult } from '../types';

export class XApiClient {
  private oauth: OAuth;
  private lastPostTime: number = 0;
  private readonly rateLimit = {
    windowMs: 3 * 60 * 60 * 1000, // 3 hours
    tweetsPerWindow: 300,
  };

  constructor(private config: XConfig) {
    this.oauth = new OAuth({
      consumer: {
        key: config.apiKey,
        secret: config.apiKeySecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString: string, key: string) {
        return crypto
          .createHmac('sha1', key)
          .update(baseString)
          .digest('base64');
      }
    });
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastPost = now - this.lastPostTime;
    const minInterval = this.rateLimit.windowMs / this.rateLimit.tweetsPerWindow;

    if (timeSinceLastPost < minInterval) {
      const delay = minInterval - timeSinceLastPost;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  public async post(text: string): Promise<PostResult> {
    try {
      await this.enforceRateLimit();

      const endpointUrl = 'https://api.twitter.com/2/tweets';
      const data = { text };
      
      const requestData = {
        url: endpointUrl,
        method: 'POST'
      };

      const token = {
        key: this.config.accessToken,
        secret: this.config.accessTokenSecret,
      };

      const authorization = this.oauth.authorize(requestData, token);
      const authHeader = this.oauth.toHeader(authorization);

      const headers = {
        ...authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'xposter/1.0.0',
        'X-Twitter-API-Version': '2'
      };

      console.log('Request URL:', endpointUrl);
      console.log('Request headers:', headers);
      console.log('Request body:', JSON.stringify(data));

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Response headers:', response.headers);
        console.log('Response status:', response.status);
        console.log('Response text:', errorText);
        return { 
          success: false, 
          error: `X API error: ${response.status} - ${errorText}` 
        };
      }

      const responseData = await response.json();
      this.lastPostTime = Date.now();

      return {
        success: true,
        tweetId: responseData.data.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
} 