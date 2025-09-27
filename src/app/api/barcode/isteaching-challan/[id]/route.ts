import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const supabase = createServerSupabaseClient()
    
    // Fetch the stitching challan with related data
    const { data: isteachingChallan, error } = await supabase
      .from('isteaching_challans')
      .select(`
        *,
        ledgers (*),
        products (*)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error || !isteachingChallan) {
      return NextResponse.json({ error: 'Challan not found' }, { status: 404 })
    }

    // Parse size details
    const parseSizeDetails = (sizeDetails: unknown): { size: string; quantity: number }[] => {
      if (!sizeDetails) return []
      try {
        return typeof sizeDetails === 'string' ? JSON.parse(sizeDetails) : sizeDetails as { size: string; quantity: number }[]
      } catch {
        return []
      }
    }

    // Fetch related weaver challans to get cost and weaver challan number
    const { data: relatedWeaverChallans } = await supabase
      .from('weaver_challans')
      .select('*')
      .in('batch_number', isteachingChallan.batch_number as string[])

    const sizeDetails = parseSizeDetails(isteachingChallan.product_size)
    
    // For each size, generate the required number of barcodes
    const barcodeData = sizeDetails.map((size: { size: string; quantity: number }) => {
      // Calculate total barcodes needed (quantity + 3 as per requirements)
      const totalBarcodes = size.quantity + 3
      const barcodes = []
      
      // Generate barcode URLs for this size
      for (let i = 1; i <= totalBarcodes; i++) {
        // Create the data for the barcode
        const barcodeContent = {
          productName: isteachingChallan.products?.product_name || isteachingChallan.product_name || '',
          productDescription: isteachingChallan.products?.product_description || isteachingChallan.product_description || '',
          batchNumber: isteachingChallan.batch_number || [],
          cost: (() => {
            // Calculate cost based on quantity and rate from weaver challans
            if (relatedWeaverChallans && relatedWeaverChallans.length > 0) {
              // Get the first weaver challan as reference (in a real implementation, you might want to be more specific)
              const weaverChallan = relatedWeaverChallans[0];
              
              // Try to get rate from quality_details
              let rate = 0;
              if (weaverChallan.quality_details && Array.isArray(weaverChallan.quality_details)) {
                const quality = weaverChallan.quality_details.find((q: { quality_name?: string; rate?: number }) => q.quality_name === isteachingChallan.quality);
                if (quality && quality.rate) {
                  rate = quality.rate;
                }
              }
              
              // Calculate cost as quantity * rate
              return (isteachingChallan.quantity || 0) * rate;
            }
            // Fallback to vendor_amount if no rate is found
            return relatedWeaverChallans?.reduce((sum, wc) => sum + (wc.vendor_amount || 0), 0) || 0;
          })(),
          weaverChallanNumber: relatedWeaverChallans?.map(wc => wc.challan_no).join(', ') || '',
          stitchingChallanNumber: isteachingChallan.challan_no,
          size: size.size,
          barcodeNumber: i,
          // Add more product metadata
          productSKU: isteachingChallan.products?.product_sku || isteachingChallan.product_sku || '',
          productCategory: isteachingChallan.products?.product_category || isteachingChallan.category || '',
          productSubCategory: isteachingChallan.products?.product_sub_category || isteachingChallan.sub_category || '',
          productBrand: isteachingChallan.products?.product_brand || isteachingChallan.brand || 'Bhaktinandan',
          productColor: isteachingChallan.products?.product_color || isteachingChallan.product_color || '',
          productMaterial: isteachingChallan.products?.product_material || '',
          quality: isteachingChallan.quality || '',
          ledgerName: isteachingChallan.ledgers?.business_name || ''
        }
        
        // Create a simplified content for the barcode (embedding the product URL with size info)
        // Get the product ID to create the URL
        const productId = isteachingChallan.products?.id || isteachingChallan.selected_product_id || null;
        let barcodeText;
        
        if (productId) {
          // Create the URL with the product ID and include size information
          const productUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://oms-two-mu.vercel.app'}/product/${productId}?size=${size.size}&barcode=${i}`;
          barcodeText = productUrl;
        } else {
          // Fallback to original format if no product ID is available
          const productSKU = isteachingChallan.products?.product_sku || isteachingChallan.product_sku || 'NOSKU';
          barcodeText = `${productSKU}-${size.size}-${i}`;
        }
        
        // Generate Code128 barcode using bwip-js API
        const barcodeUrl = `http://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(barcodeText)}&scale=3&height=10&includetext=true&textxalign=center`
        barcodes.push(barcodeUrl)
      }
      
      return {
        size: size.size,
        quantity: size.quantity,
        barcodes: barcodes
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      challan: isteachingChallan.challan_no,
      barcodes: barcodeData
    })
  } catch (error) {
    console.error('Error generating barcodes:', error)
    return NextResponse.json({ error: 'Failed to generate barcodes' }, { status: 500 })
  }
}
