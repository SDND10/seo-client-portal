-- SEO Client Portal schema (Neon Postgres)

create extension if not exists pgcrypto;

create sequence if not exists client_code_seq start 1001;

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  client_code text unique not null default ('C' || nextval('client_code_seq')),
  slug text unique not null,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  street text,
  suburb text,
  state text,
  postcode text,
  lat double precision,
  lng double precision,
  start_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  email text unique not null,
  name text,
  password_hash text not null,
  role text not null check (role in ('admin', 'client')),
  created_at timestamptz not null default now()
);

create table if not exists traffic_monthly (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  month date not null,
  visits integer not null,
  is_partial boolean not null default false,
  unique (client_id, month)
);

create table if not exists keywords (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  keyword text not null,
  start_position integer,
  current_position integer,
  start_visits integer not null default 0,
  current_visits integer not null default 0,
  featured boolean not null default false,
  unique (client_id, keyword)
);

create table if not exists gmb_heatmaps (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  keyword text not null,
  captured_on date not null,
  grid_size integer not null default 7,
  ranks jsonb not null,
  unique (client_id, keyword, captured_on)
);

create table if not exists activity_log (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  occurred_on date not null,
  type text not null,
  subtype text,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists backlinks (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  obtained_on date not null,
  site_name text not null,
  domain text not null,
  link_type text not null default 'Directory',
  target_page text,
  unique (client_id, domain, target_page, obtained_on)
);

create table if not exists ai_visibility_checks (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  checked_on date not null,
  score integer not null,
  unique (client_id, checked_on)
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type text not null,
  icon text not null default 'file-text',
  color text not null default '#2c54f2',
  title text not null,
  detail text,
  requested_on date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  decided_at timestamptz,
  external_ref text
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  title text not null,
  period_start date,
  period_end date,
  issued_on date,
  due_on date,
  url text,
  available boolean not null default false
);

create table if not exists month_summaries (
  id bigserial primary key,
  client_id uuid not null references clients(id) on delete cascade,
  month date not null,
  summary text not null,
  unique (client_id, month)
);

create index if not exists idx_activity_client_date on activity_log (client_id, occurred_on desc);
create index if not exists idx_traffic_client_month on traffic_monthly (client_id, month);
create index if not exists idx_approvals_client_status on approvals (client_id, status);
create index if not exists idx_backlinks_client_date on backlinks (client_id, obtained_on desc);
create index if not exists idx_heatmaps_client_kw on gmb_heatmaps (client_id, keyword, captured_on)
