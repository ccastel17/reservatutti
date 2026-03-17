DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
    CREATE TYPE public.event_category AS ENUM ('trip', 'theory', 'practice');
  END IF;
END
$$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category public.event_category NOT NULL DEFAULT 'trip';

CREATE TABLE IF NOT EXISTS public.school_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz NULL,
  event_id uuid NULL REFERENCES public.events(id) ON DELETE SET NULL,
  reservation_id uuid NULL REFERENCES public.reservations(id) ON DELETE SET NULL,
  participant_name text NULL,
  participant_phone_e164 text NULL,
  payload jsonb NULL
);

CREATE INDEX IF NOT EXISTS school_activity_school_unread_idx
  ON public.school_activity (school_id, read_at, created_at DESC);

ALTER TABLE public.school_activity ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'school_activity'
      AND policyname = 'school_activity_select_by_membership'
  ) THEN
    CREATE POLICY school_activity_select_by_membership
      ON public.school_activity
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = school_activity.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'school_activity'
      AND policyname = 'school_activity_update_read_by_membership'
  ) THEN
    CREATE POLICY school_activity_update_read_by_membership
      ON public.school_activity
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = school_activity.school_id
            AND m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = school_activity.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.school_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS school_invites_token_idx ON public.school_invites (token);

ALTER TABLE public.school_invites ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'school_invites'
      AND policyname = 'school_invites_select_authenticated'
  ) THEN
    CREATE POLICY school_invites_select_authenticated
      ON public.school_invites
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'school_invites'
      AND policyname = 'school_invites_update_authenticated'
  ) THEN
    CREATE POLICY school_invites_update_authenticated
      ON public.school_invites
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
