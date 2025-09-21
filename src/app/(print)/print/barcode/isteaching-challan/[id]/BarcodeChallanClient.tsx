"use client"

import { Tables, Json } from '@/types/database'
import { useEffect, useState } from 'react'

type IsteachingChallan = Tables<'isteaching_challans'> & {
  ledgers: Tables<'ledgers'> | null;
  challan_no: string;
};

type WeaverChallan = { quality_details: Json, batch_number: string }
type BarcodeData = { size: string, quantity: number, barcodes: string[] }

export default function BarcodeChallanClient({ isteachingChallan, weaverChallans }: { isteachingChallan: IsteachingChallan, weaverChallans: WeaverChallan[] }) {
  const [barcodes, setBarcodes] = useState<BarcodeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBarcodes = async () => {
      try {
        const response = await fetch(`/api/barcode/isteaching-challan/${isteachingChallan.id}`)
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          setBarcodes(data.barcodes)
        }
      } catch (err) {
        setError('Failed to load barcodes')
        console.error('Error fetching barcodes:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBarcodes()
  }, [isteachingChallan.id])

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="no-print p-4 bg-white shadow-md flex justify-between items-center">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Barcodes
        </button>
      </div>

      <div className="max-w-4xl mx-auto bg-white p-8 my-8 print:my-0 print:shadow-none shadow-lg font-sans">
        <header className="flex justify-between items-start pb-4 border-b-2 border-gray-800">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">BHAKTINANDAN</h1>
            <p className="text-xs text-gray-500 mt-1">A 606, SARTHAK FLORA,AMARJAVAN
CIRLCE,
 AHEMDABAD, GUJARAT - 24</p>
            <p className="text-xs text-gray-500">Mobile: +91 96623 50960 | GST: 24CFIPB8013H1ZT</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">BARCODES</h2>
            <p className="text-xs text-gray-500">Challan No: <span className="font-medium text-gray-700">{isteachingChallan.challan_no}</span></p>
          </div>
        </header>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Barcode Details</h3>
          
          {loading ? (
            <p>Loading barcodes...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : barcodes.length === 0 ? (
            <p>No barcodes available for this challan.</p>
          ) : (
            barcodes.map((sizeData, index) => (
              <div key={index} className="mb-8">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Size: {sizeData.size} (Quantity: {sizeData.quantity})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sizeData.barcodes.map((barcodeUrl, barcodeIndex) => (
                    <div key={barcodeIndex} className="flex flex-col items-center">
                      <img src={barcodeUrl} alt={`Barcode ${barcodeIndex + 1}`} className="mb-2" />
                      <p className="text-xs text-gray-600">#{barcodeIndex + 1}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <footer className="text-center mt-16 pt-4 text-xs text-gray-500">
          <p className="italic">* These are system generated barcodes and do not require a signature.</p>
        </footer>
      </div>
    </div>
  )
}