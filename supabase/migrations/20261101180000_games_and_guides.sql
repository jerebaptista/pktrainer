create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  generation integer,
  created_at timestamptz not null default now()
);

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  locale text not null,
  slug text not null,
  title text not null,
  content text not null default '',
  created_at timestamptz not null default now(),
  unique (game_id, locale, slug)
);

alter table public.games enable row level security;
alter table public.guides enable row level security;

create policy "games are publicly readable"
  on public.games
  for select
  to anon, authenticated
  using (true);

create policy "guides are publicly readable"
  on public.guides
  for select
  to anon, authenticated
  using (true);
