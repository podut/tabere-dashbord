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
          client_address: string | null
          client_city: string | null
          created_at: string
          device_id: string
          email: string | null
          event_id: string | null
          id: string
          is_service_request: boolean
          judet: string | null
          mesaj: string | null
          nume_client: string
          preferred_date: string | null
          preferred_time: string | null
          selected_position: string | null
          status: Database["public"]["Enums"]["booking_status"]
          telefon: string
          user_id: string | null
          was_before: boolean | null
        }
        Insert: {
          activity_title: string
          client_address?: string | null
          client_city?: string | null
          created_at?: string
          device_id?: string
          email?: string | null
          event_id?: string | null
          id?: string
          is_service_request?: boolean
          judet?: string | null
          mesaj?: string | null
          nume_client: string
          preferred_date?: string | null
          preferred_time?: string | null
          selected_position?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          telefon: string
          user_id?: string | null
          was_before?: boolean | null
        }
        Update: {
          activity_title?: string
          client_address?: string | null
          client_city?: string | null
          created_at?: string
          device_id?: string
          email?: string | null
          event_id?: string | null
          id?: string
          is_service_request?: boolean
          judet?: string | null
          mesaj?: string | null
          nume_client?: string
          preferred_date?: string | null
          preferred_time?: string | null
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
          event_code: string | null
          gallery: string[] | null
          id: string
          image_url: string | null
          is_public: boolean
          location: string | null
          max_participants: number | null
          origin_booking_id: string | null
          positions: string[] | null
          price: number
          start_time: string | null
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
          event_code?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string | null
          max_participants?: number | null
          origin_booking_id?: string | null
          positions?: string[] | null
          price?: number
          start_time?: string | null
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
          event_code?: string | null
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          location?: string | null
          max_participants?: number | null
          origin_booking_id?: string | null
          positions?: string[] | null
          price?: number
          start_time?: string | null
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
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean | null
          is_recurring: boolean | null
          open_count: number
          recurring_hour: number | null
          scheduled_at: string
          status: Database["public"]["Enums"]["notif_status"]
          target_event_id: string | null
          target_type: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_recurring?: boolean | null
          open_count?: number
          recurring_hour?: number | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["notif_status"]
          target_event_id?: string | null
          target_type?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_recurring?: boolean | null
          open_count?: number
          recurring_hour?: number | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["notif_status"]
          target_event_id?: string | null
          target_type?: string | null
          title?: string
          user_id?: string | null
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
          client_name: string | null
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
          client_name?: string | null
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
          client_name?: string | null
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
      pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          sections: Json | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          sections?: Json | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          sections?: Json | null
          slug?: string
          title?: string
          updated_at?: string
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
      posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
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
          created_at: string
          date_of_birth: string | null
          device_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          device_id?: string | null
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          device_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      services: {
        Row: {
          active: boolean
          age_target: string | null
          capacity: string | null
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          full_desc: string | null
          gallery: string[] | null
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
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          full_desc?: string | null
          gallery?: string[] | null
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
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          full_desc?: string | null
          gallery?: string[] | null
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
      trainings: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration: string | null
          id: string
          image_url: string | null
          level: string | null
          title: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          title: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          image_url?: string | null
          level?: string | null
          title?: string
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
          styles: Json | null
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
          styles?: Json | null
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
          styles?: Json | null
          subtitle?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_transition_notifications: { Args: never; Returns: undefined }
      create_order: {
        Args: {
          p_client_address: string
          p_client_city: string
          p_client_county: string
          p_client_name: string
          p_client_phone: string
          p_device_id: string
          p_items: Json
          p_user_id: string
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
      get_booking_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
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

