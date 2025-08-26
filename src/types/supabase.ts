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
      isteaching_challans: {
        Row: {
          id: number
          date: string
          ledger_id: string | null
          quality: string
          batch_number: string
          quantity: number
          product_name: string | null
          product_description: string | null
          product_image: string | null
          product_sku: string | null
          product_qty: number | null
          product_color: string | null
          product_size: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          date: string
          ledger_id?: string | null
          quality: string
          batch_number: string
          quantity: number
          product_name?: string | null
          product_description?: string | null
          product_image?: string | null
          product_sku?: string | null
          product_qty?: number | null
          product_color?: string | null
          product_size?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          date?: string
          ledger_id?: string | null
          quality?: string
          batch_number?: string
          quantity?: number
          product_name?: string | null
          product_description?: string | null
          product_image?: string | null
          product_sku?: string | null
          product_qty?: number | null
          product_color?: string | null
          product_size?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
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
      isteaching_challan_logs: {
        Row: {
          id: number
          challan_id: number | null
          changed_by: string | null
          changes: Json | null
          changed_at: string
        }
        Insert: {
          id?: number
          challan_id?: number | null
          changed_by?: string | null
          changes?: Json | null
          changed_at?: string
        }
        Update: {
          id?: number
          challan_id?: number | null
          changed_by?: string | null
          changes?: Json | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "isteaching_challan_logs_challan_id_fkey"
            columns: ["challan_id"]
            isOneToOne: false
            referencedRelation: "isteaching_challans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "isteaching_challan_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
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
          created_at: string | null
          created_by: string | null
          district: string | null
          edit_logs: string | null
          email: string | null
          gst_number: string | null
          ledger_id: string
          mobile_number: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          business_logo?: string | null
          business_name: string
          city?: string | null
          contact_person_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          edit_logs?: string | null
          email?: string | null
          gst_number?: string | null
          ledger_id: string
          mobile_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          business_logo?: string | null
          business_name?: string
          city?: string | null
          contact_person_name?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          district?: string | null
          edit_logs?: string | null
          email?: string | null
          gst_number?: string | null
          ledger_id?: string
          mobile_number?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
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
      products: {
        Row: {
          created_at: string | null
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
          updated_at: string | null
          wash_care: string | null
        }
        Insert: {
          created_at?: string | null
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
          updated_at?: string | null
          wash_care?: string | null
        }
        Update: {
          created_at?: string | null
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
          updated_at?: string | null
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
          created_at: string | null
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
          updated_at: string | null
          user_role: string | null
          user_status: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
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
          updated_at?: string | null
          user_role?: string | null
          user_status?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
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
          updated_at?: string | null
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
          created_at: string | null
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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
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
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
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
          updated_at?: string | null
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
      weaver_challans: {
        Row: {
          batch_number: string
          bill_no: string | null
          challan_date: string
          challan_no: string
          created_at: string | null
          created_by: string | null
          delivery_at: string | null
          edit_logs: string | null
          fold_cm: number | null
          id: number
          ledger_id: string | null
          lr_number: string | null
          ms_party_name: string
          quality_details: Json | null
          taka: number
          total_grey_mtr: number
          transport_charge: number | null
          transport_name: string | null
          updated_at: string | null
          width_inch: number | null
        }
        Insert: {
          batch_number: string
          bill_no?: string | null
          challan_date: string
          challan_no: string
          created_at?: string | null
          created_by?: string | null
          delivery_at?: string | null
          edit_logs?: string | null
          fold_cm?: number | null
          id?: number
          ledger_id?: string | null
          lr_number?: string | null
          ms_party_name: string
          quality_details?: Json | null
          taka: number
          total_grey_mtr: number
          transport_charge?: number | null
          transport_name?: string | null
          updated_at?: string | null
          width_inch?: number | null
        }
        Update: {
          batch_number?: string
          bill_no?: string | null
          challan_date?: string
          challan_no?: string
          created_at?: string | null
          created_by?: string | null
          delivery_at?: string | null
          edit_logs?: string | null
          fold_cm?: number | null
          id?: number
          ledger_id?: string | null
          lr_number?: string | null
          ms_party_name?: string
          quality_details?: Json | null
          taka?: number
          total_grey_mtr?: number
          transport_charge?: number | null
          transport_name?: string | null
          updated_at?: string | null
          width_inch?: number | null
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
