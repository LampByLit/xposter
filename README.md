# Xposter

A multi-bot service that reads data from various sources and posts to X.com. Currently includes the Article1Poster bot which posts article summaries from pol-ai analysis.

## Features

- Scheduled posting to X.com using the v2 API
- Rate limiting and OAuth authentication
- Structured logging with Winston
- Health check endpoint
- Latest post tracking
- Environment-based configuration

## Setup

1. Clone the repository:
```bash
git clone https://github.com/hxkm/xposter.git
cd xposter
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your X API credentials to `.env`:
```env
X_API_KEY=your_api_key
X_API_KEY_SECRET=your_api_key_secret
X_ACCESS_TOKEN=your_access_token
X_ACCESS_TOKEN_SECRET=your_access_token_secret
```

## Usage

Build the project:
```bash
npm run build
```

Start the service:
```bash
npm run start
```

Run Article1Poster bot once:
```bash
npm run article1
```

## Environment Variables

Required:
- `X_API_KEY`: X API Key
- `X_API_KEY_SECRET`: X API Key Secret
- `X_ACCESS_TOKEN`: X Access Token
- `X_ACCESS_TOKEN_SECRET`: X Access Token Secret
- `ARTICLE_SOURCE_URL`: URL to fetch articles from

Optional:
- `ARTICLE1_SCHEDULE`: Cron schedule for Article1Poster (default: "0 0 * * *")
- `PORT`: Server port (default: 8080)
- `LOG_LEVEL`: Logging level (default: info)
- `LOG_FORMAT`: Log format - json or simple (default: simple)

## Deployment

This project is designed to be deployed on Railway.app using Nixpacks. The deployment configuration is in `nixpacks.toml`.

## License

MIT 