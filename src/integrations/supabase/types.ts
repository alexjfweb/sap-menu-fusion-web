export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      business_info: {
        Row: {
          address: string | null
          business_name: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook_url: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          nequi_number: string | null
          nequi_qr_url: string | null
          phone: string | null
          public_menu_url: string | null
          tax_id: string | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
          whatsapp_url: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          nequi_number?: string | null
          nequi_qr_url?: string | null
          phone?: string | null
          public_menu_url?: string | null
          tax_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          nequi_number?: string | null
          nequi_qr_url?: string | null
          phone?: string | null
          public_menu_url?: string | null
          tax_id?: string | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string | null
          quantity: number
          session_id: string
          special_instructions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          session_id: string
          special_instructions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string | null
          quantity?: number
          session_id?: string
          special_instructions?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          current_stock: number | null
          id: string
          last_updated: string | null
          max_stock: number | null
          min_stock: number | null
          product_id: string | null
          supplier: string | null
          unit: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          last_updated?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          supplier?: string | null
          unit?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          current_stock?: number | null
          id?: string
          last_updated?: string | null
          max_stock?: number | null
          min_stock?: number | null
          product_id?: string | null
          supplier?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_customization: {
        Row: {
          business_id: string | null
          button_bg_color: string | null
          button_text_color: string | null
          contact_button_bg_color: string | null
          contact_button_text_color: string | null
          created_at: string
          header_bg_color: string | null
          header_text_color: string | null
          id: string
          menu_bg_color: string | null
          product_card_bg_color: string | null
          product_card_border_color: string | null
          product_description_color: string | null
          product_name_color: string | null
          product_price_color: string | null
          shadow_color: string | null
          social_links_color: string | null
          text_color: string | null
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          contact_button_bg_color?: string | null
          contact_button_text_color?: string | null
          created_at?: string
          header_bg_color?: string | null
          header_text_color?: string | null
          id?: string
          menu_bg_color?: string | null
          product_card_bg_color?: string | null
          product_card_border_color?: string | null
          product_description_color?: string | null
          product_name_color?: string | null
          product_price_color?: string | null
          shadow_color?: string | null
          social_links_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          button_bg_color?: string | null
          button_text_color?: string | null
          contact_button_bg_color?: string | null
          contact_button_text_color?: string | null
          created_at?: string
          header_bg_color?: string | null
          header_text_color?: string | null
          id?: string
          menu_bg_color?: string | null
          product_card_bg_color?: string | null
          product_card_border_color?: string | null
          product_description_color?: string | null
          product_name_color?: string | null
          product_price_color?: string | null
          shadow_color?: string | null
          social_links_color?: string | null
          text_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_customization_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "business_info"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number
          special_instructions: string | null
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity: number
          special_instructions?: string | null
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          special_instructions?: string | null
          total_price?: number
          unit_price?: number
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
          created_at: string | null
          created_by: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["order_status"] | null
          table_id: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["order_status"] | null
          table_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          table_id?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          configuration: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          cart_items: Json
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          payment_method: string | null
          payment_status: string | null
          session_id: string
          special_instructions: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          cart_items: Json
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          session_id: string
          special_instructions?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          cart_items?: Json
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          payment_method?: string | null
          payment_status?: string | null
          session_id?: string
          special_instructions?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_reminder_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          performed_by: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          performed_by?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_reminder_configs: {
        Row: {
          created_at: string | null
          days_before: number
          delivery_method: string
          id: string
          is_active: boolean | null
          max_retries: number | null
          name: string
          reminder_type: string
          retry_interval_hours: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_before: number
          delivery_method: string
          id?: string
          is_active?: boolean | null
          max_retries?: number | null
          name: string
          reminder_type: string
          retry_interval_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_before?: number
          delivery_method?: string
          id?: string
          is_active?: boolean | null
          max_retries?: number | null
          name?: string
          reminder_type?: string
          retry_interval_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_reminder_history: {
        Row: {
          config_id: string | null
          created_at: string | null
          delivery_method: string
          error_message: string | null
          id: string
          message_content: string
          next_retry_at: string | null
          retry_count: number | null
          sent_at: string | null
          status: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          delivery_method: string
          error_message?: string | null
          id?: string
          message_content: string
          next_retry_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          delivery_method?: string
          error_message?: string | null
          id?: string
          message_content?: string
          next_retry_at?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminder_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "payment_reminder_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reminder_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminder_settings: {
        Row: {
          audit_log_enabled: boolean | null
          created_at: string | null
          email_provider_config: Json | null
          id: string
          max_messages_per_day: number | null
          sms_provider_config: Json | null
          spam_protection_enabled: boolean | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_provider_config: Json | null
        }
        Insert: {
          audit_log_enabled?: boolean | null
          created_at?: string | null
          email_provider_config?: Json | null
          id?: string
          max_messages_per_day?: number | null
          sms_provider_config?: Json | null
          spam_protection_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_provider_config?: Json | null
        }
        Update: {
          audit_log_enabled?: boolean | null
          created_at?: string | null
          email_provider_config?: Json | null
          id?: string
          max_messages_per_day?: number | null
          sms_provider_config?: Json | null
          spam_protection_enabled?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_provider_config?: Json | null
        }
        Relationships: []
      }
      payment_reminder_templates: {
        Row: {
          config_id: string | null
          created_at: string | null
          delivery_method: string
          id: string
          message_body: string
          subject: string | null
          tone: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          config_id?: string | null
          created_at?: string | null
          delivery_method: string
          id?: string
          message_body: string
          subject?: string | null
          tone?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          config_id?: string | null
          created_at?: string | null
          delivery_method?: string
          id?: string
          message_body?: string
          subject?: string | null
          tone?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_reminder_templates_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "payment_reminder_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reservations: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          party_size: number
          payment_method: string | null
          payment_status: string | null
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          party_size: number
          payment_method?: string | null
          payment_status?: string | null
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          party_size?: number
          payment_method?: string | null
          payment_status?: string | null
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          allergens: string[] | null
          calories: number | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_available: boolean | null
          is_gluten_free: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          preparation_time: number | null
          price: number
          product_type: Database["public"]["Enums"]["product_type"] | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          preparation_time?: number | null
          price: number
          product_type?: Database["public"]["Enums"]["product_type"] | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_available?: boolean | null
          is_gluten_free?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          preparation_time?: number | null
          price?: number
          product_type?: Database["public"]["Enums"]["product_type"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          password_hash: string | null
          phone_landline: string | null
          phone_mobile: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean | null
          password_hash?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          password_hash?: string | null
          phone_landline?: string | null
          phone_mobile?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          payment_provider: string | null
          plan_id: string
          qr_data: string
          qr_image_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_provider?: string | null
          plan_id: string
          qr_data: string
          qr_image_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_provider?: string | null
          plan_id?: string
          qr_data?: string
          qr_image_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          id: string
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests: string | null
          status: Database["public"]["Enums"]["reservation_status"] | null
          table_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          party_size: number
          reservation_date: string
          reservation_time: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          party_size?: number
          reservation_date?: string
          reservation_time?: string
          special_requests?: string | null
          status?: Database["public"]["Enums"]["reservation_status"] | null
          table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          max_subscribers: number | null
          name: string
          price: number
          sort_order: number | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          billing_interval: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_subscribers?: number | null
          name: string
          price: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          max_subscribers?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          is_available: boolean | null
          location: string | null
          table_number: number
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          location?: string | null
          table_number: number
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          location?: string | null
          table_number?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          nequi_transaction_id: string | null
          payment_method_id: string | null
          plan_id: string | null
          qr_code_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          nequi_transaction_id?: string | null
          payment_method_id?: string | null
          plan_id?: string | null
          qr_code_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          nequi_transaction_id?: string | null
          payment_method_id?: string | null
          plan_id?: string | null
          qr_code_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          plan_id: string
          starts_at: string
          status: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          plan_id: string
          starts_at: string
          status?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      order_status:
        | "pendiente"
        | "en_preparacion"
        | "listo"
        | "entregado"
        | "cancelado"
      product_type: "plato" | "bebida" | "postre" | "entrada" | "acompañamiento"
      reservation_status:
        | "pendiente"
        | "confirmada"
        | "cancelada"
        | "completada"
      user_role: "empleado" | "admin" | "superadmin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      order_status: [
        "pendiente",
        "en_preparacion",
        "listo",
        "entregado",
        "cancelado",
      ],
      product_type: ["plato", "bebida", "postre", "entrada", "acompañamiento"],
      reservation_status: [
        "pendiente",
        "confirmada",
        "cancelada",
        "completada",
      ],
      user_role: ["empleado", "admin", "superadmin"],
    },
  },
} as const
