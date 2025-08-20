"use client"

import { Tables, Json } from '@/types/database'
import { formatDate } from '@/lib/utils'

type WeaverChallan = Tables<'weaver_challans'> & {
  ledgers: Tables<'ledgers'> | null;
  taka_details: Json | null;
};

type QualityDetail = {
  quality_name: string;
  rate: number;
};

function isQualityDetail(obj: unknown): obj is QualityDetail {
  const detail = obj as QualityDetail;
  return !!detail && typeof detail.quality_name === 'string' && typeof detail.rate === 'number';
}

export default function PrintChallanClient({ weaverChallan }: { weaverChallan: WeaverChallan }) {
  const parseTakaDetails = (takaDetails: Json | null) => {
    if (!takaDetails) return []
    try {
      return typeof takaDetails === 'string' ? JSON.parse(takaDetails) : takaDetails
    } catch {
      return []
    }
  }

  const takaDetails = parseTakaDetails(weaverChallan.taka_details)
  const qualityDetail = Array.isArray(weaverChallan.quality_details) && weaverChallan.quality_details.length > 0 && isQualityDetail(weaverChallan.quality_details[0])
    ? weaverChallan.quality_details[0]
    : null;

  const qualityName = qualityDetail ? qualityDetail.quality_name : 'N/A';
  const rate = qualityDetail ? qualityDetail.rate : 'N/A';

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
        {/* <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800"
        >
          ← Back
        </button> */}
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
            <h2 className="text-2xl font-semibold text-gray-700">WEAVER CHALLAN</h2>
            <p className="text-xs text-gray-500 mt-1">Challan No: <span className="font-medium text-gray-700">{weaverChallan.challan_no}</span></p>
            <p className="text-xs text-gray-500">Batch No: <span className="font-medium text-gray-700">{weaverChallan.batch_number}</span></p>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-8 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">TO</h3>
            <div className="text-sm">
              <p className="font-bold text-gray-800">{weaverChallan.ms_party_name}</p>
              {weaverChallan.ledgers && (
                <>
                  <p>{weaverChallan.ledgers.address}</p>
                  <p>
                    {[
                      weaverChallan.ledgers.city,
                      weaverChallan.ledgers.district,
                      weaverChallan.ledgers.state,
                    ].filter(Boolean).join(', ')}
                    {weaverChallan.ledgers.zip_code ? ` - ${weaverChallan.ledgers.zip_code}` : ''}
                  </p>
                  <p>M: {weaverChallan.ledgers.mobile_number}</p>
                  {weaverChallan.ledgers.email && <p>E: {weaverChallan.ledgers.email}</p>}
                  {weaverChallan.ledgers.gst_number && <p>GST: {weaverChallan.ledgers.gst_number}</p>}
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">DETAILS</h3>
            <p className="text-sm"><strong>Date:</strong> {formatDate(weaverChallan.challan_date)}</p>
            <p className="text-sm"><strong>Quality:</strong> {qualityName}</p>
            <p className="text-sm"><strong>Fold:</strong> {weaverChallan.fold_cm} cm</p>
            <p className="text-sm"><strong>Width:</strong> {weaverChallan.width_inch} inches</p>
          </div>
        </section>

        <section className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Taka Specifications</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left font-semibold text-gray-600">TAKA NO.</th>
                <th className="p-2 text-right font-semibold text-gray-600">METERS</th>
              </tr>
            </thead>
            <tbody>
              {takaDetails.map((taka: { taka_number: string; meters: number }, index: number) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{taka.taka_number}</td>
                  <td className="p-2 text-right">{taka.meters.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm">
              <p className="font-semibold text-gray-800">Total Grey:</p>
              <p className="font-bold text-xl text-gray-900">{rate} <span className="text-sm font-normal">Mtr</span></p>
            </div>
            <div className="text-sm text-right">
              <p className="font-semibold text-gray-800">Total Taka:</p>
              <p className="font-bold text-xl text-gray-900">{weaverChallan.taka}</p>
            </div>
          </div>
        </section>

        {(weaverChallan.transport_name || weaverChallan.lr_number || weaverChallan.transport_charge) && (
          <section className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Transport Details</h3>
            <div className="grid grid-cols-3 gap-4 text-sm p-4 bg-gray-50 rounded-lg">
              <div className="text-left">
                <p className="font-semibold">Transport:</p>
                <p>{weaverChallan.transport_name}</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">LR Number:</p>
                <p>{weaverChallan.lr_number}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">Charge:</p>
                <p>₹{weaverChallan.transport_charge?.toLocaleString()}</p>
              </div>
            </div>
          </section>
        )}

        <footer className="text-center mt-16 pt-4 text-xs text-gray-500">
          <p className="italic">* This is a system generated slip and does not require a signature.</p>
        </footer>
      </div>
    </div>
  )
}
