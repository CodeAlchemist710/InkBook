export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      artists: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean | null;
          name: string;
          slug: string;
          specialties: string[] | null;
          studio_id: string;
          updated_at: string | null;
          user_id: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          name: string;
          slug: string;
          specialties?: string[] | null;
          studio_id: string;
          updated_at?: string | null;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          slug?: string;
          specialties?: string[] | null;
          studio_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "artists_studio_id_fkey";
            columns: ["studio_id"];
            isOneToOne: false;
            referencedRelation: "studios";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_overrides: {
        Row: {
          artist_id: string;
          date: string;
          end_time: string | null;
          id: string;
          is_blocked: boolean | null;
          reason: string | null;
          start_time: string | null;
        };
        Insert: {
          artist_id: string;
          date: string;
          end_time?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          reason?: string | null;
          start_time?: string | null;
        };
        Update: {
          artist_id?: string;
          date?: string;
          end_time?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          reason?: string | null;
          start_time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_overrides_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      availability_rules: {
        Row: {
          artist_id: string;
          day_of_week: number;
          end_time: string;
          id: string;
          is_active: boolean | null;
          slot_duration: number | null;
          start_time: string;
        };
        Insert: {
          artist_id: string;
          day_of_week: number;
          end_time: string;
          id?: string;
          is_active?: boolean | null;
          slot_duration?: number | null;
          start_time: string;
        };
        Update: {
          artist_id?: string;
          day_of_week?: number;
          end_time?: string;
          id?: string;
          is_active?: boolean | null;
          slot_duration?: number | null;
          start_time?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_rules_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          artist_id: string;
          client_email: string | null;
          client_name: string;
          client_phone: string | null;
          created_at: string | null;
          date: string;
          description: string | null;
          end_time: string;
          estimated_size: string | null;
          id: string;
          notes: string | null;
          placement: string | null;
          reference_urls: string[] | null;
          start_time: string;
          status: string | null;
          studio_id: string;
          updated_at: string | null;
        };
        Insert: {
          artist_id: string;
          client_email?: string | null;
          client_name: string;
          client_phone?: string | null;
          created_at?: string | null;
          date: string;
          description?: string | null;
          end_time: string;
          estimated_size?: string | null;
          id?: string;
          notes?: string | null;
          placement?: string | null;
          reference_urls?: string[] | null;
          start_time: string;
          status?: string | null;
          studio_id: string;
          updated_at?: string | null;
        };
        Update: {
          artist_id?: string;
          client_email?: string | null;
          client_name?: string;
          client_phone?: string | null;
          created_at?: string | null;
          date?: string;
          description?: string | null;
          end_time?: string;
          estimated_size?: string | null;
          id?: string;
          notes?: string | null;
          placement?: string | null;
          reference_urls?: string[] | null;
          start_time?: string;
          status?: string | null;
          studio_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_studio_id_fkey";
            columns: ["studio_id"];
            isOneToOne: false;
            referencedRelation: "studios";
            referencedColumns: ["id"];
          },
        ];
      };
      portfolio_pieces: {
        Row: {
          artist_id: string;
          body_part: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string;
          is_featured: boolean | null;
          sort_order: number | null;
          styles: string[] | null;
          thumbnail_url: string | null;
          title: string | null;
        };
        Insert: {
          artist_id: string;
          body_part?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url: string;
          is_featured?: boolean | null;
          sort_order?: number | null;
          styles?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
        };
        Update: {
          artist_id?: string;
          body_part?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string;
          is_featured?: boolean | null;
          sort_order?: number | null;
          styles?: string[] | null;
          thumbnail_url?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "portfolio_pieces_artist_id_fkey";
            columns: ["artist_id"];
            isOneToOne: false;
            referencedRelation: "artists";
            referencedColumns: ["id"];
          },
        ];
      };
      studios: {
        Row: {
          address: string | null;
          city: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          instagram_url: string | null;
          is_active: boolean | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          phone: string | null;
          slug: string;
          updated_at: string | null;
          whatsapp_number: string | null;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          phone?: string | null;
          slug: string;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          instagram_url?: string | null;
          is_active?: boolean | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          slug?: string;
          updated_at?: string | null;
          whatsapp_number?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Studio = Database["public"]["Tables"]["studios"]["Row"];
export type Artist = Database["public"]["Tables"]["artists"]["Row"];
export type PortfolioPiece = Database["public"]["Tables"]["portfolio_pieces"]["Row"];
export type AvailabilityRule = Database["public"]["Tables"]["availability_rules"]["Row"];
export type AvailabilityOverride = Database["public"]["Tables"]["availability_overrides"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
