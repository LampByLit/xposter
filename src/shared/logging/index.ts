import winston from 'winston';
import path from 'path';

const logDir = process.env.LOG_DIR || 'logs';
const logFormat = process.env.LOG_FORMAT === 'json' ? 'json' : 'simple';
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat === 'json' 
    ? winston.format.json()
    : winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

export function createBotLogger(botName: string) {
  return {
    info: (message: string, meta?: object) => {
      logger.info(message, { bot: botName, ...meta });
    },
    error: (message: string, meta?: object) => {
      logger.error(message, { bot: botName, ...meta });
    },
    warn: (message: string, meta?: object) => {
      logger.warn(message, { bot: botName, ...meta });
    },
    debug: (message: string, meta?: object) => {
      logger.debug(message, { bot: botName, ...meta });
    }
  };
} 