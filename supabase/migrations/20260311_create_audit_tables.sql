create extension if not exists pgcrypto;

create table if not exists public.audit_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submission_mode text not null check (submission_mode in ('standard', 'guest')),
  company_name text,
  contact_name text,
  email text,
  industry text not null,
  employee_band text not null,
  website_url text,
  responses_json jsonb not null,
  source_page text not null default 'audit',
  utm_json jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  expires_at timestamptz,
  constraint standard_requires_email check (
    (submission_mode = 'guest')
    or (email is not null and length(trim(email)) > 3)
  )
);

create index if not exists audit_submissions_created_idx on public.audit_submissions (created_at desc);
create index if not exists audit_submissions_mode_idx on public.audit_submissions (submission_mode);
create index if not exists audit_submissions_email_idx on public.audit_submissions (email);

create table if not exists public.audit_reports (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.audit_submissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  report_token text not null unique,
  overall_score int not null check (overall_score >= 0 and overall_score <= 100),
  letter_grade text not null check (letter_grade in ('A', 'B', 'C', 'D', 'F')),
  pillar_scores_json jsonb not null,
  top_priority text not null,
  competitive_risk text not null,
  action_plan_json jsonb not null,
  recommended_service_json jsonb not null,
  model_meta_json jsonb not null default '{}'::jsonb,
  report_json jsonb not null,
  expires_at timestamptz
);

create index if not exists audit_reports_token_idx on public.audit_reports (report_token);
create index if not exists audit_reports_created_idx on public.audit_reports (created_at desc);
create index if not exists audit_reports_expires_idx on public.audit_reports (expires_at);

alter table public.audit_submissions enable row level security;
alter table public.audit_reports enable row level security;

-- No public read/write policies; edge functions with service role own access.
