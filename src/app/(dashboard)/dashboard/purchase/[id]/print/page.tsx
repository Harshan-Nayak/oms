import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface PrintPurchaseOrderPageProps {
  params: {
    id: string
  }
}

export default async function PrintPurchaseOrderPage({ params }: PrintPurchaseOrderPageProps) {
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch purchase order details with ledger info
  const { data: purchaseOrder, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      ledgers (
        business_name,
        contact_person_name,
        mobile_number,
        email,
        address,
        city,
        state,
        gst_number
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !purchaseOrder) {
    notFound()
  }

  const parseItems = (items: any) => {
    if (!items) return []
    try {
      return typeof items === 'string' ? JSON.parse(items) : items
    } catch {
      return []
    }
  }

  const items = parseItems(purchaseOrder.items)

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
          Print PO
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-900 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PURCHASE ORDER</h1>
              <div className="mt-2">
                <p className="text-lg font-semibold">Bhaktinandan</p>
                <p className="text-sm text-gray-600">Textile Manufacturing</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{purchaseOrder.po_number}</div>
              <div className="text-sm text-gray-600 mt-1">
                Date: {formatDate(purchaseOrder.po_date)}
              </div>
              {purchaseOrder.delivery_date && (
                <div className="text-sm text-gray-600">
                  Delivery: {formatDate(purchaseOrder.delivery_date)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Supplier Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Supplier Information</h2>
            <div className="space-y-1">
              <p className="font-semibold">{purchaseOrder.supplier_name}</p>
              {purchaseOrder.ledgers && (
                <>
                  {purchaseOrder.ledgers.business_name && (
                    <p>{purchaseOrder.ledgers.business_name}</p>
                  )}
                  {purchaseOrder.ledgers.contact_person_name && (
                    <p>Contact: {purchaseOrder.ledgers.contact_person_name}</p>
                  )}
                  {purchaseOrder.ledgers.mobile_number && (
                    <p>Mobile: {purchaseOrder.ledgers.mobile_number}</p>
                  )}
                  {purchaseOrder.ledgers.email && (
                    <p>Email: {purchaseOrder.ledgers.email}</p>
                  )}
                  {purchaseOrder.ledgers.address && (
                    <p>{purchaseOrder.ledgers.address}</p>
                  )}
                  {(purchaseOrder.ledgers.city || purchaseOrder.ledgers.state) && (
                    <p>{purchaseOrder.ledgers.city}, {purchaseOrder.ledgers.state}</p>
                  )}
                  {purchaseOrder.ledgers.gst_number && (
                    <p>GST: {purchaseOrder.ledgers.gst_number}</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 text-gray-900">Order Details</h2>
            <div className="space-y-1">
              <p><span className="font-medium">Status:</span> {purchaseOrder.status}</p>
              <p><span className="font-medium">Total Amount:</span> ₹{purchaseOrder.total_amount.toLocaleString()}</p>
              <p><span className="font-medium">Created:</span> {formatDate(purchaseOrder.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Items</h2>
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">#</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Item Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{item.item_name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-sm">{item.description || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">₹{item.unit_price.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right font-semibold">₹{item.total_price.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={5} className="border border-gray-300 px-4 py-3 text-right font-bold">
                  Grand Total:
                </td>
                <td className="border border-gray-300 px-4 py-3 text-right font-bold text-lg">
                  ₹{purchaseOrder.total_amount.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Additional Information */}
        {(purchaseOrder.description || purchaseOrder.terms_conditions) && (
          <div className="mb-8">
            {purchaseOrder.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Description:</h3>
                <p className="text-sm text-gray-700">{purchaseOrder.description}</p>
              </div>
            )}
            {purchaseOrder.terms_conditions && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Terms & Conditions:</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{purchaseOrder.terms_conditions}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="border-t pt-6 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Supplier Signature</h3>
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
