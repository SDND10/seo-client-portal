# SEO Client Portal

A client portal for Network Digital's SEO clients. Clients log in and see their
rankings, organic traffic, Google Maps visibility, backlinks, AI visibility and a
full activity log — fed automatically by your Grok bot through an API, with
Neon Postgres as the database.

Built with Next.js (App Router) + Neon serverless Postgres.

## Pages

| Route | What it shows |
| --- | --- |
| `/login` | Log in / forgot password |
| `/` | Home dashboard: traffic, approvals, GMB snapshot, keyword overview, recent activity |
| `/keywords` | "Where we started" vs "Where we are now" keyword boards |
| `/google-my-business` | Maps-ranking heatmaps (before/now) + GMB activity |
| `/technical-seo` | Technical work, grouped by month |
| `/backlinking` | Backlinks table |
| `/ai-visibility` | AI visibility score + related activity |
| `/activity` | Full activity log with filters, search and month cards |
| `/reports` | Six-monthly reports |
| `/settings` | Profile, password, light/dark mode |
| `/admin` | **Master view** (you only): all clients, add clients, open any client's portal |

## Setup

1. **Create a Neon project** at https://neon.tech and copy the connection string.

2. **Configure environment**:

   ```bash
   cp .env.example .env
   # then edit .env:
   #   DATABASE_URL    - your Neon connection string
   #   SESSION_SECRET  - openssl rand -hex 32
   #   INGEST_API_KEY  - openssl rand -hex 32  (give this to your Grok bot)
   #   ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME - your master login
   ```

3. **Create the schema + your master login**:

   ```bash
   npm install
   npm run db:setup        # schema + admin user
   npm run db:demo         # optional: also seeds a demo client (Northside Plumbing)
   ```

   The demo client login is `demo@northsideplumbing.com.au` / `demo-password-123`.

   For quick local testing you can also create throwaway logins
   (`master`/`master` as admin, `test`/`test` as a client with random data):

   ```bash
   node --env-file=.env scripts/seed-test-users.mjs
   ```

   **These are deliberately weak credentials — delete them before real clients
   use the portal**: `delete from users where email in ('master', 'test');`

4. **Run it**:

   ```bash
   npm run dev             # http://localhost:3000
   ```

Log in with your `ADMIN_EMAIL` to reach the master view; add clients there
(including their portal login). Client logins land straight on their own portal
and can never see anyone else's data.

## Roles

- **client** — tied to one client; sees only that client's portal.
- **admin** (you) — sees the master view at `/admin`, can create clients and open
  any client's portal via the switcher bar at the top.

## Feeding data from your Grok bot

Everything on the portal is driven by one endpoint. Authenticate with the
`INGEST_API_KEY` from `.env`:

```
POST https://your-portal-domain/api/ingest
Authorization: Bearer <INGEST_API_KEY>
Content-Type: application/json
```

Every section is optional — send only what changed. All writes are upserts, so
re-sending the same data is safe (no duplicates).

```jsonc
{
  "client": "northside-plumbing",          // the client slug (shown in /admin)

  "traffic": [
    { "month": "2026-10", "visits": 1120 },
    { "month": "2026-11", "visits": 640, "partial": true }   // month in progress
  ],

  "keywords": [
    {
      "keyword": "blocked drain brisbane",
      "start_position": 27,        // null = not ranked when you started
      "current_position": 4,
      "start_visits": 6,
      "current_visits": 148,
      "featured": true             // show on the home-page overview
    }
  ],

  "heatmaps": [
    {
      "keyword": "blocked drain brisbane",
      "captured_on": "2026-11-15",
      "grid_size": 7,
      "ranks": [ [null, 5, 3, "..."], "... 7 rows of 7 ..." ]
      // each cell: Maps rank at that grid point; null = not measured; 21 = not in top 20
    }
  ],

  "activity": [
    { "date": "2026-11-14", "type": "Content", "text": "Drafted blog post ..." },
    { "date": "2026-11-13", "type": "Google My Business", "subtype": "Reviews", "text": "Replied to ..." }
    // types: Content, Google My Business, On-page, Backlinks, Technical, Keywords, AI visibility
    // GMB subtypes: Reviews, Posts, Photos, Profile updates
  ],

  "backlinks": [
    { "date": "2026-11-11", "site_name": "Brisbane Trades Directory",
      "domain": "brisbanetradesdirectory.com.au", "type": "Directory", "target": "Home page" }
  ],

  "ai_checks": [
    { "date": "2026-11-02", "score": 62 }
  ],

  "approvals": [
    {
      "ref": "blog-post-128",      // your bot's stable id; re-sending the same ref updates it
      "type": "Blog post",
      "title": "Publish \"How much does a blocked drain cost?\"",
      "detail": "1,200-word article targeting ...",
      "date": "2026-11-14",
      "icon": "file-text",         // file-text | megaphone | message-square | link ...
      "color": "#2c54f2"
    }
  ],

  "reports": [
    { "title": "6-month report: 12 May to 11 November 2026",
      "period_start": "2026-05-12", "period_end": "2026-11-11",
      "issued_on": "2026-11-12", "url": "https://...", "available": true }
  ],

  "summaries": [
    { "month": "2026-11", "summary": "Hot water content, review replies, ..." }
  ]
}
```

Example curl:

```bash
curl -X POST https://your-portal-domain/api/ingest \
  -H "Authorization: Bearer $INGEST_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"client":"northside-plumbing","ai_checks":[{"date":"2026-12-01","score":66}]}'
```

### Reading approval decisions back

Clients approve/reject actions in the portal. Your bot polls for decisions:

```
GET /api/ingest?client=northside-plumbing&decisions=2026-11-01
Authorization: Bearer <INGEST_API_KEY>
```

Returns `{ "decisions": [ { "ref": "blog-post-128", "status": "approved", "decided_at": "..." } ] }`
so the bot knows which work it may carry out.

## Deploying

The app is a standard Next.js app — deploy to Vercel (recommended with Neon),
or anywhere Node runs:

```bash
npm run build && npm start
```

Set the same environment variables (`DATABASE_URL`, `SESSION_SECRET`,
`INGEST_API_KEY`) in your host's settings. Point your Grok bot at the deployed
URL.

## Not wired up yet

- **Password-reset emails** — the "Forgot your password?" screen shows the
  confirmation message but does not send email yet (needs an email provider such
  as Resend/Postmark). Until then, reset client passwords yourself: run
  `node --env-file=.env -e "..."` or ask Claude Code to add an admin reset. 
- **Report files** — a report row links to whatever `url` you supply (e.g. a PDF
  in cloud storage). Rows without a URL show "Ask your SEO manager for the file".
