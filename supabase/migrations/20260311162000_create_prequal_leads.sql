create table if not exists public.prequal_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  company_name text not null,
  industry text not null,
  employee_band text not null,
  bottleneck text not null,
  source_page text not null default 'homepage',
  utm_json jsonb not null default '{}'::jsonb,
  user_agent text
);

create index if not exists prequal_leads_created_idx on public.prequal_leads (created_at desc);
create index if not exists prequal_leads_industry_idx on public.prequal_leads (industry);

alter table public.prequal_leads enable row level security;

-- No public read/write policies; edge functions with service role own access.
