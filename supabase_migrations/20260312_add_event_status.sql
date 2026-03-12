-- Add event status to support cancel/close flows (MVP)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type public.event_status as enum ('scheduled', 'cancelled', 'closed');
  end if;
end
$$;

alter table public.events
  add column if not exists status public.event_status not null default 'scheduled',
  add column if not exists cancelled_at timestamptz null,
  add column if not exists closed_at timestamptz null;

-- Ensure timestamps match status
alter table public.events
  drop constraint if exists events_status_timestamps_check;

alter table public.events
  add constraint events_status_timestamps_check check (
    (status = 'cancelled' and cancelled_at is not null)
    or
    (status <> 'cancelled' and cancelled_at is null)
  );

alter table public.events
  drop constraint if exists events_closed_timestamps_check;

alter table public.events
  add constraint events_closed_timestamps_check check (
    (status = 'closed' and closed_at is not null)
    or
    (status <> 'closed' and closed_at is null)
  );
