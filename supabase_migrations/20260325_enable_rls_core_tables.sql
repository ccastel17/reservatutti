-- Enable RLS on core tables and add minimal policies for admin access

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'school_members'
      AND policyname = 'school_members_select_own'
  ) THEN
    CREATE POLICY school_members_select_own
      ON public.school_members
      FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'schools'
      AND policyname = 'schools_select_by_membership'
  ) THEN
    CREATE POLICY schools_select_by_membership
      ON public.schools
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = schools.id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'events'
      AND policyname = 'events_admin_all_by_membership'
  ) THEN
    CREATE POLICY events_admin_all_by_membership
      ON public.events
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = events.school_id
            AND m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = events.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'event_series'
      AND policyname = 'event_series_admin_all_by_membership'
  ) THEN
    CREATE POLICY event_series_admin_all_by_membership
      ON public.event_series
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = event_series.school_id
            AND m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = event_series.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'contacts'
      AND policyname = 'contacts_admin_all_by_membership'
  ) THEN
    CREATE POLICY contacts_admin_all_by_membership
      ON public.contacts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = contacts.school_id
            AND m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = contacts.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'reservations'
      AND policyname = 'reservations_admin_all_by_membership'
  ) THEN
    CREATE POLICY reservations_admin_all_by_membership
      ON public.reservations
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = reservations.school_id
            AND m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.school_members m
          WHERE m.school_id = reservations.school_id
            AND m.user_id = auth.uid()
        )
      );
  END IF;
END
$$;
