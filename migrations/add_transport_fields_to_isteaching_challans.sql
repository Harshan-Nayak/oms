-- Migration to add transportation fields to isteaching_challans table
-- This migration adds the same transportation fields that exist in weaver_challans table

-- Add transport_name column
ALTER TABLE public.isteaching_challans 
ADD COLUMN IF NOT EXISTS transport_name TEXT;

-- Add lr_number column  
ALTER TABLE public.isteaching_challans 
ADD COLUMN IF NOT EXISTS lr_number TEXT;

-- Add transport_charge column
ALTER TABLE public.isteaching_challans 
ADD COLUMN IF NOT EXISTS transport_charge DECIMAL(10,2);
