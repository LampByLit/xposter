import path from 'path';

// Get the base data directory path from environment or default to /data
export function getDataPath(): string {
  return process.env.DATA_DIR || path.resolve(process.cwd(), 'data');
} 