create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  github_username text unique,
  display_name text,
  avatar_url text,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_active_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.run_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge text not null unique,
  mode text not null check (mode in ('snippet', 'timed', 'zen')),
  language text not null,
  duration_seconds integer,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz
);

create table public.runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.run_sessions(id) on delete set null,
  language text not null,
  mode text not null check (mode in ('snippet', 'timed', 'zen')),
  duration_ms integer not null check (duration_ms > 0),
  duration_seconds integer,
  wpm numeric(7, 2) not null check (wpm >= 0),
  raw_wpm numeric(7, 2) not null check (raw_wpm >= 0),
  accuracy numeric(5, 2) not null check (accuracy between 0 and 100),
  consistency numeric(5, 2) not null check (consistency between 0 and 100),
  correct_chars integer not null check (correct_chars >= 0),
  keystrokes integer not null check (keystrokes >= 0),
  mistakes integer not null check (mistakes >= 0),
  snippets_completed integer not null default 0 check (snippets_completed >= 0),
  source_repo text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index runs_user_created_idx on public.runs(user_id, created_at desc);
create index runs_global_leaderboard_idx on public.runs(mode, duration_seconds, wpm desc) where verified;
create index runs_language_leaderboard_idx on public.runs(language, mode, duration_seconds, wpm desc) where verified;
create index run_sessions_user_idx on public.run_sessions(user_id, started_at desc);

alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.run_sessions enable row level security;

create policy "Public profiles are readable"
on public.profiles for select
using (true);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Verified runs are public and users can read their own runs"
on public.runs for select
using (verified or auth.uid() = user_id);

create policy "Users can read their own run sessions"
on public.run_sessions for select
using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, github_username, display_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'user_name',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create view public.leaderboard_all_time
with (security_invoker = true)
as
select
  r.id,
  r.user_id,
  p.github_username,
  p.display_name,
  p.avatar_url,
  r.language,
  r.mode,
  r.duration_seconds,
  r.wpm,
  r.accuracy,
  r.created_at,
  dense_rank() over (
    partition by r.language, r.mode, r.duration_seconds
    order by r.wpm desc, r.accuracy desc, r.created_at asc
  ) as rank
from public.runs r
join public.profiles p on p.id = r.user_id
where r.verified;

grant select on public.profiles to anon, authenticated;
grant select on public.runs to anon, authenticated;
grant select on public.leaderboard_all_time to anon, authenticated;
