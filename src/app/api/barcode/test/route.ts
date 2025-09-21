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
    
    // Create a URL-encoded string for the barcode content
    const content = encodeURIComponent(JSON.stringify(testBarcodeData))
    const barcodeUrl = `https://barcodeapi.org/api/auto/${content}`
    
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