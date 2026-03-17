export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          slug: string;
          name: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      events: {
        Row: {
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
        Insert: {
          id?: string;
          school_id: string;
          series_id?: string | null;
          title: string;
          description?: string | null;
          meeting_point?: string | null;
          starts_at: string;
          ends_at: string;
          capacity: number;
          is_visible?: boolean;
          status?: "scheduled" | "cancelled" | "closed";
          cancelled_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          series_id?: string | null;
          title?: string;
          description?: string | null;
          meeting_point?: string | null;
          starts_at?: string;
          ends_at?: string;
          capacity?: number;
          is_visible?: boolean;
          status?: "scheduled" | "cancelled" | "closed";
          cancelled_at?: string | null;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      contacts: {
        Row: {
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
        Insert: {
          id?: string;
          school_id: string;
          phone_e164: string;
          full_name: string;
          reservations_count?: number;
          is_frequent_override?: boolean;
          first_reserved_at?: string | null;
          last_reserved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          phone_e164?: string;
          full_name?: string;
          reservations_count?: number;
          is_frequent_override?: boolean;
          first_reserved_at?: string | null;
          last_reserved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      reservations: {
        Row: {
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
        Insert: {
          id?: string;
          school_id: string;
          event_id: string;
          contact_id: string;
          participant_name: string;
          participant_phone_e164: string;
          has_plus_one?: boolean;
          status?: "confirmed" | "pending" | "cancelled";
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          event_id?: string;
          contact_id?: string;
          participant_name?: string;
          participant_phone_e164?: string;
          has_plus_one?: boolean;
          status?: "confirmed" | "pending" | "cancelled";
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [];
      };

      school_members: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          role: "owner" | "organizer";
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          role: "owner" | "organizer";
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          role?: "owner" | "organizer";
          created_at?: string;
        };
        Relationships: [];
      };

      event_series: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          description: string | null;
          meeting_point: string | null;
          weekday: number;
          start_time: string;
          duration_minutes: number;
          capacity: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          title: string;
          description?: string | null;
          meeting_point?: string | null;
          weekday: number;
          start_time: string;
          duration_minutes?: number;
          capacity: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          title?: string;
          description?: string | null;
          meeting_point?: string | null;
          weekday?: number;
          start_time?: string;
          duration_minutes?: number;
          capacity?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      member_role: "owner" | "organizer";
      event_status: "scheduled" | "cancelled" | "closed";
      reservation_status: "confirmed" | "cancelled";
    };
    CompositeTypes: Record<string, never>;
  };
};
