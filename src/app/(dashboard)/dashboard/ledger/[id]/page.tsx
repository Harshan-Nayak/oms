import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Building2, Phone, Mail, MapPin, FileText } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface LedgerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LedgerDetailPage({ params }: LedgerDetailPageProps) {
  // Await the params
  const { id } = await params
  
  const supabase = createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // Fetch ledger details
  const { data: ledger, error } = await supabase
    .from('ledgers')
    .select('*')
    .eq('ledger_id', id)
    .single()

  if (error || !ledger) {
    notFound()
  }

  const canEdit = profile.user_role === 'Admin' || profile.user_role === 'Manager'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/ledger/list">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ledgers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ledger Details</h1>
            <p className="text-gray-600 mt-1">
              View business partner information
            </p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/dashboard/ledger/${ledger.ledger_id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Ledger
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Business Logo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {ledger.business_logo ? (
                <Image
                  src={ledger.business_logo}
                  alt={ledger.business_name}
                  width={200}
                  height={200}
                  className="rounded-lg object-cover w-full h-full"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4" />
                  <p>No logo available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Primary business details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ledger ID</label>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {ledger.ledger_id}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Business Name</label>
                  <p className="text-lg font-semibold">{ledger.business_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Contact Person</label>
                  <p className="text-gray-900">{ledger.contact_person_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">GST Number</label>
                  <p className="font-mono text-sm">{ledger.gst_number || 'Not provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </CardTitle>
              <CardDescription>Communication details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mobile Number</label>
                    <p className="text-gray-900">{ledger.mobile_number || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{ledger.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Address Information
              </CardTitle>
              <CardDescription>Location and postal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="text-gray-900">{ledger.address || 'Not provided'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <p className="text-gray-900">{ledger.city || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">District</label>
                  <p className="text-gray-900">{ledger.district || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">State</label>
                  <p className="text-gray-900">{ledger.state || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <p className="text-gray-900">{ledger.country || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">ZIP Code</label>
                  <p className="text-gray-900">{ledger.zip_code || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Record Information
              </CardTitle>
              <CardDescription>Creation and modification details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{formatDate(ledger.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{formatDate(ledger.updated_at)}</p>
                </div>
              </div>
              {ledger.edit_logs && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Edit History</label>
                  <p className="text-sm text-gray-600 mt-1">{ledger.edit_logs}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
