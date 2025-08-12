"use client"

import { formatDate } from '@/lib/utils'
import { Tables, Json } from '@/types/supabase'

type WeaverChallan = Tables<'weaver_challans'> & {
  ledgers: Tables<'ledgers'> | null
}

export default function PrintChallanClient({ weaverChallan }: { weaverChallan: WeaverChallan }) {
  const parseQualityDetails = (qualityDetails: Json | null) => {
    if (!qualityDetails) return []
    try {
      return typeof qualityDetails === 'string' ? JSON.parse(qualityDetails) : qualityDetails
    } catch {
      return []
    }
  }

  const qualityDetails = parseQualityDetails(weaverChallan.quality_details)

  return (
    <div className="min-h-screen bg-white p-8 print:p-0">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>

      {/* Print Button - Hidden in print */}
      <div className="no-print mb-6 flex justify-between items-center">
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Print Challan
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WEAVER CHALLAN</h1>
              <div className="mt-2">
                <p className="text-lg font-semibold">Bhaktinandan</p>
                <p className="text-sm text-gray-600">Textile Manufacturing</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{weaverChallan.challan_no}</div>
              <div className="text-lg font-semibold text-green-600">{weaverChallan.batch_number}</div>
              <div className="text-sm text-gray-600 mt-1">
                Date: {formatDate(weaverChallan.challan_date)}
              </div>
            </div>
          </div>
        </div>

        {/* Party and Production Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Party Information</h2>
            <div className="space-y-1">
              <p className="font-semibold">{weaverChallan.ms_party_name}</p>
              {weaverChallan.ledgers && (
                <>
                  {weaverChallan.ledgers.business_name && (
                    <p>{weaverChallan.ledgers.business_name}</p>
                  )}
                  {weaverChallan.ledgers.contact_person_name && (
                    <p>Contact: {weaverChallan.ledgers.contact_person_name}</p>
                  )}
                  {weaverChallan.ledgers.mobile_number && (
                    <p>Mobile: {weaverChallan.ledgers.mobile_number}</p>
                  )}
                  {weaverChallan.ledgers.email && (
                    <p>Email: {weaverChallan.ledgers.email}</p>
                  )}
                  {weaverChallan.ledgers.address && (
                    <p>{weaverChallan.ledgers.address}</p>
                  )}
                  {(weaverChallan.ledgers.city || weaverChallan.ledgers.state) && (
                    <p>{weaverChallan.ledgers.city}, {weaverChallan.ledgers.state}</p>
                  )}
                  {weaverChallan.ledgers.gst_number && (
                    <p>GST: {weaverChallan.ledgers.gst_number}</p>
                  )}
                </>
              )}
              {weaverChallan.delivery_at && (
                <p><span className="font-medium">Delivery:</span> {weaverChallan.delivery_at}</p>
              )}
              {weaverChallan.bill_no && (
                <p><span className="font-medium">Bill No:</span> {weaverChallan.bill_no}</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Production Details</h2>
            <div className="space-y-1">
              <p><span className="font-medium">Total Grey Meters:</span> {weaverChallan.total_grey_mtr} meters</p>
              <p><span className="font-medium">Taka:</span> {weaverChallan.taka}</p>
              {weaverChallan.fold_cm && (
                <p><span className="font-medium">Fold:</span> {weaverChallan.fold_cm} cm</p>
              )}
              {weaverChallan.width_inch && (
                <p><span className="font-medium">Width:</span> {weaverChallan.width_inch} inches</p>
              )}
              <p><span className="font-medium">Created:</span> {weaverChallan.created_at ? formatDate(weaverChallan.created_at) : 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Quality Details */}
        {qualityDetails.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Quality Specifications</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Quality Details</th>
                </tr>
              </thead>
              <tbody>
                {qualityDetails.map((detail: { [key: string]: string | number }, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(detail).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                            <span className="ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transport Information */}
        {(weaverChallan.transport_name || weaverChallan.lr_number || weaverChallan.transport_charge) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Transport Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              {weaverChallan.transport_name && (
                <div>
                  <span className="font-medium">Transport:</span>
                  <p>{weaverChallan.transport_name}</p>
                </div>
              )}
              {weaverChallan.lr_number && (
                <div>
                  <span className="font-medium">LR Number:</span>
                  <p>{weaverChallan.lr_number}</p>
                </div>
              )}
              {weaverChallan.transport_charge && (
                <div>
                  <span className="font-medium">Charge:</span>
                  <p>₹{weaverChallan.transport_charge.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Grey Meters</p>
              <p className="text-2xl font-bold text-blue-600">{weaverChallan.total_grey_mtr}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Taka Count</p>
              <p className="text-2xl font-bold text-green-600">{weaverChallan.taka}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Batch Number</p>
              <p className="text-xl font-bold text-gray-900">{weaverChallan.batch_number}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Weaver Signature</h3>
              <div className="border-b border-gray-400 h-16 mb-2"></div>
              <p className="text-sm text-gray-600">Date: _______________</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Authorized Signature</h3>
              <div className="border-b border-gray-400 h-16 mb-2"></div>
              <p className="text-sm text-gray-600">Bhaktinandan</p>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t print-only">
          This is a computer generated document and does not require signature.
        </div>
      </div>
    </div>
  )
}