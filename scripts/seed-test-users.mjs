// Creates local test logins:
//   master / master  -> admin (master view)
//   test / test      -> client user attached to "Test Client" with random data
//
//   node --env-file=.env scripts/seed-test-users.mjs
//
// WARNING: these are deliberately weak credentials for local testing.
// Delete them before giving real clients access (see README).

import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

async function upsertUser(email, password, role, clientId, name) {
  const hash = bcrypt.hashSync(password, 12);
  await sql.query(
    `insert into users (client_id, email, name, password_hash, role)
     values ($1, $2, $3, $4, $5)
     on conflict (email) do update set password_hash = excluded.password_hash,
       role = excluded.role, client_id = excluded.client_id, name = excluded.name`,
    [clientId, email, name, hash, role]
  );
  console.log(`user ready: ${email} (${role})`);
}

function makeGrid(base, spread, n = 7) {
  const c = (n - 1) / 2;
  const maxD = Math.sqrt(2) * c;
  const ranks = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const d = Math.sqrt((i - c) ** 2 + (j - c) ** 2) / maxD;
      if (d * maxD > c + 0.3) { row.push(null); continue; }
      row.push(Math.max(1, Math.round(base + d * spread + (Math.random() - 0.5) * 4)));
    }
    ranks.push(row);
  }
  return ranks;
}

// ---- master admin ----
await upsertUser("master", "master", "admin", null, "Master");

// ---- test client with random data ----
const [client] = await sql.query(
  `insert into clients (slug, business_name, contact_name, email, phone, website, street, suburb, state, postcode, lat, lng, start_date)
   values ('test-client', 'Test Client', 'Terry Tester', 'terry@testclient.com.au', '07 3000 0000',
           'testclient.com.au', '1 Example St', 'Brisbane', 'QLD', '4000', -27.4698, 153.0251, '2026-04-01')
   on conflict (slug) do update set business_name = excluded.business_name
   returning id`
);
const cid = client.id;

await upsertUser("test", "test", "client", cid, "Terry Tester");

// wipe previous random data so re-running gives a fresh set
for (const t of ["traffic_monthly", "keywords", "gmb_heatmaps", "activity_log", "backlinks", "ai_visibility_checks", "approvals", "reports", "month_summaries"]) {
  await sql.query(`delete from ${t} where client_id = $1`, [cid]);
}

// traffic: Apr-Oct full months trending up + Nov partial
const months = ["2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"];
let visits = rand(200, 350);
for (const m of months) {
  await sql.query(
    `insert into traffic_monthly (client_id, month, visits, is_partial) values ($1, $2, $3, false)`,
    [cid, m, visits]
  );
  visits = Math.round(visits * (1 + rand(8, 30) / 100));
}
await sql.query(
  `insert into traffic_monthly (client_id, month, visits, is_partial) values ($1, '2026-11-01', $2, true)`,
  [cid, Math.round(visits * 0.55)]
);

