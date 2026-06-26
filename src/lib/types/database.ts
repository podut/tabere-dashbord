export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          activity_title: string
          client_address: string
          client_city: string
          created_at: string
          device_id: string
          email: string | null
          event_id: string | null
          id: string
          is_private: boolean
          is_service_request: boolean
          judet: string
          mesaj: string | null
          nume_client: string
          preferred_date: string | null
          preferred_time: string | null
          private_code: string
          selected_position: string | null
          status: Database["public"]["Enums"]["booking_status"]
          telefon: string
          user_id: string | null
          was_before: boolean | null
        }
        Insert: {
          activity_title: string
          client_address?: string
          client_city?: string
          created_at?: string
          device_id?: string
          email?: string | null
          event_id?: string | null
          id?: string
          is_private?: boolean
          is_service_request?: boolean
          judet?: string
          mesaj?: string | null
          nume_client: string
          preferred_date?: string | null
          preferred_time?: string | null
          private_code?: string
          selected_position?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          telefon: string
          user_id?: string | null
          was_before?: boolean | null
        }
        Update: {
          activity_title?: string
          client_address?: string
          client_city?: string
          created_at?: string
          device_id?: string
          email?: string | null
          event_id?: string | null
          id?: string
          is_private?: boolean
          is_service_request?: boolean
          judet?: string
          mesaj?: string | null
          nume_client?: string
          preferred_date?: string | null
          preferred_time?: string | null
          private_code?: string
          selected_position?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          telefon?: string
          user_id?: string | null
          was_before?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          order: number | null
          parent_id: string | null
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          order?: number | null
          parent_id?: string | null
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          order?: number | null
          parent_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean
          capacity: string | null
          created_at: string
          currency: string | null
          date: string
          description: string
          duration: string | null
          end_date: string | null
          event_code: string
          gallery: string[] | null
          id: string
          image_url: string | null
          is_public: boolean
          location: string
          max_participants: number | null
          origin_booking_id: string
          positions: string[] | null
          price: number
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          capacity?: string | null
          created_at?: string
          currency?: string | null
          date: string
          description?: string
          duration?: string | null
          end_date?: string | null
          event_code?: string
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string
          max_participants?: number | null
          origin_booking_id?: string
          positions?: string[] | null
          price?: number
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          capacity?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string
          duration?: string | null
          end_date?: string | null
          event_code?: string
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string
          max_participants?: number | null
          origin_booking_id?: string
          positions?: string[] | null
          price?: number
          start_time?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          id: string
          label: string | null
          order: number | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string | null
          order?: number | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string | null
          order?: number | null
          url?: string
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          notification_id: string
          device_id: string
          user_id: string | null
          read_at: string
        }
        Insert: {
          notification_id: string
          device_id: string
          user_id?: string | null
          read_at?: string
        }
        Update: {
          notification_id?: string
          device_id?: string
          user_id?: string | null
          read_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: Database["public"]["Enums"]["notif_channel"]
          created_at: string
          id: string
          open_count: number
          scheduled_at: string
          status: Database["public"]["Enums"]["notif_status"]
          target_device_id: string | null
          target_event_id: string | null
          target_type: string
          target_user_id: string | null
          title: string
        }
        Insert: {
          body: string
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          open_count?: number
          scheduled_at: string
          status?: Database["public"]["Enums"]["notif_status"]
          target_device_id?: string | null
          target_event_id?: string | null
          target_type?: string
          target_user_id?: string | null
          title: string
        }
        Update: {
          body?: string
          channel?: Database["public"]["Enums"]["notif_channel"]
          created_at?: string
          id?: string
          open_count?: number
          scheduled_at?: string
          status?: Database["public"]["Enums"]["notif_status"]
          target_device_id?: string | null
          target_event_id?: string | null
          target_type?: string
          target_user_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          image_url: string | null
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
        }
        Insert: {
          id?: string
          image_url?: string | null
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
        }
        Update: {
          id?: string
          image_url?: string | null
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_address: string | null
          client_city: string | null
          client_county: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          device_id: string | null
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          user_id: string | null
        }
        Insert: {
          client_address?: string | null
          client_city?: string | null
          client_county?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          user_id?: string | null
        }
        Update: {
          client_address?: string | null
          client_city?: string | null
          client_county?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          device_id?: string | null
          id?: string
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          user_id?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          order: number | null
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          order?: number | null
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          order?: number | null
          website?: string | null
        }
        Relationships: []
      }
      participant_profiles: {
        Row: {
          avatar_url: string | null
          device_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          device_id: string
          name?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          device_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          colors: string[] | null
          created_at: string
          currency: string | null
          description: string
          full_desc: string | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean
          name: string
          price: number
          sizes: string[] | null
          stock: number | null
          user_id: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string
          full_desc?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean
          name: string
          price: number
          sizes?: string[] | null
          stock?: number | null
          user_id?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          colors?: string[] | null
          created_at?: string
          currency?: string | null
          description?: string
          full_desc?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean
          name?: string
          price?: number
          sizes?: string[] | null
          stock?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string
          device_id: string
          email: string | null
          id: string
          name: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string
          device_id?: string
          email?: string | null
          id: string
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string
          device_id?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          age_target: string | null
          capacity: string | null
          category: string
          created_at: string
          description: string | null
          duration: string
          full_desc: string | null
          gallery: Json | null
          id: string
          image_url: string | null
          includes: string[] | null
          order: number | null
          positions: string[] | null
          price: number
          price_label: string | null
          short_desc: string | null
          tag: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          active?: boolean
          age_target?: string | null
          capacity?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: string
          full_desc?: string | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          order?: number | null
          positions?: string[] | null
          price?: number
          price_label?: string | null
          short_desc?: string | null
          tag?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          age_target?: string | null
          capacity?: string | null
          category?: string
          created_at?: string
          description?: string | null
          duration?: string
          full_desc?: string | null
          gallery?: Json | null
          id?: string
          image_url?: string | null
          includes?: string[] | null
          order?: number | null
          positions?: string[] | null
          price?: number
          price_label?: string | null
          short_desc?: string | null
          tag?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      website_content: {
        Row: {
          content: Json | null
          description: string | null
          icons: string[] | null
          id: string
          images: string[] | null
          last_updated: string
          order: number | null
          section_id: string
          styles: Json
          subtitle: string | null
          title: string | null
        }
        Insert: {
          content?: Json | null
          description?: string | null
          icons?: string[] | null
          id?: string
          images?: string[] | null
          last_updated?: string
          order?: number | null
          section_id: string
          styles?: Json
          subtitle?: string | null
          title?: string | null
        }
        Update: {
          content?: Json | null
          description?: string | null
          icons?: string[] | null
          id?: string
          images?: string[] | null
          last_updated?: string
          order?: number | null
          section_id?: string
          styles?: Json
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      bookings_participant_view: {
        Row: {
          avatar_url: string | null
          display_name: string | null
          event_id: string | null
          position: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      events_with_counts: {
        Row: {
          active: boolean
          capacity: string | null
          created_at: string
          currency: string | null
          date: string
          description: string
          duration: string | null
          end_date: string | null
          event_code: string
          gallery: string[] | null
          id: string
          image_url: string | null
          is_public: boolean
          location: string
          max_participants: number | null
          origin_booking_id: string
          participants_count: number
          positions: string[] | null
          price: number
          start_time: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          type: string
          user_id: string | null
        }
        Insert: never
        Update: never
        Relationships: []
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string
          name: string
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Functions: {
      add_event_gallery_photos: {
        Args: { p_event_id: string; p_urls: string[] }
        Returns: undefined
      }
      auto_transition_notifications: { Args: never; Returns: undefined }
      claim_device_bookings: {
        Args: { p_device_id: string }
        Returns: undefined
      }
      create_order: {
        Args: {
          p_client_name: string
          p_client_phone: string
          p_client_address: string
          p_client_city: string
          p_client_county: string
          p_user_id: string
          p_device_id: string
          p_items: Json
        }
        Returns: {
          client_address: string | null
          client_city: string | null
          client_county: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          device_id: string | null
          id: string
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dashboard_stats: { Args: never; Returns: Json }
      enroll_in_event: {
        Args: {
          p_event_id: string
          p_nume_client: string
          p_email: string
          p_telefon: string
          p_device_id: string
          p_user_id?: string | null
          p_selected_position?: string
        }
        Returns: Json
      }
      get_booking_stats: { Args: never; Returns: Json }
      get_event_by_code: { Args: { p_code: string }; Returns: unknown }
      get_event_types: { Args: never; Returns: unknown }
      get_my_notifications: { Args: { p_device_id: string }; Returns: unknown }
      get_my_read_notification_ids: { Args: { p_device_id: string }; Returns: unknown }
      handle_new_user: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      mark_notification_read: {
        Args: { p_notification_id: string; p_device_id: string }
        Returns: undefined
      }
      remove_event_gallery_photo: {
        Args: { p_event_id: string; p_url: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      booking_status: "nou" | "confirmat" | "asteptare" | "finalizat" | "anulat"
      event_status: "pending" | "active" | "finished"
      notif_channel: "htcmx_events" | "htcmx_promo" | "htcmx_general"
      notif_status: "programat" | "trimis" | "anulat"
      order_status: "nou" | "confirmat" | "finalizat" | "anulat"
      product_category:
        | "echipament"
        | "accesorii"
        | "imbracaminte"
        | "protectie"
      user_role: "client" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      booking_status: ["nou", "confirmat", "asteptare", "finalizat", "anulat"],
      event_status: ["pending", "active", "finished"],
      notif_channel: ["htcmx_events", "htcmx_promo", "htcmx_general"],
      notif_status: ["programat", "trimis", "anulat"],
      order_status: ["nou", "confirmat", "finalizat", "anulat"],
      product_category: [
        "echipament",
        "accesorii",
        "imbracaminte",
        "protectie",
      ],
      user_role: ["client", "admin"],
    },
  },
} as const
