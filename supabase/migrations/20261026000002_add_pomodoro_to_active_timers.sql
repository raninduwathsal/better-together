-- Add pomodoro countdown fields to active_timers for centralized countdown state
alter table public.active_timers 
  add column if not exists pomodoro_mode text not null default 'work',
  add column if not exists pomodoro_preset text not null default 'standard',
  add column if not exists pomodoro_target_seconds integer not null default 1500,
  add column if not exists pomodoro_cycle_count integer not null default 0;
