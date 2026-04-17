import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getSchoolBySlug } from "@/lib/data/schools";
import type { Trip } from "@/types/domain";

export type PublicTripDetail = {
  schoolId: string;
  trip: Trip;
  occupied: number;
  spotsLeft: number;
  confirmed: Array<{
    id: string;
    participantName: string;
    hasPlusOne: boolean;
    createdAt: string;
  }>;
  pending: Array<{
    id: string;
    participantName: string;
    hasPlusOne: boolean;
    createdAt: string;
  }>;
};

export type PublicTripListRow = Pick<
  Trip,
  "id" | "title" | "starts_at" | "ends_at" | "capacity" | "min_capacity" | "requires_min_capacity" | "status" | "meeting_point" | "description"
> & {
  occupied: number;
  spotsLeft: number;
};

export async function getPublicUpcomingTripsBySlug(params: {
  schoolSlug: string;
  category?: "trip" | "theory" | "practice";
  page?: number;
  pageSize?: number;
}): Promise<{ schoolId: string; trips: PublicTripListRow[]; totalCount: number } | null> {
  const school = await getSchoolBySlug(params.schoolSlug);
  if (!school) return null;

  const supabase = getSupabaseAdmin();
  const from = new Date().toISOString();

  const pageSize = Math.max(1, Math.min(50, params.pageSize ?? 5));
  const page = Math.max(1, params.page ?? 1);
  const fromIdx = (page - 1) * pageSize;
  const toIdx = fromIdx + pageSize - 1;

  const baseQuery = supabase
    .from("events")
    .select(
      "id, title, starts_at, ends_at, capacity, min_capacity, requires_min_capacity, status, meeting_point, description, category",
      { count: "exact" }
    )
    .eq("school_id", school.id)
    .eq("is_visible", true)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .range(fromIdx, toIdx);

  let query = baseQuery;

  if (params.category) {
    query = query.eq("category", params.category);
  }

  const { data, error, count } = await query;

  if (error) {
    const msg =
      typeof error === "object" && error && "message" in error
        ? String((error as unknown as { message?: string }).message)
        : "";

    if ((msg.toLowerCase().includes("requires_min_capacity") || msg.toLowerCase().includes("min_capacity")) && msg.toLowerCase().includes("does not exist")) {
      let retry = supabase
        .from("events")
        .select("id, title, starts_at, ends_at, capacity, status, meeting_point, description, category", {
          count: "exact",
        })
        .eq("school_id", school.id)
        .eq("is_visible", true)
        .gte("starts_at", from)
        .order("starts_at", { ascending: true })
        .range(fromIdx, toIdx);
      if (params.category) {
        retry = retry.eq("category", params.category);
      }

      const { data: fallback, error: fallbackError, count: fallbackCount } = await retry;
      if (fallbackError) throw new Error(fallbackError.message);

      const trips = ((fallback ?? []) as unknown as Array<
        Pick<
          Trip,
          "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
        > & { category?: "trip" | "theory" | "practice" }
      >).map((t) => ({
        ...t,
        min_capacity: null,
        requires_min_capacity: false,
      }));

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
          ...(t as unknown as PublicTripListRow),
          occupied,
          spotsLeft,
        };
      });

      return {
        schoolId: school.id,
        trips: enriched,
        totalCount: fallbackCount ?? 0,
      };
    }

    if (!msg.toLowerCase().includes("category") || !msg.toLowerCase().includes("does not exist")) {
      throw new Error(error.message);
    }

    const legacyQuery = supabase
      .from("events")
      .select("id, title, starts_at, ends_at, capacity, status, meeting_point, description", { count: "exact" })
      .eq("school_id", school.id)
      .eq("is_visible", true)
      .gte("starts_at", from)
      .order("starts_at", { ascending: true })
      .range(fromIdx, toIdx);

    if (params.category && params.category !== "trip") {
      return { schoolId: school.id, trips: [], totalCount: 0 };
    }

    const { data: legacy, error: legacyError, count: legacyCount } = await legacyQuery;
    if (legacyError) throw new Error(legacyError.message);

    const trips = ((legacy ?? []) as unknown as Array<
      Pick<
        Trip,
        "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
      >
    >).map((t) => ({
      ...t,
      min_capacity: null,
      requires_min_capacity: false,
    }));

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
      totalCount: legacyCount ?? 0,
    };
  }

  const trips = ((data ?? []) as unknown as Array<
    Pick<
      Trip,
      "id" | "title" | "starts_at" | "ends_at" | "capacity" | "status" | "meeting_point" | "description"
    > & { category?: "trip" | "theory" | "practice"; requires_min_capacity?: boolean; min_capacity?: number | null }
  >).map((t) => ({
    ...t,
    min_capacity: t.min_capacity ?? null,
    requires_min_capacity: Boolean(t.requires_min_capacity),
  }));

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
      ...(t as unknown as PublicTripListRow),
      occupied,
      spotsLeft,
    };
  });

  return {
    schoolId: school.id,
    trips: enriched,
    totalCount: count ?? 0,
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
      "id, school_id, series_id, title, description, meeting_point, starts_at, ends_at, capacity, min_capacity, requires_min_capacity, is_visible, status, category, cancelled_at, closed_at, created_at, updated_at"
    )
    .eq("id", params.tripId)
    .eq("school_id", school.id)
    .eq("is_visible", true)
    .maybeSingle();

  if (tripError) throw new Error(tripError.message);
  if (!trip) return null;

  const { data: reservations, error: resError } = await supabase
    .from("reservations")
    .select("id, status, participant_name, has_plus_one, created_at")
    .eq("event_id", params.tripId)
    .eq("school_id", school.id)
    .in("status", ["confirmed", "pending"]);

  if (resError) throw new Error(resError.message);

  const reservationsRows = (reservations ?? []) as Array<{
    id: string;
    status: "confirmed" | "pending" | "cancelled";
    participant_name: string;
    has_plus_one: boolean;
    created_at: string;
  }>;

  const confirmed = reservationsRows
    .filter((r) => r.status === "confirmed")
    .map((r) => ({
      id: r.id,
      participantName: r.participant_name,
      hasPlusOne: r.has_plus_one,
      createdAt: r.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const pending = reservationsRows
    .filter((r) => r.status === "pending")
    .map((r) => ({
      id: r.id,
      participantName: r.participant_name,
      hasPlusOne: r.has_plus_one,
      createdAt: r.created_at,
    }))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const occupied = confirmed.reduce((sum, r) => sum + 1 + (r.hasPlusOne ? 1 : 0), 0);

  const typedTrip = trip as unknown as Trip;
  const spotsLeft = Math.max(0, typedTrip.capacity - occupied);

  return {
    schoolId: school.id,
    trip: typedTrip,
    occupied,
    spotsLeft,
    confirmed,
    pending,
  };
}
