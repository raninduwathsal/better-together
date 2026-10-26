-- Create profiles table
create table if not exists public.profiles (
  id text primary key,
  name text not null,
  role text,
  avatar_color text default '#7C3AED',
  created_at bigint default (extract(epoch from now()) * 1000)::bigint
);

alter table public.profiles enable row level security;
drop policy if exists "Allow public read access on profiles" on public.profiles;
drop policy if exists "Allow public insert on profiles" on public.profiles;
drop policy if exists "Allow public update on profiles" on public.profiles;
drop policy if exists "Allow public delete on profiles" on public.profiles;

create policy "Allow public read access on profiles" on public.profiles for select using (true);
create policy "Allow public insert on profiles" on public.profiles for insert with check (true);
create policy "Allow public update on profiles" on public.profiles for update using (true);
create policy "Allow public delete on profiles" on public.profiles for delete using (true);

-- Insert default profiles for Savithmi & Ranindu
insert into public.profiles (id, name, role, avatar_color)
values 
  ('user_savithmi', 'Savithmi', 'Student & Researcher', '#7C3AED'),
  ('user_ranindu', 'Ranindu', 'Software Engineer', '#9333EA')
on conflict (id) do nothing;

-- Create todos table
create table if not exists public.todos (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'Study',
  completed boolean default false,
  created_at bigint default (extract(epoch from now()) * 1000)::bigint,
  completed_at bigint
);

alter table public.todos enable row level security;
drop policy if exists "Allow public select on todos" on public.todos;
drop policy if exists "Allow public insert on todos" on public.todos;
drop policy if exists "Allow public update on todos" on public.todos;
drop policy if exists "Allow public delete on todos" on public.todos;

create policy "Allow public select on todos" on public.todos for select using (true);
create policy "Allow public insert on todos" on public.todos for insert with check (true);
create policy "Allow public update on todos" on public.todos for update using (true);
create policy "Allow public delete on todos" on public.todos for delete using (true);

-- Create sessions table
create table if not exists public.sessions (
  id text primary key,
  user_id text not null references public.profiles(id) on delete cascade,
  user_name text not null,
  working_on text not null,
  category text not null,
  start_time bigint not null,
  end_time bigint not null,
  duration_seconds integer not null default 0,
  is_pomodoro boolean default false,
  pomodoro_cycles_completed integer default 0,
  notes text,
  todo_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sessions enable row level security;
drop policy if exists "Allow public select on sessions" on public.sessions;
drop policy if exists "Allow public insert on sessions" on public.sessions;
drop policy if exists "Allow public update on sessions" on public.sessions;
drop policy if exists "Allow public delete on sessions" on public.sessions;

create policy "Allow public select on sessions" on public.sessions for select using (true);
create policy "Allow public insert on sessions" on public.sessions for insert with check (true);
create policy "Allow public update on sessions" on public.sessions for update using (true);
create policy "Allow public delete on sessions" on public.sessions for delete using (true);

-- Enable real-time for live sync between devices if not already added
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions') then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'todos') then
    alter publication supabase_realtime add table public.todos;
  end if;
end $$;
