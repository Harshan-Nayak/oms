import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Edit,
  Factory,
  Printer,
  Building2,
  Calendar,
  Package,
  Truck 
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tables, Json } from '@/types/supabase'

type WeaverChallan = Tables<'weaver_challans'> & {
  ledgers: Tables<'ledgers'> | null
};

type QualityDetail = {
  rate: number;
  quality_name: string;
};

interface WeaverChallanDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function WeaverChallanDetailPage({ params }: WeaverChallanDetailPageProps) {
  const supabase = createServerSupabaseClient()
  
  // Await the params
  const resolvedParams = await params
  
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

  // Fetch weaver challan details with ledger info - use resolvedParams.id
  const { data: weaverChallan, error } = await supabase
    .from('weaver_challans')
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
    .eq('id', resolvedParams.id)
    .single()

  if (error || !weaverChallan) {
    notFound()
  }

  const canEdit = profile.user_role === 'Admin' || profile.user_role === 'Manager'

  const parseQualityDetails = (qualityDetails: Json | null): QualityDetail[] => {
    if (!qualityDetails) return []
    try {
      const parsed = typeof qualityDetails === 'string' ? JSON.parse(qualityDetails) : qualityDetails;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return []
    }
  }

  const qualityDetails = parseQualityDetails(weaverChallan.quality_details);

  const parseTakaDetails = (takaDetails: Json | null) => {
    if (!takaDetails) return []
    try {
      return typeof takaDetails === 'string' ? JSON.parse(takaDetails) : takaDetails
    } catch {
      return []
    }
  }

  const takaDetails = parseTakaDetails(weaverChallan.taka_details)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/production/weaver-challan">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challans
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Weaver Challan Details</h1>
            <p className="text-gray-600 mt-1">
              View production challan information and quality details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* <Link href={`/print/weaver-challan/${weaverChallan.id}`} target="_blank">
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Challan
            </Button>
          </Link> */}
          {canEdit && (
            <Link href={`/dashboard/production/weaver-challan/${weaverChallan.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Challan
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Challan Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Factory className="h-5 w-5 mr-2" />
              Challan Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Challan Number</label>
              <p className="font-mono text-lg font-semibold">{weaverChallan.challan_no}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Batch Number</label>
              <p className="font-mono text-lg font-semibold text-blue-600">{weaverChallan.batch_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Challan Date</label>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                {formatDate(weaverChallan.challan_date)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Rate Per Meter</label>
              <p className="text-2xl font-bold text-green-600">
                ₹{weaverChallan.total_grey_mtr} 
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Taka Count</label>
              <p className="text-xl font-semibold">{weaverChallan.taka} taka</p>
            </div>
          </CardContent>
        </Card>

        {/* Party Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Party Information
              </CardTitle>
              <CardDescription>Weaver party details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* <div>
                <label className="text-sm font-medium text-gray-700">MS Party Name</label>
                <p className="text-lg font-semibold">{weaverChallan.ms_party_name}</p>
              </div> */}
              
              {weaverChallan.ledgers && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-gray-900">{weaverChallan.ledgers.business_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Contact Person</label>
                    <p className="text-gray-900">{weaverChallan.ledgers.contact_person_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Mobile</label>
                    <p className="text-gray-900">{weaverChallan.ledgers.mobile_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{weaverChallan.ledgers.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">GST Number</label>
                    <p className="font-mono text-sm">{weaverChallan.ledgers.gst_number || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">
                      {weaverChallan.ledgers.address ?
                        `${weaverChallan.ledgers.address}, ${weaverChallan.ledgers.city}, ${weaverChallan.ledgers.state}` :
                        'Not provided'
                      }
                    </p>
                  </div>
                </div>
              )}

              {weaverChallan.delivery_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Delivery Location</label>
                  <p className="text-gray-900">{weaverChallan.delivery_at}</p>
                </div>
              )}

              {weaverChallan.bill_no && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Bill Number</label>
                  <p className="font-mono text-sm">{weaverChallan.bill_no}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Production Specifications
              </CardTitle>
              <CardDescription>Technical details and measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Rate per mtr</label>
                  <p className="text-lg font-semibold">₹ {weaverChallan.total_grey_mtr} </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Fold (CM)</label>
                  <p className="text-lg">{weaverChallan.fold_cm || 'Not specified'} cm</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Width (Inches)</label>
                  <p className="text-lg">{weaverChallan.width_inch || 'Not specified'} inches</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Taka Count</label>
                  <p className="text-lg font-semibold">{weaverChallan.taka} taka</p>
                </div>
                {qualityDetails.length > 0 && qualityDetails[0] && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quantity (Mtr)</label>

                      <p className="text-lg font-semibold">{qualityDetails[0].rate}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Quality Name</label>
                      <p className="text-lg font-semibold">{qualityDetails[0].quality_name}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

         {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Record Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{formatDate(weaverChallan.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{formatDate(weaverChallan.updated_at)}</p>
                </div>
              </div>
              {weaverChallan.edit_logs && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Edit History</label>
                  <p className="text-sm text-gray-600 mt-1">{weaverChallan.edit_logs}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transport Details */}
          {(weaverChallan.transport_name || weaverChallan.lr_number || weaverChallan.transport_charge) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="h-5 w-5 mr-2" />
                  Transport Details
                </CardTitle>
                <CardDescription>Logistics and transport information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weaverChallan.transport_name && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Transport Company</label>
                      <p className="text-gray-900">{weaverChallan.transport_name}</p>
                    </div>
                  )}
                  {weaverChallan.lr_number && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">LR Number</label>
                      <p className="font-mono text-sm">{weaverChallan.lr_number}</p>
                    </div>
                  )}
                  {weaverChallan.transport_charge && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Transport Charge</label>
                      <p className="text-lg font-semibold">₹{weaverChallan.transport_charge.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

         

  {/* Taka Details */}
          {takaDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Taka Details</CardTitle>
                <CardDescription>Breakdown of each taka</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>Taka Number</TableHead>
                      <TableHead>Meters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {takaDetails.map((taka: { taka_number: string; meters: number }, index: number) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{taka.taka_number}</TableCell>
                        <TableCell>{taka.meters}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  )
}
