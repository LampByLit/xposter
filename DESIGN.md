# Xposter Service Design Document

## Overview
Xposter is a multi-bot service that reads data from various sources and posts to X.com. Each bot operates independently but shares common infrastructure for X API access and logging.

## Core Components

### 1. Bot Infrastructure
- Location: `/src/shared`
- Purpose: Provides common utilities for all bots
- Components:
  - X API client
  - Logging system
  - Common types
  - Error handling

### 2. Article1Poster Bot
- Location: `/src/bots/article1`
- Purpose: Posts article summaries from pol-ai analysis
- Data Source: 
  - Primary: `/data/analysis/articles.json` via Railway volume
  - Fallback: Web scraping from pol-ai dashboard
- Post Frequency: Every 2 days
- Data Format:
```typescript
interface Article {
  id: string;
  title: string;
  summary: string;
  timestamp: string;
  metrics: {
    replies: number;
    images: number;
    uniquePosters: number;
  };
  flags: Record<string, number>;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: string[];
  links: string[];
}
```

### 3. Data Access Strategy
1. **Primary Method**
   - Direct Railway volume access
   - Path: `/data/analysis/articles.json`
   - Requires: Volume mount permissions

2. **Fallback Method**
   - Web scraping from pol-ai dashboard
   - URL: https://pol-ai-production.up.railway.app/
   - Requires: Public data access

### 4. Logging System
- JSON structured logging
- Fields:
  - timestamp
  - bot_name
  - action
  - status
  - error (if any)
  - data_source
  - post_id (if successful)

### 5. Error Handling
1. Data Access Errors
   - Volume access failure → Try fallback
   - Data parsing errors → Log and skip
   - Invalid data → Log and skip

2. X API Errors
   - Rate limit → Backoff and retry
   - Auth errors → Alert and stop
   - Network errors → Retry with exponential backoff

## Project Structure
```
/xposter
├── src/
│   ├── bots/
│   │   └── article1/
│   │       ├── index.ts       # Main bot logic
│   │       ├── config.ts      # Bot configuration
│   │       ├── types.ts       # Bot-specific types
│   │       └── utils.ts       # Bot-specific utilities
│   ├── shared/
│   │   ├── x-api/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── logging/
│   │   │   └── index.ts
│   │   └── types/
│   │       └── index.ts
│   └── index.ts              # Application entry
├── config/
│   └── default.ts           # Global configuration
├── tests/
├── DESIGN.md
├── README.md
├── package.json
└── tsconfig.json
```

## Environment Variables
```env
# X API Credentials
X_API_KEY=
X_API_KEY_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=

# Data Sources
POL_AI_VOLUME_PATH=/data/analysis
POL_AI_URL=https://pol-ai-production.up.railway.app/

# Bot Configuration
ARTICLE1_SCHEDULE="0 12 */2 * *"  # Noon every 2 days
```

## Next Steps
1. Set up project structure and dependencies
2. Implement shared X API client
3. Create logging infrastructure
4. Implement Article1Poster bot
5. Test data access methods
6. Deploy to Railway 