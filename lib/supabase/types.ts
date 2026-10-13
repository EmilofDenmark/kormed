/**
 * Hand-written mirror of supabase/migrations/*.sql. If you have the Supabase
 * CLI installed you can regenerate this from the live schema instead:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
 * Keep the two in sync manually until then — every table/enum/RPC here must
 * match a migration file 1:1.
 *
 * NOTE: every table/view below carries `Relationships: []`. This isn't
 * decorative — @supabase/postgrest-js's generic query builder requires each
 * table to structurally satisfy `GenericTable` (which mandates a
 * `Relationships` array), or TypeScript silently infers `never` for every
 * `.from(table)` row type across the whole app. We don't use PostgREST's
 * embedded-resource (`select('*, other_table(...)')`) syntax anywhere
 * (see lib/rides/enrich.ts for why), so an empty array is accurate.
 */

export type RideStatus = 'DRAFT' | 'PUBLISHED' | 'FULL' | 'CANCELLED' | 'COMPLETED'
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED_BY_DRIVER'
  | 'CANCELLED_BY_PASSENGER'
  | 'COMPLETED'
export type PaymentStatus = 'NOT_HANDLED_BY_PLATFORM' | 'PENDING' | 'PAID' | 'REFUNDED'
export type TimeFlexibility = 'exact' | 'plus_minus_30' | 'plus_minus_60' | 'flexible'
export type LuggageOption = 'lille' | 'almindelig' | 'stor'
export type PetsOption = 'ja' | 'nej' | 'efter_aftale'
export type NoticeStatus = 'NEW' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'NO_ACTION' | 'CLOSED'
export type NoticeContentType = 'ride' | 'profile' | 'rating_comment' | 'message'
export type NotificationType =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'new_message'
  | 'booking_cancelled'
  | 'ride_cancelled'
  | 'rating_available'