// keywords
const kwNames = [
  "test service brisbane", "emergency test brisbane", "test company near me", "best test provider",
  "test repairs brisbane", "test installation qld", "cheap test brisbane", "test quotes brisbane",
  "licensed test contractor", "test maintenance brisbane", "24 hour test brisbane", "test experts northside",
];
for (const [i, kw] of kwNames.entries()) {
  const started = Math.random() < 0.75 ? rand(12, 45) : null;
  const now = Math.max(1, (started ?? rand(8, 25)) - rand(0, 20));
  await sql.query(
    `insert into keywords (client_id, keyword, start_position, current_position, start_visits, current_visits, featured)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [cid, kw, started, now, started ? rand(0, 40) : 0, rand(5, 190), i < 8]
  );
}

// heatmaps for 3 keywords: before (bad) + now (good)
for (const kw of kwNames.slice(0, 3)) {
  await sql.query(
    `insert into gmb_heatmaps (client_id, keyword, captured_on, grid_size, ranks) values ($1, $2, '2026-04-01', 7, $3)`,
    [cid, kw, JSON.stringify(makeGrid(rand(9, 20), rand(6, 20)))]
  );
  await sql.query(
    `insert into gmb_heatmaps (client_id, keyword, captured_on, grid_size, ranks) values ($1, $2, '2026-11-15', 7, $3)`,
    [cid, kw, JSON.stringify(makeGrid(rand(1, 4), rand(4, 10)))]
  );
}

// activity log: ~5 entries per month
const types = {
  "Content": ["Published blog post about testing", "Drafted a new service page", "Published a suburb page"],
  "Google My Business": ["Replied to new reviews", "Uploaded job photos to your profile", "Posted a profile update"],
  "On-page": ["Rewrote page titles and descriptions", "Added FAQ sections", "Improved internal links"],
  "Backlinks": ["New directory listing went live", "Earned a link from a local blog"],
  "Technical": ["Fixed broken links from the weekly crawl", "Compressed images", "Improved page speed"],
  "Keywords": ["Added a new tracked keyword", "Reviewed keyword targets"],
  "AI visibility": ["Ran the monthly AI visibility check", "Added structured business details"],
};
const gmbSubtypes = ["Reviews", "Posts", "Photos", "Profile updates"];
for (let m = 4; m <= 11; m++) {
  const count = m === 11 ? 4 : rand(4, 7);
  for (let i = 0; i < count; i++) {
    const type = pick(Object.keys(types));
    await sql.query(
      `insert into activity_log (client_id, occurred_on, type, subtype, body) values ($1, $2, $3, $4, $5)`,
      [
        cid,
        `2026-${String(m).padStart(2, "0")}-${String(rand(1, m === 11 ? 15 : 28)).padStart(2, "0")}`,
        type,
        type === "Google My Business" ? pick(gmbSubtypes) : null,
        pick(types[type]),
      ]
    );
  }
  await sql.query(
    `insert into month_summaries (client_id, month, summary) values ($1, $2, $3)
     on conflict (client_id, month) do update set summary = excluded.summary`,
    [cid, `2026-${String(m).padStart(2, "0")}-01`, "Randomly generated test summary for this month's work."]
  );
}

// backlinks
const sites = [
  ["Test Directory AU", "testdirectory.com.au", "Directory"],
  ["Brisbane Business Hub", "brisbanebusinesshub.com.au", "Directory"],
  ["Local Trades Blog", "localtradesblog.com.au", "Blog article"],
  ["QLD Services Index", "qldservicesindex.com.au", "Directory"],
  ["Test Reviews AU", "testreviews.com.au", "Directory"],
  ["Home Improvement Weekly", "homeimprovementweekly.com.au", "Blog article"],
];
for (const [name, domain, type] of sites) {
  await sql.query(
    `insert into backlinks (client_id, obtained_on, site_name, domain, link_type, target_page) values ($1, $2, $3, $4, $5, $6)`,
    [cid, `2026-${String(rand(5, 11)).padStart(2, "0")}-${String(rand(1, 28)).padStart(2, "0")}`, name, domain, type, pick(["Home page", "Services page"])]
  );
}

// AI checks trending up
let score = rand(10, 25);
for (const [i, d] of ["2026-04-10", "2026-06-05", "2026-08-03", "2026-10-02", "2026-11-05"].entries()) {
  await sql.query(
    `insert into ai_visibility_checks (client_id, checked_on, score) values ($1, $2, $3)`,
    [cid, d, Math.min(95, score)]
  );
  score += rand(5, 15);
}

// pending approvals
const approvalDefs = [
  ["Blog post", "file-text", "#2c54f2", "Publish “Is this test working? A complete guide”", "Randomly generated draft article awaiting your approval."],
  ["GMB post", "megaphone", "#15803d", "Post “November special on test services”", "A profile update with a photo and a call button."],
  ["Backlink outreach", "link", "#dc2626", "Contact 4 local directories", "Emails asking for a listing or a link back to your site."],
];
for (const [type, icon, color, title, detail] of approvalDefs) {
  await sql.query(
    `insert into approvals (client_id, type, icon, color, requested_on, title, detail) values ($1, $2, $3, $4, $5, $6, $7)`,
    [cid, type, icon, color, `2026-11-${String(rand(10, 15)).padStart(2, "0")}`, title, detail]
  );
}

// reports
await sql.query(
  `insert into reports (client_id, title, period_start, period_end, issued_on, available)
   values ($1, '6-month report: 1 April to 30 September 2026', '2026-04-01', '2026-09-30', '2026-10-05', true)`,
  [cid]
);
await sql.query(
  `insert into reports (client_id, title, period_start, period_end, due_on, available)
   values ($1, '12-month report: 1 October 2026 to 31 March 2027', '2026-10-01', '2027-03-31', '2027-04-05', false)`,
  [cid]
);

console.log("Test client seeded: test-client (login test / test)");
console.log("Done.");
