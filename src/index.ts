import dotenv from 'dotenv';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { createBotLogger } from './shared/logging';
import { XApiClient } from './shared/x-api/client';
import { XConfig } from './shared/types';
import { Article1Poster } from './bots/article1';

// Load environment variables
dotenv.config();

const logger = createBotLogger('main');
const PORT = process.env.PORT || 8080;
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

// Initialize X API client
const xConfig: XConfig = {
  apiKey: process.env.X_API_KEY || '',
  apiKeySecret: process.env.X_API_KEY_SECRET || '',
  accessToken: process.env.X_ACCESS_TOKEN || '',
  accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET || '',
};

async function serveFile(res: http.ServerResponse, filePath: string, contentType: string) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('Not found');
  }
}

async function main() {
  try {
    logger.info('Starting Xposter service...', { 
      nodeEnv: process.env.NODE_ENV,
      timezone: process.env.TZ
    });

    // Validate environment variables
    if (!xConfig.apiKey || !xConfig.apiKeySecret || !xConfig.accessToken || !xConfig.accessTokenSecret) {
      throw new Error('Missing required X API credentials');
    }

    // Initialize X API client
    const xClient = new XApiClient(xConfig);

    // Initialize and start Article1Poster bot
    const schedule = process.env.ARTICLE1_SCHEDULE || '0 0 * * *'; // Every day at midnight UTC
    const article1Bot = new Article1Poster(xClient, schedule);
    await article1Bot.start();

    // Create health check server
    const server = http.createServer(async (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok',
          timestamp: new Date().toISOString(),
          timezone: process.env.TZ,
          nodeEnv: process.env.NODE_ENV
        }));
      } else if (req.url === '/latest') {
        // Serve the latest post page
        await serveFile(res, path.join(PUBLIC_DIR, 'latest-post.html'), 'text/html');
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    // Ensure public directory exists
    await fs.mkdir(PUBLIC_DIR, { recursive: true });

    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });

    logger.info('Xposter service started successfully', {
      schedule,
      port: PORT
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await article1Bot.stop();
      server.close();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start Xposter service', { error });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection', { error });
  process.exit(1);
});

main(); 