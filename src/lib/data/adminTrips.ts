import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type AdminTripRow = {
  id: string;
  title: string;
  starts_at: string;
  capacity: number;
  requires_min_capacity: boolean;
  is_visible: boolean;
  status: "scheduled" | "cancelled" | "closed";
  series_id: string | null;
  category: "trip" | "theory" | "practice";
};

function addDays(d: Date, days: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getTripsBySchoolId(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  opts?: {
    visibleOnly?: boolean;
    daysBack?: number;
    daysForward?: number;
    limit?: number;
  }
): Promise<AdminTripRow[]> {
  const now = new Date();
  const from = addDays(now, -(opts?.daysBack ?? 0)).toISOString();
  const to = addDays(now, opts?.daysForward ?? 0).toISOString();

  let query = supabase
    .from("events")
    .select("id, title, starts_at, capacity, requires_min_capacity, is_visible, status, series_id, category")
    .eq("school_id", schoolId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(opts?.limit ?? 200);

  if (opts?.visibleOnly) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query;
  if (!error) {
    return (data ?? []) as unknown as AdminTripRow[];
  }

  const msg =
    typeof error === "object" && error && "message" in error
      ? String((error as unknown as { message?: string }).message)
      : "";
  if (!msg.toLowerCase().includes("category") || !msg.toLowerCase().includes("does not exist")) {
    throw new Error(msg || "Error fetching trips");
  }

  const { data: legacy, error: legacyError } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, requires_min_capacity, is_visible, status, series_id")
    .eq("school_id", schoolId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(opts?.limit ?? 200);
  if (legacyError) throw new Error(legacyError.message);

  return ((legacy ?? []) as Array<Omit<AdminTripRow, "category">>).map((r) => ({
    ...r,
    category: "trip",
  }));
}

export async function getUpcomingTripsBySchoolId(
  supabase: SupabaseClient<Database>,
  schoolId: string,
  opts?: { visibleOnly?: boolean }
) {
  const from = new Date().toISOString();

  let query = supabase
    .from("events")
    .select("id, title, starts_at, capacity, requires_min_capacity, is_visible, status, series_id, category")
    .eq("school_id", schoolId)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (opts?.visibleOnly) {
    query = query.eq("is_visible", true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []) as unknown as AdminTripRow[];
}

export async function getHiddenTripsBySchoolId(
  supabase: SupabaseClient<Database>,
  schoolId: string
) {
  const from = new Date().toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, requires_min_capacity, is_visible, status, series_id, category")
    .eq("school_id", schoolId)
    .eq("is_visible", false)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(100);

  if (!error) {
    return (data ?? []) as unknown as AdminTripRow[];
  }

  const msg = (() => {
    if (typeof error !== "object" || !error) return "";
    if (!("message" in error)) return "";
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value : String(value ?? "");
  })();
  if (!msg.toLowerCase().includes("category") || !msg.toLowerCase().includes("does not exist")) {
    throw new Error(msg || "Error fetching trips");
  }

  const { data: legacy, error: legacyError } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity, is_visible, status, series_id")
    .eq("school_id", schoolId)
    .eq("is_visible", false)
    .gte("starts_at", from)
    .order("starts_at", { ascending: true })
    .limit(100);
  if (legacyError) throw new Error(legacyError.message);

  return ((legacy ?? []) as Array<Omit<AdminTripRow, "category">>).map((r) => ({
    ...r,
    category: "trip",
  }));
}
