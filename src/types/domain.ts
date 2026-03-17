export type School = {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type Trip = {
  id: string;
  school_id: string;
  series_id: string | null;
  title: string;
  description: string | null;
  meeting_point: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  is_visible: boolean;
  status: "scheduled" | "cancelled" | "closed";
  cancelled_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Contact = {
  id: string;
  school_id: string;
  phone_e164: string;
  full_name: string;
  reservations_count: number;
  is_frequent_override: boolean;
  first_reserved_at: string | null;
  last_reserved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  school_id: string;
  event_id: string;
  contact_id: string;
  participant_name: string;
  participant_phone_e164: string;
  has_plus_one: boolean;
  status: "confirmed" | "pending" | "cancelled";
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};
