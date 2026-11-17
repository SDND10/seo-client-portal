// Sets up the Neon database: runs the schema, creates the master (admin) login,
// and with --demo seeds a demo client (Northside Plumbing) with example data.
//
//   npm run db:setup          schema + admin user
//   npm run db:demo           schema + admin user + demo client with data
//
// Requires .env with DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (and optional ADMIN_NAME).

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const demo = process.argv.includes("--demo");

async function runSchema() {
  const schema = readFileSync(join(root, "db", "schema.sql"), "utf8");
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) await sql.query(stmt);
  console.log(`Schema applied (${statements.length} statements).`);
}

async function createAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set - skipping admin user creation.");
    return;
  }
  const hash = bcrypt.hashSync(ADMIN_PASSWORD, 12);
  await sql.query(
    `insert into users (email, name, password_hash, role)
     values ($1, $2, $3, 'admin')
     on conflict (email) do update set password_hash = excluded.password_hash, name = excluded.name, role = 'admin'`,
    [ADMIN_EMAIL.toLowerCase(), ADMIN_NAME || "Admin", hash]
  );
  console.log(`Admin user ready: ${ADMIN_EMAIL}`);
}

// Same pseudo-noise the design mock used, so demo heatmaps look like the design.
function makeGrid(seed, base, spread, n = 7) {
  const c = (n - 1) / 2;
  const maxD = Math.sqrt(2) * c;
  const ranks = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const d = Math.sqrt((i - c) ** 2 + (j - c) ** 2) / maxD;
      if (d * maxD > c + 0.3) {
        row.push(null);
        continue;
      }
      const r = Math.sin(i * 12.9898 + j * 78.233 + seed * 37.719 + base) * 43758.5453;
      const noise = r - Math.floor(r);
      row.push(Math.max(1, Math.round(base + d * spread + (noise - 0.5) * 4)));
    }
    ranks.push(row);
  }
  return ranks;
}

