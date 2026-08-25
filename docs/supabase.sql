-- Nöggi-Kahoot backend (Supabase) — vollständiges Schema, idempotent

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 14),
  score int not null check (score between 0 and 40000),
  correct int not null check (correct between 0 and 23),
  len int not null check (len in (10,23)),
  mode text not null check (mode in ('23','10','⚡10')),
  created_at timestamptz not null default now()
);
alter table public.scores enable row level security;
drop policy if exists "anon insert" on public.scores;
drop policy if exists "anon read" on public.scores;
create policy "anon insert" on public.scores for insert to anon with check (true);
create policy "anon read" on public.scores for select to anon using (true);

create table if not exists public.players (
  token uuid primary key,
  name text not null check (char_length(name) between 1 and 14),
  collected jsonb not null default '[]',
  fp text,
  updated_at timestamptz not null default now()
);
alter table public.players enable row level security;
create index if not exists players_fp_idx on public.players (fp);

drop function if exists public.player_upsert(uuid, text, jsonb);
create or replace function public.player_get(tok uuid)
returns table(name text, collected jsonb)
language sql security definer set search_path = public as
$$ select name, collected from players where token = tok $$;

create or replace function public.player_upsert(tok uuid, pname text, pcollected jsonb, pfp text)
returns void language sql security definer set search_path = public as
$$ insert into players(token, name, collected, fp) values (tok, pname, pcollected, pfp)
   on conflict (token) do update set name = excluded.name,
     collected = excluded.collected, fp = excluded.fp, updated_at = now() $$;

create or replace function public.player_by_fp(pfp text)
returns table(token uuid, name text, collected jsonb)
language sql security definer set search_path = public as
$$ select token, name, collected from players
   where fp = pfp and length(coalesce(pfp,'')) > 8
     and (select count(*) from players p2 where p2.fp = pfp) = 1 $$;

create or replace function public.player_by_name(pname text)
returns table(token uuid, name text, collected jsonb)
language sql security definer set search_path = public as
$$ select token, name, collected from players
   where lower(name) = lower(pname)
     and (select count(*) from players p2 where lower(p2.name) = lower(pname)) = 1 $$;

grant execute on function public.player_get(uuid) to anon;
grant execute on function public.player_upsert(uuid, text, jsonb, text) to anon;
grant execute on function public.player_by_fp(text) to anon;
grant execute on function public.player_by_name(text) to anon;
notify pgrst, 'reload schema';