export type ProfileStatus = 'active' | 'suspended' | 'deleted'
export type UserRole = 'user' | 'admin'
export type LegalDocType = 'terms' | 'privacy'
export type SupportContributionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          public_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          date_of_birth: string
          avatar_url: string | null
          bio: string | null
          role: UserRole
          email_verified: boolean
          phone_verified: boolean
          rating_avg: number
          rating_count: number
          completed_rides_count: number
          status: ProfileStatus
          suspended_reason: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      public_profiles: {
        Row: {
          id: string
          public_id: string
          first_name: string
          avatar_url: string | null
          bio: string | null
          rating_avg: number
          rating_count: number
          completed_rides_count: number
          email_verified: boolean
          phone_verified: boolean
          created_at: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
      driver_declarations: {
        Row: { id: string; user_id: string; declaration_version: number; accepted_at: string }
        Insert: Pick<Database['public']['Tables']['driver_declarations']['Row'], 'user_id' | 'declaration_version'>
        Update: never
        Relationships: []
      }
      legal_documents: {
        Row: {
          id: string
          type: LegalDocType
          version: number
          content: string
          requires_legal_review: boolean
          published_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['legal_documents']['Row']>
        Update: Partial<Database['public']['Tables']['legal_documents']['Row']>
        Relationships: []
      }
      legal_acceptances: {
        Row: { id: string; user_id: string; document_type: LegalDocType; version: number; accepted_at: string }
        Insert: Pick<Database['public']['Tables']['legal_acceptances']['Row'], 'user_id' | 'document_type' | 'version'>
        Update: never
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          value: unknown
          is_public: boolean
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: Partial<Database['public']['Tables']['app_settings']['Row']>
        Update: Partial<Database['public']['Tables']['app_settings']['Row']>
        Relationships: []
      }
      ferry_routes: {
        Row: {
          id: string
          operator: string
          departure_port: string
          arrival_port: string
          default_departure_time: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['ferry_routes']['Row']>
        Update: Partial<Database['public']['Tables']['ferry_routes']['Row']>
        Relationships: []
      }
      rides: {
        Row: {
          id: string
          driver_id: string
          origin_name: string
          origin_lat: number
          origin_lng: number
          destination_name: string
          destination_lat: number
          destination_lng: number
          departure_date: string
          departure_time: string
          time_flexibility: TimeFlexibility
          distance_km: number | null
          duration_minutes: number | null
          route_polyline: string | null
          uses_ferry: boolean
          ferry_route_id: string | null
          ferry_departure_time: string | null
          ferry_notes: string | null
          available_seats: number
          original_seats: number
          luggage_option: LuggageOption
          pets_option: PetsOption
          smoking: boolean
          comment: string | null
          direct_cost_estimate: number | null
          seat_price: number
          status: RideStatus
          driver_completed_credited: boolean
          cancelled_at: string | null
          cancelled_reason: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['rides']['Row'],
          | 'id'
          | 'created_at'
          | 'updated_at'
          | 'driver_completed_credited'
          | 'cancelled_at'
          | 'cancelled_reason'
          | 'completed_at'
        > &
          Partial<
            Pick<
              Database['public']['Tables']['rides']['Row'],
              'id' | 'cancelled_at' | 'cancelled_reason' | 'completed_at'
            >
          >
        Update: Partial<Database['public']['Tables']['rides']['Row']>
        Relationships: []
      }
      ride_route_points: {
        Row: {
          id: string
          ride_id: string
          sequence: number
          point: unknown
          distance_from_origin_km: number | null
        }
        Insert: Omit<Database['public']['Tables']['ride_route_points']['Row'], 'id'> &
          Partial<Pick<Database['public']['Tables']['ride_route_points']['Row'], 'id'>>
        Update: never
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          ride_id: string
          passenger_id: string
          seats: number
          message: string | null
          status: BookingStatus
          payment_status: PaymentStatus
          cancellation_reason: string | null
          requested_at: string
          responded_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Pick<Database['public']['Tables']['bookings']['Row'], 'ride_id' | 'passenger_id' | 'seats'> &
          Partial<Database['public']['Tables']['bookings']['Row']>
        Update: Partial<Database['public']['Tables']['bookings']['Row']>
        Relationships: []
      }
      conversations: {
        Row: { id: string; booking_id: string; driver_id: string; passenger_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['conversations']['Row'], 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          body: string
          created_at: string
          read_at: string | null
        }
        Insert: Pick<Database['public']['Tables']['messages']['Row'], 'conversation_id' | 'sender_id' | 'body'>
        Update: Partial<Pick<Database['public']['Tables']['messages']['Row'], 'read_at'>>
        Relationships: []
      }
      ratings: {
        Row: {
          id: string
          booking_id: string
          rater_id: string
          ratee_id: string
          stars: number
          comment: string | null
          comment_hidden: boolean
          created_at: string
        }
        Insert: Pick<
          Database['public']['Tables']['ratings']['Row'],
          'booking_id' | 'rater_id' | 'ratee_id' | 'stars'
        > &
          Partial<Pick<Database['public']['Tables']['ratings']['Row'], 'comment'>>
        Update: Partial<Pick<Database['public']['Tables']['ratings']['Row'], 'comment_hidden'>>
        Relationships: []
      }
      public_ratings: {
        Row: Database['public']['Tables']['ratings']['Row']
        Insert: never
        Update: never
        Relationships: []
      }
      content_notices: {
        Row: {
          id: string
          content_type: NoticeContentType
          content_id: string
          url: string | null
          reporter_user_id: string | null
          reporter_email: string
          explanation: string
          legal_category: string | null
          good_faith_confirmed: boolean
          status: NoticeStatus
          decision_reason: string | null
          handled_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<
          Database['public']['Tables']['content_notices']['Row'],
          'id' | 'status' | 'decision_reason' | 'handled_by' | 'created_at' | 'updated_at'
        >
        Update: Partial<
          Pick<Database['public']['Tables']['content_notices']['Row'], 'status' | 'decision_reason' | 'handled_by'>
        >
        Relationships: []
      }
      admin_actions: {
        Row: {
          id: string
          admin_id: string
          action_type: string
          target_table: string | null
          target_id: string | null
          reason: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['admin_actions']['Row'], 'id' | 'created_at'>
        Update: never
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string | null
          link: string | null
          read_at: string | null
          created_at: string
        }
        Insert: never
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'read_at'>>
        Relationships: []
      }
      rate_limit_hits: {
        Row: { id: number; bucket_key: string; created_at: string }
        Insert: never
        Update: never
        Relationships: []
      }
      support_contributions: {
        Row: {
          id: string
          user_id: string | null
          amount: number
          currency: string
          payment_provider: string
          provider_payment_id: string | null
          status: SupportContributionStatus
          created_at: string
        }
        Insert: Pick<
          Database['public']['Tables']['support_contributions']['Row'],
          'amount' | 'payment_provider'
        > &
          Partial<
            Pick<
              Database['public']['Tables']['support_contributions']['Row'],
              'id' | 'user_id' | 'currency' | 'provider_payment_id' | 'status'
            >
          >
        Update: Partial<
          Pick<Database['public']['Tables']['support_contributions']['Row'], 'status' | 'provider_payment_id'>
        >
        Relationships: []
      }
    }
    Views: {
      public_profiles: Database['public']['Tables']['public_profiles']
      public_ratings: Database['public']['Tables']['public_ratings']
    }
    Functions: {
      accept_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] }
      reject_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] }
      cancel_booking_by_passenger: {
        Args: { p_booking_id: string; p_reason?: string | null }
        Returns: Database['public']['Tables']['bookings']['Row']
      }
      cancel_ride_by_driver: {
        Args: { p_ride_id: string; p_reason?: string | null }
        Returns: Database['public']['Tables']['rides']['Row']
      }
      request_booking: {
        Args: { p_ride_id: string; p_seats: number; p_message?: string | null }
        Returns: Database['public']['Tables']['bookings']['Row']
      }
      complete_booking: { Args: { p_booking_id: string }; Returns: Database['public']['Tables']['bookings']['Row'] }
      notify: {
        Args: {
          p_user_id: string
          p_type: NotificationType
          p_title: string
          p_body?: string | null
          p_link?: string | null
        }
        Returns: void
      }
      search_rides_partial_match: {
        Args: {
          p_origin_lat: number
          p_origin_lng: number
          p_dest_lat: number
          p_dest_lng: number
          p_date?: string | null
          p_seats?: number
          p_radius_km?: number | null
        }
        Returns: {
          ride_id: string
          origin_distance_km: number
          destination_distance_km: number
          origin_sequence: number
          destination_sequence: number
        }[]
      }
      check_rate_limit: {
        Args: { p_bucket_key: string; p_max_hits: number; p_window_seconds: number }
        Returns: boolean
      }
      admin_get_notice_messages: {
        Args: { p_notice_id: string }
        Returns: Database['public']['Tables']['messages']['Row'][]
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      auto_complete_past_rides: { Args: Record<string, never>; Returns: number }
      purge_expired_data: { Args: Record<string, never>; Returns: Record<string, number> }
    }
  }
}
