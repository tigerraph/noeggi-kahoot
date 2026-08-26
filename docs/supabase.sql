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

-- ---------------------------------------------------------------------------
-- 2026-08-26: arcade mode, wrong-answer reports, bonus points
-- ---------------------------------------------------------------------------

-- the arcade run (10 random questions, 5 s each) saves under mode '👾10'
alter table public.scores drop constraint if exists scores_mode_check;
alter table public.scores add constraint scores_mode_check
  check (mode in ('23','10','⚡10','👾10'));

-- players reporting an answer they believe is wrong. Insert-only: nobody reads
-- anyone else's report from the client, they are reviewed in the dashboard.
create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  qid text not null check (char_length(qid) between 1 and 40),
  claim text not null check (char_length(claim) between 1 and 200),
  name text check (char_length(name) between 1 and 14),
  token uuid,
  lang text check (lang in ('de','fr','en')),
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
drop policy if exists "anon insert" on public.feedback;
create policy "anon insert" on public.feedback for insert to anon with check (true);

-- manually granted points, e.g. 1000 for a confirmed report. Read-only for the
-- client, which adds them to that player's best run on the leaderboard.
create table if not exists public.bonus (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 14),
  points int not null check (points between -40000 and 40000),
  reason text,
  created_at timestamptz not null default now()
);
alter table public.bonus enable row level security;
drop policy if exists "anon read" on public.bonus;
create policy "anon read" on public.bonus for select to anon using (true);

-- Luki and Franky reported that Martin's neighbour is Sidney, not Frank.
insert into public.bonus (name, points, reason)
select v.name, v.points, v.reason
from (values ('Luki', 1000, 'neighbor: Sidney'),
             ('Franky', 1000, 'neighbor: Sidney')) as v(name, points, reason)
where not exists (
  select 1 from public.bonus b where b.name = v.name and b.reason = v.reason);

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 2026-08-26b: read access to reports, without handing out identity tokens
-- ---------------------------------------------------------------------------
-- feedback stays insert-only. This function exposes just the reviewable columns,
-- never `token` — whoever holds a token can adopt that player via the #p= link.
create or replace function public.feedback_list()
returns table(created_at timestamptz, qid text, claim text, name text, lang text)
language sql security definer set search_path = public as
$$ select f.created_at, f.qid, f.claim, f.name, f.lang
   from feedback f order by f.created_at desc limit 200 $$;
grant execute on function public.feedback_list() to anon;

notify pgrst, 'reload schema';

