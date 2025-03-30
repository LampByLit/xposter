import dotenv from 'dotenv';
import { XApiClient } from '../src/shared/x-api/client';
import { Article1Poster } from '../src/bots/article1';
import { createBotLogger } from '../src/shared/logging';

// Load environment variables
dotenv.config();

const logger = createBotLogger('article1-runner');

async function run() {
  try {
    // Initialize X API client
    const xConfig = {
      apiKey: process.env.X_API_KEY || '',
      apiKeySecret: process.env.X_API_KEY_SECRET || '',
      accessToken: process.env.X_ACCESS_TOKEN || '',
      accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
    };

    // Validate environment variables
    if (!xConfig.apiKey || !xConfig.apiKeySecret || !xConfig.accessToken || !xConfig.accessTokenSecret) {
      throw new Error('Missing required X API credentials');
    }

    const xClient = new XApiClient(xConfig);
    const bot = new Article1Poster(xClient, '');  // Empty schedule since we're running manually

    logger.info('Running Article1Poster once...');
    await bot['postArticle']();  // Access private method
    logger.info('Finished running Article1Poster');

  } catch (error) {
    logger.error('Failed to run Article1Poster', { error });
    process.exit(1);
  }
}

run(); 