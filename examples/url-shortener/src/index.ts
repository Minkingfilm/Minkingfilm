import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { html } from 'hono/html'

// In-memory store
interface UrlEntry {
  id: string
  originalUrl: string
  clicks: number
  createdAt: string
}

const urls = new Map<string, UrlEntry>()

function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const app = new Hono()

app.use('/*', cors())

// --- Frontend ---
app.get('/', (c) => {
  return c.html(html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>URL Shortener</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #f97316; }
    .subtitle { color: #94a3b8; margin-bottom: 2rem; }
    .card {
      background: #1e293b;
      border-radius: 12px;
      padding: 2rem;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
      margin-bottom: 1.5rem;
    }
    label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #cbd5e1; }
    input[type="url"] {
      width: 100%;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #0f172a;
      color: #e2e8f0;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    input[type="url"]:focus { outline: none; border-color: #f97316; }
    button {
      background: #f97316;
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #ea580c; }
    .result {
      margin-top: 1rem;
      padding: 1rem;
      background: #0f172a;
      border-radius: 8px;
      border: 1px solid #334155;
      display: none;
    }
    .result.show { display: block; }
    .result a { color: #38bdf8; text-decoration: none; font-weight: 600; word-break: break-all; }
    .result a:hover { text-decoration: underline; }
    .stats-label { font-size: 0.85rem; color: #94a3b8; margin-top: 0.5rem; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
    }
    th, td {
      padding: 0.6rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    th { color: #f97316; font-size: 0.85rem; text-transform: uppercase; }
    td a { color: #38bdf8; text-decoration: none; }
    td a:hover { text-decoration: underline; }
    .empty { color: #64748b; text-align: center; padding: 1.5rem; }
    .clicks-badge {
      background: #f97316;
      color: #fff;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .original-url { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
  </style>
</head>
<body>
  <h1>🔗 URL Shortener</h1>
  <p class="subtitle">Built with <strong style="color:#f97316">Hono</strong></p>

  <div class="card">
    <label for="url-input">Paste a long URL</label>
    <input type="url" id="url-input" placeholder="https://example.com/very/long/url..." />
    <button id="shorten-btn">Shorten URL</button>
    <div class="result" id="result">
      <span>Short URL: </span>
      <a id="short-link" href="#" target="_blank"></a>
      <div class="stats-label" id="stats-info"></div>
    </div>
  </div>

  <div class="card">
    <h2 style="margin-bottom:0.5rem;">All Shortened URLs</h2>
    <div id="url-list"><p class="empty">No URLs shortened yet.</p></div>
  </div>

  <script>
    const BASE = window.location.origin;

    async function shortenUrl() {
      const input = document.getElementById('url-input');
      const url = input.value.trim();
      if (!url) return;
      const res = await fetch(BASE + '/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.shortUrl) {
        const resultDiv = document.getElementById('result');
        const link = document.getElementById('short-link');
        link.href = data.shortUrl;
        link.textContent = data.shortUrl;
        document.getElementById('stats-info').textContent =
          'ID: ' + data.id + ' · Created: ' + new Date(data.createdAt).toLocaleString();
        resultDiv.classList.add('show');
        input.value = '';
        loadUrls();
      }
    }

    async function loadUrls() {
      const res = await fetch(BASE + '/api/urls');
      const data = await res.json();
      const container = document.getElementById('url-list');
      if (!data.urls || data.urls.length === 0) {
        container.innerHTML = '<p class="empty">No URLs shortened yet.</p>';
        return;
      }
      let html = '<table><thead><tr><th>Short</th><th>Original</th><th>Clicks</th></tr></thead><tbody>';
      for (const u of data.urls) {
        const short = BASE + '/' + u.id;
        html += '<tr>' +
          '<td><a href="' + short + '" target="_blank">' + u.id + '</a></td>' +
          '<td><span class="original-url" title="' + u.originalUrl + '">' + u.originalUrl + '</span></td>' +
          '<td><span class="clicks-badge">' + u.clicks + '</span></td>' +
          '</tr>';
      }
      html += '</tbody></table>';
      container.innerHTML = html;
    }

    document.getElementById('shorten-btn').addEventListener('click', shortenUrl);
    document.getElementById('url-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') shortenUrl();
    });
    loadUrls();
  </script>
</body>
</html>`)
})

// --- API Routes ---

// Create a short URL
app.post('/api/shorten', async (c) => {
  const body = await c.req.json<{ url: string }>()
  const { url } = body

  if (!url) {
    return c.json({ error: 'URL is required' }, 400)
  }

  try {
    new URL(url)
  } catch {
    return c.json({ error: 'Invalid URL' }, 400)
  }

  const id = generateId()
  const entry: UrlEntry = {
    id,
    originalUrl: url,
    clicks: 0,
    createdAt: new Date().toISOString(),
  }
  urls.set(id, entry)

  const host = c.req.header('host') || 'localhost:3000'
  const protocol = c.req.header('x-forwarded-proto') || 'http'
  const shortUrl = `${protocol}://${host}/${id}`

  return c.json({
    id,
    shortUrl,
    originalUrl: url,
    createdAt: entry.createdAt,
  }, 201)
})

// List all URLs
app.get('/api/urls', (c) => {
  const allUrls = Array.from(urls.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return c.json({ urls: allUrls })
})

// Get stats for a short URL
app.get('/api/urls/:id/stats', (c) => {
  const id = c.req.param('id')
  const entry = urls.get(id)
  if (!entry) {
    return c.json({ error: 'URL not found' }, 404)
  }
  return c.json(entry)
})

// Redirect short URL
app.get('/:id', (c) => {
  const id = c.req.param('id')
  const entry = urls.get(id)
  if (!entry) {
    return c.json({ error: 'URL not found' }, 404)
  }
  entry.clicks++
  return c.redirect(entry.originalUrl, 302)
})

const port = 3000
console.log(`🔥 URL Shortener running at http://localhost:${port}`)
serve({ fetch: app.fetch, port })
