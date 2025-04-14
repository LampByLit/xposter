import fs from 'fs/promises';
import path from 'path';
import { createBotLogger } from '../logging';

const logger = createBotLogger('lit-latest-post');
const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const LATEST_POST_FILE = path.resolve(PUBLIC_DIR, 'lit-latest-post.html');

interface PostInfo {
  tweetId: string;
  threadId: number;
  timestamp: string;
}

export async function writeLitLatestPost(postInfo: PostInfo): Promise<void> {
  try {
    // Ensure public directory exists
    await fs.mkdir(PUBLIC_DIR, { recursive: true });

    const tweetUrl = `https://x.com/i/web/status/${postInfo.tweetId}`;
    const html = `${tweetUrl}`;

    await fs.writeFile(LATEST_POST_FILE, html, 'utf-8');
    logger.info('Updated lit latest post info', { tweetId: postInfo.tweetId });
  } catch (error) {
    logger.error('Failed to write lit latest post info', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 