import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

interface Product {
  id: number;
  product_image?: string;
  product_name: string;
  product_sku: string;
  product_category: string;
  product_sub_category?: string;
  product_size?: string;
  product_color?: string;
  product_description?: string;
  product_material?: string;
  product_brand: string;
 product_country: string;
  product_status: 'Active' | 'Inactive';
  product_qty: number;
  wash_care?: string;
 created_at: string;
 updated_at: string;
  batch_numbers?: string[];
  cost_incurred?: number;
  weaver_challan_numbers?: string[];
  stitching_challan_numbers?: string[];
  associated_data?: {
    stitching_challans: IsteachingChallan[];
    weaver_challans: WeaverChallan[];
  };
}

interface IsteachingChallan {
  id: number;
  challan_no: string;
 date: string;
 batch_number: string[];
  quality: string;
  quantity: number;
  product_size: { size: string; quantity: number }[]; // Array of size objects
}

interface WeaverChallan {
  challan_no: string;
  batch_number: string;
  quality_details: Record<string, unknown> | null;
  vendor_amount: number;
}

interface Expense {
  cost: number;
}

// Parse size details from various formats
const parseSizeDetails = (sizeDetails: unknown): { size: string; quantity: number }[] => {
  if (!sizeDetails) return []
 try {
    if (typeof sizeDetails === 'string') {
      // If it's a string, try to parse as JSON
      const parsed = JSON.parse(sizeDetails);
      // If parsed result is an array, return it
      if (Array.isArray(parsed)) {
        return parsed;
      }
      // If parsed result is an object with size and quantity, wrap in array
      if (parsed && typeof parsed === 'object' && parsed.size && parsed.quantity !== undefined) {
        return [parsed];
      }
      return [];
    } else if (Array.isArray(sizeDetails)) {
      // If it's already an array, return as is
      return sizeDetails;
    } else if (sizeDetails && typeof sizeDetails === 'object' && (sizeDetails as { size: string; quantity: number }).size && (sizeDetails as { size: string; quantity: number }).quantity !== undefined) {
      // If it's a single object with size and quantity, wrap in array
      return [(sizeDetails as { size: string; quantity: number })];
    }
    return [];
  } catch {
    return [];
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const supabase = createServerSupabaseClient();
    
    // First, fetch the product by ID
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();
    
    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Find all isteaching_challans associated with this product
    const { data: isteachingChallans, error: challanError } = await supabase
      .from('isteaching_challans')
      .select(`
        id,
        challan_no,
        date,
        batch_number,
        quality,
        quantity,
        product_size
      `)
      .eq('selected_product_id', resolvedParams.id);
    
    if (challanError) {
      console.error('Error fetching isteaching challans:', challanError);
    }
    
    // Parse product_size in isteachingChallans to handle different formats
    const parsedIsteachingChallans = isteachingChallans?.map((challan: IsteachingChallan) => ({
      ...challan,
      product_size: parseSizeDetails(challan.product_size)
    })) || [];
    
    // Get all batch numbers associated with this product
    const allBatchNumbers = parsedIsteachingChallans ? parsedIsteachingChallans.flatMap((challan: IsteachingChallan) => challan.batch_number) : [];
    
    // Find all weaver_challans associated with these batch numbers
    let weaverChallans: WeaverChallan[] = [];
    if (allBatchNumbers.length > 0) {
      const { data: relatedWeaverChallans, error: weaverError } = await supabase
        .from('weaver_challans')
        .select('challan_no, batch_number, quality_details, vendor_amount')
        .in('batch_number', allBatchNumbers);
      
      if (weaverError) {
        console.error('Error fetching weaver challans:', weaverError);
      }
      
      weaverChallans = relatedWeaverChallans as WeaverChallan[] || [];
    }
    
    // Calculate total cost from expenses associated with the stitching challans
    let totalCost = 0;
    if (parsedIsteachingChallans && parsedIsteachingChallans.length > 0) {
      const stitchingChallanNos = parsedIsteachingChallans.map((challan: IsteachingChallan) => challan.challan_no);
      
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select('cost')
        .in('challan_no', stitchingChallanNos);
      
      if (expenseError) {
        console.error('Error fetching expenses:', expenseError);
      }
      
      if (expenses) {
        totalCost = expenses.reduce((sum, expense: Expense) => sum + (expense.cost || 0), 0);
      }
    }
    
    // Return the product data with additional information
    return NextResponse.json({
      id: product.id,
      product_image: product.product_image,
      product_name: product.product_name,
      product_description: product.product_description,
      product_sku: product.product_sku,
      product_category: product.product_category,
      product_sub_category: product.product_sub_category,
      product_size: product.product_size,
      product_color: product.product_color,
      product_material: product.product_material,
      product_brand: product.product_brand,
      product_country: product.product_country,
      product_status: product.product_status,
      product_qty: product.product_qty,
      wash_care: product.wash_care,
      created_at: product.created_at,
      updated_at: product.updated_at,
      // Additional fields
      batch_numbers: allBatchNumbers,
      cost_incurred: totalCost,
      weaver_challan_numbers: weaverChallans.map(wc => wc.challan_no),
      stitching_challan_numbers: parsedIsteachingChallans ? parsedIsteachingChallans.map((sc: IsteachingChallan) => sc.challan_no) : [],
      associated_data: {
        stitching_challans: parsedIsteachingChallans,
        weaver_challans: weaverChallans
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
