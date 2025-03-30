# Current Xposter Implementation

This directory contains the current implementation of the Xposter service as it exists in the main pol-ai application. This is kept for reference while building the standalone service.

## Files

- `poster.ts`: Main XPoster class implementation
- `types.ts`: TypeScript interfaces and types
- `utils.ts`: Helper functions for file operations and tweet formatting
- `config.ts`: Configuration for X API and file paths

## Key Features

1. OAuth 1.0a authentication with X API
2. Rate limiting (300 tweets per 3 hours)
3. Article filtering and sorting
4. Tweet formatting with character limits
5. Posted history tracking
6. Error handling and logging

## Environment Variables

```env
X_API_KEY=your_api_key
X_API_KEY_SECRET=your_api_key_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
DATA_DIR=/data
```

## Data Structure

### Articles JSON
```json
{
  "threadId": 123456,
  "headline": "Article Headline",
  "article": "Article content...",
  "metadata": {
    "totalPosts": 50,
    "analyzedPosts": 45,
    "generatedAt": 1711481735354
  }
}
```

### Posted JSON
```json
[
  {
    "threadId": 123456,
    "timestamp": 1711481735354,
    "tweetId": "1234567890"
  }
]
```

## Known Limitations

1. Basic error handling
2. No retry mechanism
3. Simple file-based storage
4. Limited monitoring
5. No backup system

These limitations will be addressed in the standalone service implementation. 