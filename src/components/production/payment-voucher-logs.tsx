'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  IndianRupee, 
  User, 
  FileText,
  ArrowLeft
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'

type PaymentVoucher = Database['public']['Tables']['payment_vouchers']['Row'] & {
  ledgers?: {
    business_name: string;
  } | null;
};

type ChangeValue = {
  old: unknown;
  new: unknown;
};

type Log = Database['public']['Tables']['payment_voucher_logs']['Row'] & {
  changer?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  changes: Record<string, ChangeValue> | null;
};

interface PaymentVoucherLogsProps {
  paymentVoucher: PaymentVoucher
  logs: Log[]
}

export function PaymentVoucherLogs({ 
  paymentVoucher, 
  logs 
}: PaymentVoucherLogsProps) {
  const router = useRouter()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Logs</h1>
          <p className="text-gray-600 mt-1">
            History of changes for payment voucher
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Details
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Voucher Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Payment Voucher</CardTitle>
              <CardDescription>
                Voucher details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Business</div>
                <div className="font-medium mt-1">
                  {paymentVoucher.ledgers?.business_name || 'N/A'}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Date</div>
                <div className="flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{new Date(paymentVoucher.date).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Amount</div>
                <div className="flex items-center mt-1">
                  <IndianRupee className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{paymentVoucher.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Payment For</div>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  {paymentVoucher.payment_for}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Change History</CardTitle>
              <CardDescription>
                {logs.length} change {logs.length === 1 ? 'record' : 'records'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length > 0 ? (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {log.changer?.first_name} {log.changer?.last_name || 'System'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(log.changed_at)}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          ID: {log.id}
                        </Badge>
                      </div>
                      
                      {log.changes && typeof log.changes === 'object' && Object.keys(log.changes).length > 0 ? (
                        <div className="mt-4 pl-11">
                          <div className="text-sm font-medium mb-2">Changes:</div>
                          <div className="space-y-2">
                            {Object.entries(log.changes).map(([field, values]) => (
                              <div key={field} className="flex items-start">
                                <div className="w-32 text-sm text-gray-500">{field}</div>
                                <div className="flex-1">
                                  <div className="flex items-center text-sm">
                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded mr-2">
                                      {values && typeof values.old === 'object' ? JSON.stringify(values.old) : String((values?.old || 'N/A'))}
                                    </span>
                                    <span className="mx-2">→</span>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {values && typeof values.new === 'object' ? JSON.stringify(values.new) : String(values?.new || 'N/A')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 pl-11 text-sm text-gray-500">
                          No changes recorded
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-500">No change logs found</div>
                  <div className="text-sm text-gray-400 mt-1">
                    Changes to this payment voucher will appear here
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}