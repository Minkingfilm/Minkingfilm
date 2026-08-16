# URL Shortener

A simple URL shortener API built with [Hono](https://hono.dev).

## Features

- **Create** short URLs via `POST /api/shorten`
- **Redirect** via `GET /:id`
- **Track clicks** via `GET /api/urls/:id/stats`
- **List all URLs** via `GET /api/urls`
- **Frontend** served at `GET /`

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API

### Create a short URL

```bash
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://hono.dev"}'
```

Response:

```json
{
  "id": "aBcDeF",
  "shortUrl": "http://localhost:3000/aBcDeF",
  "originalUrl": "https://hono.dev",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Redirect

```
GET http://localhost:3000/aBcDeF → 302 redirect to https://hono.dev
```

### Get stats

```bash
curl http://localhost:3000/api/urls/aBcDeF/stats
```

Response:

```json
{
  "id": "aBcDeF",
  "originalUrl": "https://hono.dev",
  "clicks": 5,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### List all URLs

```bash
curl http://localhost:3000/api/urls
```
