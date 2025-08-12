import { Json } from "./supabase"

export type { Json }

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          user_role: 'Admin' | 'Manager' | 'User'
          user_status: 'Active' | 'Inactive'
          profile_photo: string | null
          mobile: string | null
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          document_type: string | null
          document_number: string | null
          dob: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          user_role?: 'Admin' | 'Manager' | 'User'
          user_status?: 'Active' | 'Inactive'
          profile_photo?: string | null
          mobile?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          document_type?: string | null
          document_number?: string | null
          dob?: string | null
        }
        Update: {
          email?: string
          first_name?: string | null
          last_name?: string | null
          user_role?: 'Admin' | 'Manager' | 'User'
          user_status?: 'Active' | 'Inactive'
          profile_photo?: string | null
          mobile?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          document_type?: string | null
          document_number?: string | null
          dob?: string | null
        }
      }
      products: {
        Row: {
          id: number
          product_image: string | null
          product_name: string
          product_sku: string
          product_category: string
          product_sub_category: string | null
          product_size: string | null
          product_color: string | null
          product_description: string | null
          product_material: string | null
          product_brand: string | null
          product_country: string | null
          product_status: 'Active' | 'Inactive'
          product_qty: number | null
          wash_care: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          product_image?: string | null
          product_name: string
          product_sku: string
          product_category: string
          product_sub_category?: string | null
          product_size?: string | null
          product_color?: string | null
          product_description?: string | null
          product_material?: string | null
          product_brand?: string | null
          product_country?: string | null
          product_status?: 'Active' | 'Inactive'
          product_qty?: number | null
          wash_care?: string | null
          created_by: string
        }
        Update: {
          product_image?: string | null
          product_name?: string
          product_sku?: string
          product_category?: string
          product_sub_category?: string | null
          product_size?: string | null
          product_color?: string | null
          product_description?: string | null
          product_material?: string | null
          product_brand?: string | null
          product_country?: string | null
          product_status?: 'Active' | 'Inactive'
          product_qty?: number | null
          wash_care?: string | null
        }
      }
      ledgers: {
        Row: {
          ledger_id: string
          business_logo: string | null
          business_name: string
          contact_person_name: string | null
          mobile_number: string | null
          email: string | null
          address: string | null
          city: string | null
          district: string | null
          state: string | null
          country: string | null
          zip_code: string | null
          gst_number: string | null
          created_by: string
          created_at: string
          updated_at: string
          edit_logs: string | null
        }
        Insert: {
          ledger_id: string
          business_logo?: string | null
          business_name: string
          contact_person_name?: string | null
          mobile_number?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          gst_number?: string | null
          created_by: string
          edit_logs?: string | null
        }
        Update: {
          business_logo?: string | null
          business_name?: string
          contact_person_name?: string | null
          mobile_number?: string | null
          email?: string | null
          address?: string | null
          city?: string | null
          district?: string | null
          state?: string | null
          country?: string | null
          zip_code?: string | null
          gst_number?: string | null
          edit_logs?: string | null
        }
      }
      weaver_challans: {
        Row: {
          id: number
          challan_date: string
          batch_number: string
          challan_no: string
          ms_party_name: string
          ledger_id: string
          delivery_at: string | null
          bill_no: string | null
          total_grey_mtr: number
          fold_cm: number | null
          width_inch: number | null
          taka: number
          transport_name: string | null
          lr_number: string | null
          transport_charge: number | null
          quality_details: Json | null
          created_by: string
          created_at: string
          updated_at: string
          edit_logs: string | null
        }
        Insert: {
          challan_date: string
          batch_number: string
          challan_no: string
          ms_party_name: string
          ledger_id: string
          delivery_at?: string | null
          bill_no?: string | null
          total_grey_mtr: number
          fold_cm?: number | null
          width_inch?: number | null
          taka: number
          transport_name?: string | null
          lr_number?: string | null
          transport_charge?: number | null
          quality_details?: Json | null
          created_by: string
          edit_logs?: string | null
        }
        Update: {
          challan_date?: string
          batch_number?: string
          challan_no?: string
          ms_party_name?: string
          ledger_id?: string
          delivery_at?: string | null
          bill_no?: string | null
          total_grey_mtr?: number
          fold_cm?: number | null
          width_inch?: number | null
          taka?: number
          transport_name?: string | null
          lr_number?: string | null
          transport_charge?: number | null
          quality_details?: Json | null
          edit_logs?: string | null
        }
      }
      purchase_orders: {
        Row: {
          id: number
          po_number: string
          po_date: string
          supplier_name: string
          ledger_id: string | null
          total_amount: number
          status: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled'
          description: string | null
          delivery_date: string | null
          terms_conditions: string | null
          items: Json
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          po_number: string
          po_date: string
          supplier_name: string
          ledger_id?: string | null
          total_amount?: number
          status?: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled'
          description?: string | null
          delivery_date?: string | null
          terms_conditions?: string | null
          items?: Json
          created_by: string
        }
        Update: {
          po_number?: string
          po_date?: string
          supplier_name?: string
          ledger_id?: string | null
          total_amount?: number
          status?: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled'
          description?: string | null
          delivery_date?: string | null
          terms_conditions?: string | null
          items?: Json
        }
      }
    }
  }
}

export type UserRole = 'Admin' | 'Manager' | 'User'
export type UserStatus = 'Active' | 'Inactive'
export type ProductStatus = 'Active' | 'Inactive'
export type PurchaseOrderStatus = 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled'
