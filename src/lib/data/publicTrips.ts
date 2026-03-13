import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolBySlug } from "@/lib/data/schools";
import type { Trip } from "@/types/domain";

export type PublicTripDetail = {
  schoolId: string;
  trip: Trip;
  occupied: number;
  spotsLeft: number;
};

export type PublicTripListRow = Pick<
  Trip,
  "id" | "title" | "starts_at" | "capacity" | "status" | "meeting_point"
>;

export async function getPublicUpcomingTripsBySlug(params: {
  schoolSlug: string;
}): Promise<{ schoolId: string; trips: PublicTripListRow[] } | null> {
  const school = await getSchoolBySlug(params.schoolSlug);
  if (!school) return null;

  const supabase = getSupabaseAdmin();
  const from = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, status, meeting_point")
    .eq("school_id", school.id)
    .eq("is_visible", true)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (error) throw new Error(error.message);

  return {
    schoolId: school.id,
    trips: (data ?? []) as unknown as PublicTripListRow[],
  };
}

export async function getPublicTripDetailBySlugAndId(params: {
  schoolSlug: string;
  tripId: string;
}): Promise<PublicTripDetail | null> {
  const school = await getSchoolBySlug(params.schoolSlug);
  if (!school) return null;

  const supabase = getSupabaseAdmin();

  const { data: trip, error: tripError } = await supabase
    .from("events")
    .select(
      "id, school_id, series_id, title, description, meeting_point, starts_at, ends_at, capacity, is_visible, status, cancelled_at, closed_at, created_at, updated_at"
    )
    .eq("id", params.tripId)
    .eq("school_id", school.id)
    .eq("is_visible", true)
    .maybeSingle();

  if (tripError) throw new Error(tripError.message);
  if (!trip) return null;

  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("has_plus_one")
    .eq("event_id", params.tripId)
    .eq("school_id", school.id)
    .eq("status", "confirmed");

  if (resError) throw new Error(resError.message);

  const reservationsRows = (reservations ?? []) as Array<{ has_plus_one: boolean }>;

  const occupied = reservationsRows.reduce(
    (sum, r) => sum + 1 + (r.has_plus_one ? 1 : 0),
    0
  );

  const typedTrip = trip as unknown as Trip;
  const spotsLeft = Math.max(0, typedTrip.capacity - occupied);

  return {
    schoolId: school.id,
    trip: typedTrip,
    occupied,
    spotsLeft,
  };
}
