# Xposter Service Documentation

## Overview
Xposter is a service that automatically posts summarized thread content to X (formerly Twitter). It's designed to be a standalone service that will be separated from the main pol-ai application.

## Current Implementation Analysis

### Core Components
1. **XPoster Class** (`src/app/lib/xposter/poster.ts`)
   - Handles OAuth 1.0a authentication with X API
   - Manages rate limiting and post timing
   - Processes and posts articles
   - Tracks posted content

2. **Configuration** (`src/app/lib/xposter/config.ts`)
   - API endpoints and credentials
   - File paths for articles and posting history
   - Rate limiting settings

3. **Types** (`src/app/lib/xposter/types.ts`)
   - `XConfig`: API credentials interface
   - `PostedArticle`: Record of posted content
   - `Article`: Thread content structure
   - `PostResult`: Post operation result

4. **Utilities** (`src/app/lib/xposter/utils.ts`)
   - File operations for articles and posting history
   - Article filtering and sorting
   - Tweet formatting

### Data Flow
1. Reads articles from `data/analysis/articles.json`
2. Tracks posted content in `data/xposter/posted.json`
3. Filters out previously posted content
4. Formats content into tweets
5. Posts to X API
6. Records successful posts

## New Service Requirements

### Environment Setup
```env
# Required Environment Variables
X_API_KEY=your_api_key
X_API_KEY_SECRET=your_api_key_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
DATA_DIR=/data
```

### Directory Structure
```
/
├── src/
│   ├── config/
│   │   ├── paths.ts
│   │   └── x-api.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── file.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   ├── services/
│   │   └── xposter.ts
│   └── index.ts
├── data/
│   ├── articles/
│   └── posted/
├── scripts/
│   └── post.ts
├── tests/
├── package.json
├── tsconfig.json
└── README.md
```

### Railway Deployment Configuration
```toml
# nixpacks.toml
[phases.setup]
nixPkgs = ["nodejs"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"

[variables]
NODE_ENV = "production"
DATA_DIR = "/data"
```

### Required Dependencies
```json
{
  "dependencies": {
    "node-fetch": "^2.6.1",
    "oauth-1.0a": "^2.2.6",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/node-fetch": "^2.6.1",
    "typescript": "^5.0.0"
  }
}
```

## Implementation Guidelines

### 1. Data Storage
- Use Railway's persistent volume mounted at `/data`
- Implement atomic file operations
- Keep backups of posted history
- Use proper file locking for concurrent access

### 2. Rate Limiting
- Respect X API rate limits (300 tweets per 3 hours)
- Implement exponential backoff for failures
- Track posting timestamps
- Add random delays between posts

### 3. Error Handling
- Implement proper error boundaries
- Log all API interactions
- Save failed post attempts
- Implement retry mechanism

### 4. Monitoring
- Log all operations
- Track API usage
- Monitor rate limits
- Alert on failures

### 5. Security
- Never commit API credentials
- Use environment variables
- Validate all input data
- Sanitize post content

## Development Steps

1. **Initial Setup**
   ```bash
   # Create new project
   mkdir xposter-service
   cd xposter-service
   npm init -y
   
   # Install dependencies
   npm install oauth-1.0a node-fetch dotenv
   npm install -D typescript @types/node @types/node-fetch
   
   # Initialize TypeScript
   npx tsc --init
   ```

2. **Configuration**
   - Set up environment variables
   - Configure paths
   - Set up logging

3. **Core Implementation**
   - Port existing XPoster class
   - Implement new file structure
   - Add improved error handling

4. **Testing**
   - Write unit tests
   - Test rate limiting
   - Test error scenarios

5. **Deployment**
   - Set up Railway project
   - Configure volume mounts
   - Set up monitoring

## Testing Guidelines

1. **Unit Tests**
   - Test tweet formatting
   - Test file operations
   - Test error handling

2. **Integration Tests**
   - Test X API interaction
   - Test rate limiting
   - Test file persistence

3. **End-to-End Tests**
   - Test complete posting flow
   - Test recovery scenarios
   - Test concurrent operations

## Deployment Checklist

1. [ ] Create new Railway project
2. [ ] Configure environment variables
3. [ ] Set up volume mount
4. [ ] Deploy initial version
5. [ ] Verify data persistence
6. [ ] Test posting flow
7. [ ] Set up monitoring
8. [ ] Configure alerts

## Maintenance Guidelines

1. **Regular Tasks**
   - Monitor rate limit usage
   - Check posted history
   - Verify file permissions
   - Review error logs

2. **Troubleshooting**
   - Check API responses
   - Verify file access
   - Review rate limits
   - Check environment variables

3. **Updates**
   - Keep dependencies updated
   - Review X API changes
   - Update rate limits if needed
   - Maintain documentation

## Security Considerations

1. **API Security**
   - Rotate API keys regularly
   - Monitor for unauthorized usage
   - Use secure credential storage

2. **Data Security**
   - Backup posted history
   - Validate file permissions
   - Sanitize all inputs
   - Encrypt sensitive data

## Best Practices

1. **Code**
   - Follow TypeScript best practices
   - Use proper typing
   - Document all functions
   - Handle all errors

2. **Operations**
   - Use atomic operations
   - Implement proper logging
   - Monitor performance
   - Regular backups

3. **Deployment**
   - Test in staging
   - Use proper versioning
   - Document changes
   - Monitor resources

## Recovery Procedures

1. **API Issues**
   - Implement backoff
   - Log failures
   - Alert on errors
   - Retry with delays

2. **Data Issues**
   - Maintain backups
   - Verify integrity
   - Restore from backup
   - Log changes

## Future Improvements

1. **Features**
   - Add media support
   - Improve formatting
   - Add analytics
   - Enhanced monitoring

2. **Technical**
   - Optimize performance
   - Improve error handling
   - Add metrics
   - Enhanced testing

## Contact

For questions or issues:
1. Check the error logs
2. Review documentation
3. Contact repository maintainers
4. Create detailed issue reports 