async function seedDemo() {
  const [client] = await sql.query(
    `insert into clients (slug, business_name, contact_name, email, phone, website, street, suburb, state, postcode, lat, lng, start_date)
     values ('northside-plumbing', 'Northside Plumbing', 'Daniel Reid', 'daniel@northsideplumbing.com.au', '07 3555 0142',
             'northsideplumbing.com.au', '14 Kittyhawk Drive', 'Chermside', 'QLD', '4032', -27.3857, 153.0312, '2026-05-12')
     on conflict (slug) do update set business_name = excluded.business_name
     returning id`
  );
  const cid = client.id;

  const hash = bcrypt.hashSync("demo-password-123", 12);
  await sql.query(
    `insert into users (client_id, email, name, password_hash, role)
     values ($1, 'demo@northsideplumbing.com.au', 'Daniel Reid', $2, 'client')
     on conflict (email) do nothing`,
    [cid, hash]
  );

  const traffic = [
    ["2026-05-01", 412, false], ["2026-06-01", 450, false], ["2026-07-01", 655, false],
    ["2026-08-01", 700, false], ["2026-09-01", 985, false], ["2026-10-01", 1120, false],
    ["2026-11-01", 640, true],
  ];
  for (const [m, v, p] of traffic) {
    await sql.query(
      `insert into traffic_monthly (client_id, month, visits, is_partial) values ($1, $2, $3, $4)
       on conflict (client_id, month) do update set visits = excluded.visits, is_partial = excluded.is_partial`,
      [cid, m, v, p]
    );
  }

  const keywords = [
    ["plumber chermside", 12, 2, 38, 186, true],
    ["plumber aspley", 18, 3, 9, 92, false],
    ["blocked drain brisbane", 27, 4, 6, 148, true],
    ["plumber kedron", 21, 5, 5, 54, false],
    ["plumber brisbane northside", 34, 6, 3, 71, true],
    ["emergency plumber brisbane", null, 8, 0, 64, true],
    ["hot water repair brisbane", 41, 9, 1, 43, true],
    ["gas fitter brisbane", 19, 11, 11, 28, true],
    ["drain camera inspection brisbane", 38, 12, 1, 12, false],
    ["blocked toilet brisbane", 30, 13, 4, 17, false],
    ["plumber near me", null, 14, 0, 36, true],
    ["toilet repair brisbane", 15, 15, 14, 15, true],
    ["backflow testing brisbane", 26, 16, 3, 8, false],
    ["burst pipe repair brisbane", null, 17, 0, 9, true],
    ["hot water system installation brisbane", null, 19, 0, 7, false],
    ["leaking tap repair", 22, 25, 7, 5, true],
  ];
  for (const [kw, sp, cp, sv, cv, f] of keywords) {
    await sql.query(
      `insert into keywords (client_id, keyword, start_position, current_position, start_visits, current_visits, featured)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (client_id, keyword) do update set start_position = excluded.start_position,
         current_position = excluded.current_position, start_visits = excluded.start_visits,
         current_visits = excluded.current_visits, featured = excluded.featured`,
      [cid, kw, sp, cp, sv, cv, f]
    );
  }

  const heatKeywords = [
    ["plumber brisbane northside", 0, [9, 22], [1, 8]],
    ["blocked drain brisbane", 1, [12, 20], [1, 6]],
    ["emergency plumber brisbane", 2, [22, 6], [3, 13]],
  ];
  for (const [kw, seed, before, now] of heatKeywords) {
    await sql.query(
      `insert into gmb_heatmaps (client_id, keyword, captured_on, grid_size, ranks)
       values ($1, $2, '2026-05-12', 7, $3)
       on conflict (client_id, keyword, captured_on) do update set ranks = excluded.ranks`,
      [cid, kw, JSON.stringify(makeGrid(seed, before[0], before[1]))]
    );
    await sql.query(
      `insert into gmb_heatmaps (client_id, keyword, captured_on, grid_size, ranks)
       values ($1, $2, '2026-11-15', 7, $3)
       on conflict (client_id, keyword, captured_on) do update set ranks = excluded.ranks`,
      [cid, kw, JSON.stringify(makeGrid(seed + 10, now[0], now[1]))]
    );
  }

  const log = [
    ["2026-11-14", "Content", null, "Drafted blog post “How much does a blocked drain cost to fix in Brisbane?”"],
    ["2026-11-13", "Google My Business", "Reviews", "Drafted a reply to a new 5-star review from Karen M."],
    ["2026-11-13", "Google My Business", "Photos", "Uploaded 4 job photos to your profile"],
    ["2026-11-12", "On-page", null, "Rewrote the title and meta description on the Hot Water Repairs page"],
    ["2026-11-11", "Backlinks", null, "Listing went live on a Brisbane trades directory"],
    ["2026-11-10", "Technical", null, "Fixed 3 broken internal links found in the weekly crawl"],
    ["2026-11-09", "Keywords", null, "Added “burst pipe repair brisbane” to tracked keywords"],
    ["2026-11-07", "Content", null, "Published blog post “5 signs your hot water system is about to fail”"],
    ["2026-11-06", "Google My Business", "Profile updates", "Updated holiday trading hours"],
    ["2026-11-05", "Technical", null, "Compressed 18 images on the Services pages"],
    ["2026-11-02", "AI visibility", null, "Ran the monthly AI visibility check across 20 customer questions. Score: 62"],
    ["2026-10-29", "Content", null, "Published blog post “What to do when your hot water system leaks”"],
    ["2026-10-24", "Backlinks", null, "Earned a link from a Brisbane home renovation blog"],
    ["2026-10-21", "AI visibility", null, "Added question-and-answer content to the Hot Water Repairs page so AI assistants can quote it"],
    ["2026-10-20", "Google My Business", "Reviews", "Replied to 3 new reviews"],
    ["2026-10-15", "On-page", null, "Added FAQ sections to the Blocked Drains and Gas Fitting pages"],
    ["2026-10-09", "Technical", null, "Added local business markup to the home page"],
    ["2026-10-06", "AI visibility", null, "Ran the monthly AI visibility check. Score: 55"],
    ["2026-10-03", "Google My Business", "Posts", "Posted “Spring drain inspections” update"],
    ["2026-09-28", "Content", null, "Published a suburb page for Aspley"],
    ["2026-09-22", "Keywords", null, "Added “emergency plumber brisbane” to tracked keywords"],
    ["2026-09-18", "AI visibility", null, "Added structured business details (services, areas, hours) that AI assistants read"],
    ["2026-09-17", "Backlinks", null, "Listings went live on two national trade directories"],
    ["2026-09-11", "On-page", null, "Rewrote the headings on the Emergency Plumbing page"],
    ["2026-09-05", "Google My Business", "Profile updates", "Added 12 services to your profile"],
    ["2026-09-02", "Technical", null, "Fixed a mobile layout problem on the contact form"],
    ["2026-09-01", "AI visibility", null, "Ran the monthly AI visibility check. Score: 41"],
    ["2026-08-27", "Content", null, "Published blog post “Why does my drain keep blocking?”"],
    ["2026-08-21", "Google My Business", "Photos", "Uploaded 6 job photos to your profile"],
    ["2026-08-14", "Backlinks", null, "Submitted your business to 5 local directories"],
    ["2026-08-12", "AI visibility", null, "Published an “About Northside Plumbing” page with licence details and service areas"],
    ["2026-08-08", "On-page", null, "Added internal links between the service pages"],
    ["2026-08-04", "Technical", null, "Set up redirects for 7 old page addresses"],
    ["2026-08-03", "AI visibility", null, "Ran the monthly AI visibility check. Score: 33"],
    ["2026-07-30", "Content", null, "Published suburb pages for Chermside and Kedron"],
    ["2026-07-23", "Google My Business", "Reviews", "Replied to 4 reviews"],
    ["2026-07-20", "AI visibility", null, "Made your business name, address and phone consistent across the sources AI assistants cite"],
    ["2026-07-16", "On-page", null, "Rewrote the title and meta description on 6 service pages"],
    ["2026-07-09", "Keywords", null, "Added “plumber near me” to tracked keywords"],
    ["2026-07-02", "Technical", null, "Improved load speed on the home page"],
    ["2026-06-26", "Content", null, "Published blog post “Gas vs electric hot water: running costs”"],
    ["2026-06-18", "Google My Business", "Profile updates", "Updated business categories and service areas"],
    ["2026-06-11", "Backlinks", null, "Fixed inconsistent business details on 9 directory listings"],
    ["2026-06-10", "AI visibility", null, "Allowed AI search crawlers to read the site"],
    ["2026-06-04", "Technical", null, "Submitted an updated sitemap to Google"],
    ["2026-05-28", "On-page", null, "Rewrote the home page title and headings"],
    ["2026-05-21", "Google My Business", "Profile updates", "Completed your profile: description, hours and services"],
    ["2026-05-15", "Keywords", null, "Set up tracking for 7 keywords"],
    ["2026-05-14", "AI visibility", null, "Ran the first AI visibility check across 20 customer questions. Score: 18"],
    ["2026-05-13", "Technical", null, "Ran the first full site audit and fixed 14 errors"],
    ["2026-05-12", "Technical", null, "Connected Google Search Console and Analytics"],
  ];
  await sql.query(`delete from activity_log where client_id = $1`, [cid]);
  for (const [d, type, subtype, body] of log) {
    await sql.query(
      `insert into activity_log (client_id, occurred_on, type, subtype, body) values ($1, $2, $3, $4, $5)`,
      [cid, d, type, subtype, body]
    );
  }

  const backlinks = [
    ["2026-11-11", "Brisbane Trades Directory", "brisbanetradesdirectory.com.au", "Directory", "Home page"],
    ["2026-10-24", "Renovate Brisbane", "renovatebrisbane.com.au", "Blog article", "Blocked Drains page"],
    ["2026-09-17", "hipages", "hipages.com.au", "Directory", "Home page"],
    ["2026-09-17", "Oneflare", "oneflare.com.au", "Directory", "Home page"],
    ["2026-09-02", "Localsearch", "localsearch.com.au", "Directory", "Home page"],
    ["2026-08-26", "True Local", "truelocal.com.au", "Directory", "Home page"],
    ["2026-08-22", "Hotfrog", "hotfrog.com.au", "Directory", "Home page"],
    ["2026-08-19", "StartLocal", "startlocal.com.au", "Directory", "Home page"],
    ["2026-08-18", "Yellow Pages", "yellowpages.com.au", "Directory", "Home page"],
  ];
  for (const [d, name, domain, type, target] of backlinks) {
    await sql.query(
      `insert into backlinks (client_id, obtained_on, site_name, domain, link_type, target_page)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (client_id, domain, target_page, obtained_on) do nothing`,
      [cid, d, name, domain, type, target]
    );
  }

  const checks = [
    ["2026-05-14", 18], ["2026-08-03", 33], ["2026-09-01", 41], ["2026-10-06", 55], ["2026-11-02", 62],
  ];
  for (const [d, score] of checks) {
    await sql.query(
      `insert into ai_visibility_checks (client_id, checked_on, score) values ($1, $2, $3)
       on conflict (client_id, checked_on) do update set score = excluded.score`,
      [cid, d, score]
    );
  }

  const approvals = [
    ["Blog post", "file-text", "#2c54f2", "2026-11-14",
     "Publish “How much does a blocked drain cost to fix in Brisbane?”",
     "1,200-word article targeting “blocked drain brisbane”. Goes live on your blog once approved."],
    ["GMB post", "megaphone", "#15803d", "2026-11-13",
     "Post “Same-day hot water repairs across the northside”",
     "Update for your Google Business Profile with a photo from last week’s Chermside job and a call button."],
    ["GMB review reply", "message-square", "#7c4dff", "2026-11-13",
     "Reply to Karen M.’s 5-star review",
     "“Thanks Karen, glad we could get your hot water back on the same day. Appreciate you taking the time to leave a review.”"],
    ["Backlink outreach", "link", "#dc2626", "2026-11-12",
     "Contact 6 local directories and trade blogs",
     "Emails sent from your business address asking for a listing or a link back to your site."],
  ];
  await sql.query(`delete from approvals where client_id = $1 and status = 'pending'`, [cid]);
  for (const [type, icon, color, d, title, detail] of approvals) {
    await sql.query(
      `insert into approvals (client_id, type, icon, color, requested_on, title, detail) values ($1, $2, $3, $4, $5, $6, $7)`,
      [cid, type, icon, color, d, title, detail]
    );
  }

  await sql.query(
    `insert into reports (client_id, title, period_start, period_end, issued_on, available)
     select $1, '6-month report: 12 May to 11 November 2026', '2026-05-12', '2026-11-11', '2026-11-12', true
     where not exists (select 1 from reports where client_id = $1 and available = true)`,
    [cid]
  );
  await sql.query(
    `insert into reports (client_id, title, period_start, period_end, due_on, available)
     select $1, '12-month report: 12 November 2026 to 11 May 2027', '2026-11-12', '2027-05-11', '2027-05-12', false
     where not exists (select 1 from reports where client_id = $1 and available = false)`,
    [cid]
  );

  const summaries = [
    ["2026-11-01", "Hot water and blocked drain content, review replies, and a new directory listing. Month in progress."],
    ["2026-10-01", "FAQ sections on two service pages, local business markup, and a link from a renovation blog."],
    ["2026-09-01", "New Aspley suburb page, 12 services added to your Google profile, and two national directory listings."],
    ["2026-08-01", "Local directory submissions, internal linking between service pages, and redirects for old addresses."],
    ["2026-07-01", "Suburb pages for Chermside and Kedron, and new titles and descriptions on 6 service pages."],
    ["2026-06-01", "Cleaned up directory listings, updated Google profile categories, and sent Google a new sitemap."],
    ["2026-05-01", "Setup month: tracking connected, first site audit, Google profile completed, and keywords chosen."],
  ];
  for (const [m, s] of summaries) {
    await sql.query(
      `insert into month_summaries (client_id, month, summary) values ($1, $2, $3)
       on conflict (client_id, month) do update set summary = excluded.summary`,
      [cid, m, s]
    );
  }

  console.log("Demo client seeded: northside-plumbing (login demo@northsideplumbing.com.au / demo-password-123)");
}

await runSchema();
await createAdmin();
if (demo) await seedDemo();
console.log("Done.");
