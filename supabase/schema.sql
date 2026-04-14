-- ============================================================
-- Clash Check Diary — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Projects table
create table if not exists projects (
  id         uuid default gen_random_uuid() primary key,
  name       text not null unique,
  tab_color  text default '#0D9488',
  created_at timestamptz default now()
);

-- Packages table
create table if not exists packages (
  id            uuid default gen_random_uuid() primary key,
  project_id    uuid references projects(id) on delete cascade not null,
  row_no        integer,
  work_package  text,
  actual_start  date,
  actual_finish date,
  status        text default 'PENDING',
  str_mep       integer default 0,
  arc_str       integer default 0,
  arc_mep       integer default 0,
  mep_mep       integer default 0,
  coordinator   text,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Index for faster queries
create index if not exists packages_project_id_idx on packages(project_id);
create index if not exists packages_status_idx      on packages(status);
create index if not exists packages_coordinator_idx on packages(coordinator);

-- Row Level Security — all authenticated users can read/write
alter table projects enable row level security;
alter table packages enable row level security;

create policy "Auth read projects"  on projects for select to authenticated using (true);
create policy "Auth insert projects" on projects for insert to authenticated with check (true);
create policy "Auth update projects" on projects for update to authenticated using (true);
create policy "Auth delete projects" on projects for delete to authenticated using (true);

create policy "Auth read packages"   on packages for select to authenticated using (true);
create policy "Auth insert packages" on packages for insert to authenticated with check (true);
create policy "Auth update packages" on packages for update to authenticated using (true);
create policy "Auth delete packages" on packages for delete to authenticated using (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger packages_updated_at
  before update on packages
  for each row execute function update_updated_at();
