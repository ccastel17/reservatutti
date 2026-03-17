do $$
begin
  if not exists (select 1 from pg_type where typname = 'reservation_status') then
    create type public.reservation_status as enum ('confirmed', 'pending', 'cancelled');
  end if;
end
$$;

alter table public.schools
  add column if not exists admin_email text null;

alter table public.reservations
  alter column status type public.reservation_status using (status::text)::public.reservation_status;

alter table public.reservations
  alter column status set default 'confirmed';

create or replace function public.cancel_reservation_and_promote_waitlist(
  p_school_id uuid,
  p_event_id uuid,
  p_reservation_id uuid
)
returns table (
  cancelled_reservation_id uuid,
  promoted_reservation_id uuid
)
language plpgsql
as $$
declare
  v_capacity int;
  v_occupied int;
  v_available int;
  v_pending record;
  v_needed int;
begin
  update public.reservations
    set status = 'cancelled',
        cancelled_at = now()
    where id = p_reservation_id
      and school_id = p_school_id
      and event_id = p_event_id
      and status = 'confirmed';

  cancelled_reservation_id := p_reservation_id;
  promoted_reservation_id := null;

  select capacity into v_capacity
    from public.events
    where id = p_event_id
      and school_id = p_school_id;

  if v_capacity is null then
    return;
  end if;

  select coalesce(sum(1 + (case when has_plus_one then 1 else 0 end)), 0)::int into v_occupied
    from public.reservations
    where school_id = p_school_id
      and event_id = p_event_id
      and status = 'confirmed';

  v_available := greatest(v_capacity - v_occupied, 0);

  for v_pending in
    select id, has_plus_one
      from public.reservations
      where school_id = p_school_id
        and event_id = p_event_id
        and status = 'pending'
      order by created_at asc
  loop
    v_needed := case when v_pending.has_plus_one then 2 else 1 end;

    if v_needed <= v_available then
      update public.reservations
        set status = 'confirmed'
        where id = v_pending.id;

      promoted_reservation_id := v_pending.id;
      exit;
    end if;
  end loop;

  return;
end;
$$;

grant execute on function public.cancel_reservation_and_promote_waitlist(uuid, uuid, uuid) to authenticated;
