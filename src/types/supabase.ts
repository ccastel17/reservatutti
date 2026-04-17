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

      school_activity: {
        Row: {
          id: string;
          school_id: string;
          type: string;
          created_at: string;
          read_at: string | null;
          event_id: string | null;
          reservation_id: string | null;
          participant_name: string | null;
          participant_phone_e164: string | null;
          payload: Json | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          type: string;
          created_at?: string;
          read_at?: string | null;
          event_id?: string | null;
          reservation_id?: string | null;
          participant_name?: string | null;
          participant_phone_e164?: string | null;
          payload?: Json | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          type?: string;
          created_at?: string;
          read_at?: string | null;
          event_id?: string | null;
          reservation_id?: string | null;
          participant_name?: string | null;
          participant_phone_e164?: string | null;
          payload?: Json | null;
        };
        Relationships: [];
      };

      school_invites: {
        Row: {
          id: string;
          school_id: string;
          email: string;
          token: string;
          created_at: string;
          expires_at: string;
          used_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          email: string;
          token: string;
          created_at?: string;
          expires_at: string;
          used_at?: string | null;
        };
        Update: {
          id?: string;
          school_id?: string;
          email?: string;
          token?: string;
          created_at?: string;
          expires_at?: string;
          used_at?: string | null;
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
          min_capacity: number | null;
          requires_min_capacity: boolean;
          is_visible: boolean;
          status: "scheduled" | "cancelled" | "closed";
          category: "trip" | "theory" | "practice";
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
          min_capacity?: number | null;
          requires_min_capacity?: boolean;
          is_visible?: boolean;
          status?: "scheduled" | "cancelled" | "closed";
          category?: "trip" | "theory" | "practice";
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
          min_capacity?: number | null;
          requires_min_capacity?: boolean;
          is_visible?: boolean;
          status?: "scheduled" | "cancelled" | "closed";
          category?: "trip" | "theory" | "practice";
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
          requires_min_capacity: boolean;
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
          requires_min_capacity?: boolean;
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
          requires_min_capacity?: boolean;
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
      reservation_status: "confirmed" | "pending" | "cancelled";
      event_category: "trip" | "theory" | "practice";
    };
    CompositeTypes: Record<string, never>;
  };
};
