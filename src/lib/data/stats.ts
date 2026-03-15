import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type TripOccupancyStatRow = {
  key: string;
  title: string;
  occupied: number;
  capacity: number;
  occupancyPct: number;
};

export type TopContactRow = {
  id: string;
  full_name: string;
  phone_e164: string;
  reservations_count: number;
};

export type BookingsByWeekdayRow = {
  weekday: number;
  occupied: number;
  trips: number;
};

function getMonthAgoIso() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

export async function getTripOccupancyStats(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<TripOccupancyStatRow[]> {
  const from = getMonthAgoIso();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, title, capacity, series_id, starts_at")
    .eq("school_id", schoolId)
    .gte("starts_at", from)
    .order("starts_at", { ascending: false })
    .limit(200);

  if (eventsError) throw new Error(eventsError.message);

  const rows =
    (events ?? []) as Array<{
      id: string;
      title: string;
      capacity: number;
      series_id: string | null;
      starts_at: string;
    }>;

  const eventIds = rows.map((e) => e.id);
  const occupiedByEventId = new Map<string, number>();
  for (const id of eventIds) occupiedByEventId.set(id, 0);

  if (eventIds.length > 0) {
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("event_id, has_plus_one")
      .eq("school_id", schoolId)
      .eq("status", "confirmed")
      .in("event_id", eventIds);

    if (resError) throw new Error(resError.message);

    const resRows = (reservations ?? []) as Array<{ event_id: string; has_plus_one: boolean }>;

    for (const r of resRows) {
      const current = occupiedByEventId.get(r.event_id) ?? 0;
      occupiedByEventId.set(r.event_id, current + 1 + (r.has_plus_one ? 1 : 0));
    }
  }

  const grouped = new Map<
    string,
    {
      title: string;
      occupied: number;
      capacity: number;
      latestStartsAt: string;
    }
  >();

  for (const e of rows) {
    const key = e.series_id ? `series:${e.series_id}` : `title:${e.title}`;
    const current = grouped.get(key);

    const occupied = occupiedByEventId.get(e.id) ?? 0;

    if (!current) {
      grouped.set(key, {
        title: e.title,
        occupied,
        capacity: e.capacity,
        latestStartsAt: e.starts_at,
      });
      continue;
    }

    grouped.set(key, {
      title: current.title,
      occupied: current.occupied + occupied,
      capacity: current.capacity + e.capacity,
      latestStartsAt: current.latestStartsAt > e.starts_at ? current.latestStartsAt : e.starts_at,
    });
  }

  const result = Array.from(grouped.entries()).map(([key, v]) => {
    const pct = v.capacity > 0 ? Math.round((v.occupied / v.capacity) * 100) : 0;
    return {
      key,
      title: v.title,
      occupied: v.occupied,
      capacity: v.capacity,
      occupancyPct: pct,
    };
  });

  result.sort((a, b) => b.occupancyPct - a.occupancyPct);
  return result;
}

export async function getTopContacts(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<TopContactRow[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name, phone_e164, reservations_count")
    .eq("school_id", schoolId)
    .order("reservations_count", { ascending: false })
    .limit(5);

  if (error) throw new Error(error.message);

  return (data ?? []) as TopContactRow[];
}

export async function getBookingsByWeekday(
  supabase: SupabaseClient<Database>,
  schoolId: string
): Promise<BookingsByWeekdayRow[]> {
  const from = getMonthAgoIso();

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, starts_at")
    .eq("school_id", schoolId)
    .gte("starts_at", from)
    .limit(500);

  if (eventsError) throw new Error(eventsError.message);

  const eventRows = (events ?? []) as Array<{ id: string; starts_at: string }>;
  const eventIds = eventRows.map((e) => e.id);

  const weekdayByEventId = new Map<string, number>();
  const tripsByWeekday = new Map<number, number>();
  for (let i = 0; i < 7; i += 1) tripsByWeekday.set(i, 0);

  for (const e of eventRows) {
    const weekday = new Date(e.starts_at).getDay();
    weekdayByEventId.set(e.id, weekday);
    const current = tripsByWeekday.get(weekday) ?? 0;
    tripsByWeekday.set(weekday, current + 1);
  }

  const occupiedByWeekday = new Map<number, number>();
  for (let i = 0; i < 7; i += 1) occupiedByWeekday.set(i, 0);

  if (eventIds.length > 0) {
    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select("event_id, has_plus_one")
      .eq("school_id", schoolId)
      .eq("status", "confirmed")
      .in("event_id", eventIds);

    if (resError) throw new Error(resError.message);

    const resRows = (reservations ?? []) as Array<{ event_id: string; has_plus_one: boolean }>;

    for (const r of resRows) {
      const weekday = weekdayByEventId.get(r.event_id);
      if (weekday === undefined) continue;
      const current = occupiedByWeekday.get(weekday) ?? 0;
      occupiedByWeekday.set(weekday, current + 1 + (r.has_plus_one ? 1 : 0));
    }
  }

  const result: BookingsByWeekdayRow[] = Array.from(occupiedByWeekday.entries())
    .filter(([weekday]) => (tripsByWeekday.get(weekday) ?? 0) > 0)
    .map(([weekday, occupied]) => ({
      weekday,
      occupied,
      trips: tripsByWeekday.get(weekday) ?? 0,
    }));

  result.sort((a, b) => b.occupied - a.occupied);
  return result;
}
