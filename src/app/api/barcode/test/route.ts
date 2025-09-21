import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Create test barcode data
    const testBarcodeData = {
      productName: 'Test Product',
      productDescription: 'This is a test product for barcode generation',
      batchNumber: ['BN001', 'BN002'],
      cost: 100.50,
      weaverChallanNumber: 'WC001',
      stitchingChallanNumber: 'SC001',
      size: 'M',
      barcodeNumber: 1,
      productSKU: 'TP001',
      productCategory: 'Test Category',
      productSubCategory: 'Test Subcategory',
      productBrand: 'Test Brand',
      productColor: 'Red',
      productMaterial: 'Cotton',
      quality: 'Premium',
      ledgerName: 'Test Ledger'
    }
    
    // Create a simplified content for the barcode (using product SKU for simplicity)
    const content = testBarcodeData.productSKU || 'TEST001'
    // Generate Code128 barcode using bwip-js API
    const barcodeUrl = `http://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(content)}&scale=3&height=10&includetext=true&textxalign=center`
    
    return NextResponse.json({ 
      success: true,
      barcodeUrl: barcodeUrl,
      data: testBarcodeData
    })
  } catch (error) {
    console.error('Error generating test barcode:', error)
    return NextResponse.json({ error: 'Failed to generate test barcode' }, { status: 500 })
  }
}