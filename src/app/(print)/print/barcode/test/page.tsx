"use client"

import { useEffect, useState } from 'react'

export default function TestBarcodePage() {
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTestBarcode = async () => {
      try {
        const response = await fetch('/api/barcode/test')
        const data = await response.json()
        
        if (data.error) {
          setError(data.error)
        } else {
          setBarcodeUrl(data.barcodeUrl)
        }
      } catch (err) {
        setError('Failed to load test barcode')
        console.error('Error fetching test barcode:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchTestBarcode()
  }, [])

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
          Print Test Barcode
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
            <h2 className="text-2xl font-semibold text-gray-700">TEST BARCODE</h2>
          </div>
        </header>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Test Barcode</h3>
          
          {loading ? (
            <p>Loading test barcode...</p>
          ) : error ? (
            <p className="text-red-500">Error: {error}</p>
          ) : barcodeUrl ? (
            <div className="flex flex-col items-center">
              <img src={barcodeUrl} alt="Test Barcode" className="mb-2" />
              <p className="text-xs text-gray-600">Test Barcode</p>
            </div>
          ) : (
            <p>No barcode available.</p>
          )}
        </section>

        <footer className="text-center mt-16 pt-4 text-xs text-gray-500">
          <p className="italic">* This is a test barcode for verification purposes.</p>
        </footer>
      </div>
    </div>
  )
}