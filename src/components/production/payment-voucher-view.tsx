'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  IndianRupee, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  CreditCard,
  Edit,
  History
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'
import Image from 'next/image'

type PaymentVoucher = Database['public']['Tables']['payment_vouchers']['Row'] & {
  ledgers?: {
    business_name: string;
    business_logo: string | null;
    contact_person_name: string | null;
    mobile_number: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    zip_code: string | null;
    gst_number: string | null;
  } | null;
  creator?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface PaymentVoucherViewProps {
  paymentVoucher: PaymentVoucher
  userRole: UserRole
  userId: string
}

export function PaymentVoucherView({ 
  paymentVoucher, 
  userRole, 
  userId 
}: PaymentVoucherViewProps) {
  const router = useRouter()
  const canEdit = userRole === 'Admin' || userRole === 'Manager'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Voucher</h1>
          <p className="text-gray-600 mt-1">
            Payment voucher details
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/production/payment-voucher')}
          >
            Back to List
          </Button>
          {canEdit && (
            <Button onClick={() => router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Payment voucher information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="flex items-center mt-1">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{new Date(paymentVoucher.date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Payment Type</div>
                  <div className="mt-1">
                    <Badge 
                      className={
                        paymentVoucher.payment_type === 'Credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {paymentVoucher.payment_type}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Amount</div>
                  <div className="flex items-center mt-1 text-lg font-semibold">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {paymentVoucher.amount.toFixed(2)}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500">Created At</div>
                  <div className="mt-1">
                    {formatDate(paymentVoucher.created_at)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Payment For</div>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  {paymentVoucher.payment_for}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ledger Details */}
          <Card>
            <CardHeader>
              <CardTitle>Ledger Information</CardTitle>
              <CardDescription>
                Business partner details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentVoucher.ledgers ? (
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg mr-4 flex items-center justify-center">
                      {paymentVoucher.ledgers.business_logo ? (
                        <Image
                          src={paymentVoucher.ledgers.business_logo}
                          alt={paymentVoucher.ledgers.business_name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {paymentVoucher.ledgers.business_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{paymentVoucher.ledgers.business_name}</div>
                      {paymentVoucher.ledgers.contact_person_name && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <User className="h-4 w-4 mr-1" />
                          {paymentVoucher.ledgers.contact_person_name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {paymentVoucher.ledgers.mobile_number && (
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {paymentVoucher.ledgers.mobile_number}
                        </div>
                      </div>
                    )}
                    
                    {paymentVoucher.ledgers.email && (
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {paymentVoucher.ledgers.email}
                        </div>
                      </div>
                    )}
                    
                    {(paymentVoucher.ledgers.address || paymentVoucher.ledgers.city || paymentVoucher.ledgers.state) && (
                      <div>
                        <div className="text-sm text-gray-500">Address</div>
                        <div className="flex items-start mt-1">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                          <div>
                            {paymentVoucher.ledgers.address ?
                              <div>{paymentVoucher.ledgers.address}</div>
                            : null}
                            <div>
                              {[paymentVoucher.ledgers.city, paymentVoucher.ledgers.state, paymentVoucher.ledgers.zip_code]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                            {paymentVoucher.ledgers.country && (
                              <div>{paymentVoucher.ledgers.country}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {paymentVoucher.ledgers.gst_number && (
                      <div>
                        <div className="text-sm text-gray-500">GST Number</div>
                        <div className="flex items-center mt-1">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          {paymentVoucher.ledgers.gst_number}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No ledger information available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Creator Info */}
          <Card>
            <CardHeader>
              <CardTitle>Created By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {paymentVoucher.creator?.first_name} {paymentVoucher.creator?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">Creator</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => router.push(`/dashboard/production/payment-voucher/${paymentVoucher.id}/logs`)}
              >
                <History className="h-4 w-4 mr-2" />
                View Change Logs
              </Button>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Type</span>
                <span className="font-medium">{paymentVoucher.payment_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount</span>
                <span className="font-medium flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {paymentVoucher.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">
                  {new Date(paymentVoucher.date).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}