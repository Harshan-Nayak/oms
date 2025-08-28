"use client"

import { Tables, Json } from '@/types/database'
import { formatDate } from '@/lib/utils'

type IsteachingChallan = Tables<'isteaching_challans'> & {
  ledgers: Tables<'ledgers'> | null;
  challan_no: string;
};

type WeaverChallan = { quality_details: Json, batch_number: string }

export default function PrintChallanClient({ isteachingChallan, weaverChallans }: { isteachingChallan: IsteachingChallan, weaverChallans: WeaverChallan[] }) {
  const parseSizeDetails = (sizeDetails: Json | null) => {
    if (!sizeDetails) return []
    try {
      return typeof sizeDetails === 'string' ? JSON.parse(sizeDetails) : sizeDetails
    } catch {
      return []
    }
  }

  const sizeDetails = parseSizeDetails(isteachingChallan.product_size)

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
          Print Challan
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
            <h2 className="text-2xl font-semibold text-gray-700">Stitching  CHALLAN</h2>
            <p className="text-xs text-gray-500">Challan No: <span className="font-medium text-gray-700">{isteachingChallan.challan_no}</span></p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">TO</h3>
            <div className="text-sm">
              {isteachingChallan.ledgers && (
                <>
                  <p className="font-bold text-gray-800">{isteachingChallan.ledgers.business_name}</p>
                  <p>{isteachingChallan.ledgers.address}</p>
                  <p>
                    {[
                      isteachingChallan.ledgers.city,
                      isteachingChallan.ledgers.district,
                      isteachingChallan.ledgers.state,
                    ].filter(Boolean).join(', ')}
                    {isteachingChallan.ledgers.zip_code ? ` - ${isteachingChallan.ledgers.zip_code}` : ''}
                  </p>
                  <p>M: {isteachingChallan.ledgers.mobile_number}</p>
                  {isteachingChallan.ledgers.email && <p>E: {isteachingChallan.ledgers.email}</p>}
                  {isteachingChallan.ledgers.gst_number && <p>GST: {isteachingChallan.ledgers.gst_number}</p>}
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DETAILS</h3>
            <p className="text-sm"><strong>Date:</strong> {new Date(isteachingChallan.date).toLocaleDateString()}</p>
            <p className="text-sm"><strong>Quality:</strong> {isteachingChallan.quality}</p>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Batch Details</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left font-semibold text-gray-600">BATCH NUMBER</th>
                <th className="p-2 text-right font-semibold text-gray-600">QUANTITY</th>
              </tr>
            </thead>
            <tbody>
              {(isteachingChallan.batch_number as unknown as string[]).map((bn, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{bn}</td>
                  <td className="p-2 text-right">{
                    (weaverChallans.find(wc => wc.batch_number === bn)
                      ?.quality_details as { rate: number }[] | undefined)?.[0]?.rate
                  } mtr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Product Details</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left font-semibold text-gray-600">PRODUCT NAME</th>
                <th className="p-2 text-left font-semibold text-gray-600">DESCRIPTION</th>
                <th className="p-2 text-right font-semibold text-gray-600">QUANTITY</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2">{isteachingChallan.product_name}</td>
                <td className="p-2">{isteachingChallan.product_description}</td>
                <td className="p-2 text-right">{isteachingChallan.quantity}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {sizeDetails.length > 0 && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Size Details</h3>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left font-semibold text-gray-600">SIZE</th>
                  <th className="p-2 text-right font-semibold text-gray-600">QUANTITY</th>
                </tr>
              </thead>
              <tbody>
                {sizeDetails.map((size: { size: string; quantity: number }, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{size.size}</td>
                    <td className="p-2 text-right">{size.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="text-center mt-16 pt-4 text-xs text-gray-500">
          <p className="italic">* This is a system generated slip and does not require a signature.</p>
        </footer>
      </div>
    </div>
  )
}
