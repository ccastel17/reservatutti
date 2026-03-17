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
  "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
> & {
  occupied: number;
  spotsLeft: number;
};

export async function getPublicUpcomingTripsBySlug(params: {
  schoolSlug: string;
  category?: "trip" | "theory" | "practice";
}): Promise<{ schoolId: string; trips: PublicTripListRow[] } | null> {
  const school = await getSchoolBySlug(params.schoolSlug);
  if (!school) return null;

  const supabase = getSupabaseAdmin();
  const from = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("id, title, starts_at, ends_at, capacity, status, meeting_point, description, category")
    .eq("school_id", school.id)
    .eq("is_visible", true)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data, error } = await query;

  if (error) {
    const msg =
      typeof error === "object" && error && "message" in error
        ? String((error as unknown as { message?: string }).message)
        : "";
    if (!msg.toLowerCase().includes("category") || !msg.toLowerCase().includes("does not exist")) {
      throw new Error(error.message);
    }

    const legacyQuery = supabase
      .from("events")
      .select("id, title, starts_at, ends_at, capacity, status, meeting_point, description")
      .eq("school_id", school.id)
      .eq("is_visible", true)
      .gte("starts_at", from)
      .order("starts_at", { ascending: true })
      .limit(50);

    if (params.category && params.category !== "trip") {
      return { schoolId: school.id, trips: [] };
    }

    const { data: legacy, error: legacyError } = await legacyQuery;
    if (legacyError) throw new Error(legacyError.message);

    const trips = (legacy ?? []) as unknown as Array<
      Pick<
        Trip,
        "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
      >
    >;

    const tripIds = trips.map((t) => t.id);

    const occupiedByEventId = new Map<string, number>();
    for (const id of tripIds) occupiedByEventId.set(id, 0);

    if (tripIds.length > 0) {
      const { data: reservations, error: resError } = await supabase
        .from("reservations")
        .select("event_id, has_plus_one")
        .eq("school_id", school.id)
        .eq("status", "confirmed")
        .in("event_id", tripIds);

      if (resError) throw new Error(resError.message);

      const reservationRows = (reservations ?? []) as Array<{ event_id: string; has_plus_one: boolean }>;

      for (const r of reservationRows) {
        const current = occupiedByEventId.get(r.event_id) ?? 0;
        occupiedByEventId.set(r.event_id, current + 1 + (r.has_plus_one ? 1 : 0));
      }
    }

    const enriched: PublicTripListRow[] = trips.map((t) => {
      const occupied = occupiedByEventId.get(t.id) ?? 0;
      const spotsLeft = Math.max(0, t.capacity - occupied);

      return {
        ...t,
        occupied,
        spotsLeft,
      };
    });

    return {
      schoolId: school.id,
      trips: enriched,
    };
  }

  const trips = (data ?? []) as unknown as Array<
    Pick<
      Trip,
      "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
    >
  >;

  const tripIds = trips.map((t) => t.id);

  const occupiedByEventId = new Map<string, number>();
  for (const id of tripIds) occupiedByEventId.set(id, 0);

  if (tripIds.length > 0) {
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("event_id, has_plus_one")
      .eq("school_id", school.id)
      .eq("status", "confirmed")
      .in("event_id", tripIds);

    if (resError) throw new Error(resError.message);

    const reservationRows = (reservations ?? []) as Array<{ event_id: string; has_plus_one: boolean }>;

    for (const r of reservationRows) {
      const current = occupiedByEventId.get(r.event_id) ?? 0;
      occupiedByEventId.set(r.event_id, current + 1 + (r.has_plus_one ? 1 : 0));
    }
  }

  const enriched: PublicTripListRow[] = trips.map((t) => {
    const occupied = occupiedByEventId.get(t.id) ?? 0;
    const spotsLeft = Math.max(0, t.capacity - occupied);

    return {
      ...t,
      occupied,
      spotsLeft,
    };
  });

  return {
    schoolId: school.id,
    trips: enriched,
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
      "id, school_id, series_id, title, description, meeting_point, starts_at, ends_at, capacity, is_visible, status, category, cancelled_at, closed_at, created_at, updated_at"
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
