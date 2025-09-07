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
      expenses: {
        Row: {
          cost: number
          created_at: string
          created_by: string | null
          expense_date: string
          expense_for: string[]
          id: number
          ledger_id: string | null
          challan_no: string | null
          other_expense_description: string | null
          updated_at: string
        }
        Insert: {
          cost: number
          created_at?: string
          created_by?: string | null
          expense_date: string
          expense_for: string[]
          id?: number
          ledger_id?: string | null
          challan_no?: string | null
          other_expense_description?: string | null
          updated_at?: string
        }
        Update: {
          cost?: number
          created_at?: string
          created_by?: string | null
          expense_date?: string
          expense_for?: string[]
          id?: number
          ledger_id?: string | null
          challan_no?: string | null
          other_expense_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
          {
            foreignKeyName: "expenses_challan_no_fkey"
            columns: ["challan_no"]
            isOneToOne: false
            referencedRelation: "weaver_challans"
            referencedColumns: ["challan_no"]
          },
        ]
      }
      expense_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          changes: Json | null
          expense_id: number | null
          id: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          expense_id?: number | null
          id?: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          expense_id?: number | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "expense_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_logs_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      isteaching_challans: {
        Row: {
          challan_no: string
          id: number
          date: string
          ledger_id: string | null
          quality: string
          batch_number: string[]
          quantity: number
          product_name: string | null
          product_description: string | null
          product_image: string | null
          product_sku: string | null
          product_qty: number | null
          product_color: string | null
          product_size: Json | null
          transport_name: string | null
          lr_number: string | null
          transport_charge: number | null
          created_by: string | null
          created_at: string
          updated_at: string
          cloth_type: string[] | null
          top_qty: number | null
          top_pcs_qty: number | null
          bottom_qty: number | null
          bottom_pcs_qty: number | null
        }
        Insert: {
          challan_no: string
          id?: number
          date: string
          ledger_id?: string | null
          quality: string
          batch_number: string[]
          quantity: number
          product_name?: string | null
          product_description?: string | null
          product_image?: string | null
          product_sku?: string | null
          product_qty?: number | null
          product_color?: string | null
          product_size?: Json | null
          transport_name?: string | null
          lr_number?: string | null
          transport_charge?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          cloth_type?: string[] | null
          top_qty?: number | null
          top_pcs_qty?: number | null
          bottom_qty?: number | null
          bottom_pcs_qty?: number | null
        }
        Update: {
          challan_no?: string
          id?: number
          date?: string
          ledger_id?: string | null
          quality?: string
          batch_number?: string[]
          quantity?: number
          product_name?: string | null
          product_description?: string | null
          product_image?: string | null
          product_sku?: string | null
          product_qty?: number | null
          product_color?: string | null
          product_size?: Json | null
          transport_name?: string | null
          lr_number?: string | null
          transport_charge?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          cloth_type?: string[] | null
          top_qty?: number | null
          top_pcs_qty?: number | null
          bottom_qty?: number | null
          bottom_pcs_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "isteaching_challans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "isteaching_challans_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          }
        ]
      }
      ledgers: {
        Row: {
          address: string | null
          business_logo: string | null
          business_name: string
          city: string | null
          contact_person_name: string | null
          country: string | null
          created_at: string
          created_by: string | null
          district: string | null
          email: string | null
          gst_number: string | null
          ledger_id: string
          mobile_number: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
          pan_number: string | null
        }
        Insert: {
          address?: string | null
          business_logo?: string | null
          business_name: string
          city?: string | null
          contact_person_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          gst_number?: string | null
          ledger_id: string
          mobile_number?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
          pan_number?: string | null
        }
        Update: {
          address?: string | null
          business_logo?: string | null
          business_name?: string
          city?: string | null
          contact_person_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          district?: string | null
          email?: string | null
          gst_number?: string | null
          ledger_id?: string
          mobile_number?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
          pan_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledgers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_logs: {
        Row: {
          changed_at: string
          changed_by: string | null
          changes: Json | null
          id: number
          ledger_id: string | null
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          id?: number
          ledger_id?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          changes?: Json | null
          id?: number
          ledger_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_logs_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          product_brand: string | null
          product_category: string
          product_color: string | null
          product_country: string | null
          product_description: string | null
          product_image: string | null
          product_material: string | null
          product_name: string
          product_qty: number | null
          product_size: string | null
          product_sku: string
          product_status: string | null
          product_sub_category: string | null
          updated_at: string
          wash_care: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          product_brand?: string | null
          product_category: string
          product_color?: string | null
          product_country?: string | null
          product_description?: string | null
          product_image?: string | null
          product_material?: string | null
          product_name: string
          product_qty?: number | null
          product_size?: string | null
          product_sku: string
          product_status?: string | null
          product_sub_category?: string | null
          updated_at?: string
          wash_care?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          product_brand?: string | null
          product_category?: string
          product_color?: string | null
          product_country?: string | null
          product_description?: string | null
          product_image?: string | null
          product_material?: string | null
          product_name?: string
          product_qty?: number | null
          product_size?: string | null
          product_sku?: string
          product_status?: string | null
          product_sub_category?: string | null
          updated_at?: string
          wash_care?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          dob: string | null
          document_number: string | null
          document_type: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          mobile: string | null
          profile_photo: string | null
          state: string | null
          updated_at: string
          user_role: string | null
          user_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dob?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          mobile?: string | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          user_role?: string | null
          user_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          dob?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          mobile?: string | null
          profile_photo?: string | null
          state?: string | null
          updated_at?: string
          user_role?: string | null
          user_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_date: string | null
          description: string | null
          id: number
          items: Json | null
          ledger_id: string | null
          po_date: string
          po_number: string
          status: string | null
          supplier_name: string
          terms_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          id?: number
          items?: Json | null
          ledger_id?: string | null
          po_date: string
          po_number: string
          status?: string | null
          supplier_name: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_date?: string | null
          description?: string | null
          id?: number
          items?: Json | null
          ledger_id?: string | null
          po_date?: string
          po_number?: string
          status?: string | null
          supplier_name?: string
          terms_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
        ]
      }
      shorting_entries: {
        Row: {
          id: number
          entry_date: string
          ledger_id: string | null
          weaver_challan_id: number | null
          quality_name: string | null
          shorting_qty: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          entry_date?: string
          ledger_id?: string | null
          weaver_challan_id?: number | null
          quality_name?: string | null
          shorting_qty: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          entry_date?: string
          ledger_id?: string | null
          weaver_challan_id?: number | null
          quality_name?: string | null
          shorting_qty?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shorting_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shorting_entries_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
          {
            foreignKeyName: "shorting_entries_weaver_challan_id_fkey"
            columns: ["weaver_challan_id"]
            isOneToOne: true
            referencedRelation: "weaver_challans"
            referencedColumns: ["id"]
          }
        ]
      }
      weaver_challans: {
        Row: {
          batch_number: string
          challan_date: string
          challan_no: string
          created_at: string
          created_by: string | null
          fold_cm: number | null
          id: number
          ledger_id: string | null
          lr_number: string | null
          ms_party_name: string
          quality_details: Json | null
          taka: number
          taka_details: Json | null
          total_grey_mtr: number
          transport_charge: number | null
          transport_name: string | null
          updated_at: string
          width_inch: number | null
          vendor_ledger_id: string | null
          vendor_invoice_number: string | null
          vendor_amount: number | null
        }
        Insert: {
          batch_number: string
          challan_date: string
          challan_no: string
          created_at?: string
          created_by?: string | null
          fold_cm?: number | null
          id?: number
          ledger_id?: string | null
          lr_number?: string | null
          ms_party_name: string
          quality_details?: Json | null
          taka: number
          taka_details?: Json | null
          total_grey_mtr: number
          transport_charge?: number | null
          transport_name?: string | null
          updated_at?: string
          width_inch?: number | null
          vendor_ledger_id?: string | null
          vendor_invoice_number?: string | null
          vendor_amount?: number | null
        }
        Update: {
          batch_number?: string
          challan_date?: string
          challan_no?: string
          created_at?: string
          created_by?: string | null
          fold_cm?: number | null
          id?: number
          ledger_id?: string | null
          lr_number?: string | null
          ms_party_name?: string
          quality_details?: Json | null
          taka?: number
          taka_details?: Json | null
          total_grey_mtr?: number
          transport_charge?: number | null
          transport_name?: string | null
          updated_at?: string
          width_inch?: number | null
          vendor_ledger_id?: string | null
          vendor_invoice_number?: string | null
          vendor_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weaver_challans_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weaver_challans_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
          {
            foreignKeyName: "weaver_challans_vendor_ledger_id_fkey"
            columns: ["vendor_ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
        ]
      }
      payment_vouchers: {
        Row: {
          id: number
          date: string
          ledger_id: string | null
          payment_for: string
          payment_type: string
          amount: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          ledger_id?: string | null
          payment_for: string
          payment_type: string
          amount: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          ledger_id?: string | null
          payment_for?: string
          payment_type?: string
          amount?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "ledgers"
            referencedColumns: ["ledger_id"]
          },
        ]
      }
      payment_voucher_logs: {
        Row: {
          id: number
          payment_voucher_id: number | null
          changed_by: string | null
          changes: Json | null
          changed_at: string
        }
        Insert: {
          id?: number
          payment_voucher_id?: number | null
          changed_by?: string | null
          changes?: Json | null
          changed_at?: string
        }
        Update: {
          id?: number
          payment_voucher_id?: number | null
          changed_by?: string | null
          changes?: Json | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_voucher_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_voucher_logs_payment_voucher_id_fkey"
            columns: ["payment_voucher_id"]
            isOneToOne: false
            referencedRelation: "payment_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          aud: string
          role: string
          email: string
          phone: string
          created_at: string
          last_sign_in_at: string
          app_metadata: Json
          user_metadata: Json
          identities: Json
          updated_at: string
        }
      }
      log_expense_changes: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      log_ledger_changes: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      log_payment_voucher_changes: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
