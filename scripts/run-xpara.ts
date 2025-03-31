import dotenv from 'dotenv';
import { XApiClient } from '../src/shared/x-api/client';
import { XparaBot } from '../src/bots/xpara';
import { createBotLogger } from '../src/shared/logging';

// Load environment variables
dotenv.config();

const logger = createBotLogger('xpara-runner');

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
    const bot = new XparaBot(xClient, '');  // Empty schedule since we're running manually

    logger.info('Running XparaBot once...');
    await bot['processAndPost']();  // Access private method
    logger.info('Finished running XparaBot');

  } catch (error) {
    logger.error('Failed to run XparaBot', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    process.exit(1);
  }
}

run(); 