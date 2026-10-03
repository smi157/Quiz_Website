# Database Proxy API

This API provides HTTP access to the MySQL database for the AP Chemistry Quiz application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set environment variables (Railway will do this automatically)

3. Run locally (optional):
   ```bash
   npm start
   ```

## Endpoints

- `GET /health` - Check database connection
- `GET /api/questions/random` - Get random questions (requires auth)
- `POST /api/query` - Execute custom query (requires auth)

## Authentication

Include API key in header:
```
Authorization: Bearer your-api-key
```
