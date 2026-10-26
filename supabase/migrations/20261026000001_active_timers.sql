-- Create active_timers table to broadcast live tracking status between partners
create table if not exists public.active_timers (
  user_id text primary key references public.profiles(id) on delete cascade,
  user_name text not null,
  working_on text not null default '',
  category text not null default 'Study',
  started_at bigint not null,
  accumulated_seconds integer not null default 0,
  is_running boolean not null default false,
  is_pomodoro boolean not null default false,
  updated_at bigint default (extract(epoch from now()) * 1000)::bigint
);

alter table public.active_timers enable row level security;

-- Drop existing policies if they exist to allow safe re-running
drop policy if exists "Allow public select on active_timers" on public.active_timers;
drop policy if exists "Allow public insert on active_timers" on public.active_timers;
drop policy if exists "Allow public update on active_timers" on public.active_timers;
drop policy if exists "Allow public delete on active_timers" on public.active_timers;

create policy "Allow public select on active_timers" on public.active_timers for select using (true);
create policy "Allow public insert on active_timers" on public.active_timers for insert with check (true);
create policy "Allow public update on active_timers" on public.active_timers for update using (true);
create policy "Allow public delete on active_timers" on public.active_timers for delete using (true);

-- Add active_timers to realtime publication if not already present
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'active_timers'
  ) then
    alter publication supabase_realtime add table public.active_timers;
  end if;
end $$;
