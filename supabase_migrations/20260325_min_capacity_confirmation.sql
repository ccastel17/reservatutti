DO $$
BEGIN
  ALTER TABLE public.events
    ADD COLUMN IF NOT EXISTS requires_min_capacity boolean NOT NULL DEFAULT false;

  ALTER TABLE public.event_series
    ADD COLUMN IF NOT EXISTS requires_min_capacity boolean NOT NULL DEFAULT false;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS school_activity_event_confirmed_unique
  ON public.school_activity (school_id, event_id, type)
  WHERE type = 'event_confirmed';

CREATE OR REPLACE FUNCTION public.check_and_log_event_confirmed(
  p_school_id uuid,
  p_event_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_event record;
  v_occupied int;
BEGIN
  SELECT id, school_id, title, starts_at, capacity, requires_min_capacity, status
    INTO v_event
    FROM public.events
    WHERE id = p_event_id
      AND school_id = p_school_id;

  IF v_event.id IS NULL THEN
    RETURN;
  END IF;

  IF v_event.requires_min_capacity IS DISTINCT FROM true THEN
    RETURN;
  END IF;

  IF v_event.status <> 'scheduled' THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(1 + (CASE WHEN has_plus_one THEN 1 ELSE 0 END)), 0)::int
    INTO v_occupied
    FROM public.reservations
    WHERE school_id = p_school_id
      AND event_id = p_event_id
      AND status = 'confirmed';

  IF v_occupied < v_event.capacity THEN
    RETURN;
  END IF;

  INSERT INTO public.school_activity (
    school_id,
    type,
    event_id,
    reservation_id,
    participant_name,
    participant_phone_e164,
    payload
  ) VALUES (
    p_school_id,
    'event_confirmed',
    p_event_id,
    NULL,
    NULL,
    NULL,
    jsonb_build_object(
      'capacity', v_event.capacity,
      'occupied', v_occupied
    )
  ) ON CONFLICT DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_reservations_check_event_confirmed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmed') THEN
    PERFORM public.check_and_log_event_confirmed(NEW.school_id, NEW.event_id);
  END IF;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_trigger
      WHERE tgname = 'reservations_check_event_confirmed'
  ) THEN
    CREATE TRIGGER reservations_check_event_confirmed
      AFTER INSERT OR UPDATE OF status ON public.reservations
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_reservations_check_event_confirmed();
  END IF;
END
$$;
