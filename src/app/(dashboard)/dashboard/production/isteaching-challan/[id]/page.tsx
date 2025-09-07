import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Edit,
  Factory,
  Calendar,
  Package,
  Building2
} from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Tables, Json } from '@/types/supabase'
import Image from 'next/image'

type IsteachingChallan = Tables<'isteaching_challans'> & {
  ledgers: Tables<'ledgers'> | null
};

interface IsteachingChallanDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function IsteachingChallanDetailPage({ params }: IsteachingChallanDetailPageProps) {
  const supabase = createServerSupabaseClient()
  
  const resolvedParams = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const { data: isteachingChallan, error } = await supabase
    .from('isteaching_challans')
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

  if (error || !isteachingChallan) {
    notFound()
  }

  const canEdit = profile.user_role === 'Admin' || profile.user_role === 'Manager'

  const parseSizeDetails = (sizeDetails: Json | null): { size: string, quantity: number }[] => {
    if (!sizeDetails) return []
    try {
      const parsed = typeof sizeDetails === 'string' ? JSON.parse(sizeDetails) : sizeDetails;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return []
    }
  }

  const sizeDetails = parseSizeDetails(isteachingChallan.product_size);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/production/isteaching-challan">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Challans
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stitching  Challan Details</h1>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Link href={`/dashboard/production/isteaching-challan/${isteachingChallan.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Challan
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Factory className="h-5 w-5 mr-2" />
              Challan Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Batch Number</label>
              <p className="font-mono text-lg font-semibold text-blue-600">{isteachingChallan.batch_number}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Stitching Number</label>
              <p className="font-mono text-lg font-semibold text-blue-600">{isteachingChallan.challan_no}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Challan Date</label>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-40" />
                {new Date(isteachingChallan.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quality</label>
              <p className="text-xl font-semibold">{isteachingChallan.quality}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Quantity</label>
              <p className="text-2xl font-bold text-green-600">
                {isteachingChallan.quantity}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Party Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isteachingChallan.ledgers && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Business Name</label>
                    <p className="text-gray-900">{isteachingChallan.ledgers.business_name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Cloth Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Cloth Type</label>
                <p className="text-gray-900">{isteachingChallan.cloth_type?.join(', ') || 'N/A'}</p>
              </div>
              {isteachingChallan.cloth_type?.includes('TOP') && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Top Qty (mtr)</label>
                    <p className="text-gray-900">{isteachingChallan.top_qty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">1pcs Qty (mtr)</label>
                    <p className="text-gray-900">{isteachingChallan.top_pcs_qty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Top Pcs Created</label>
                    <p className="text-lg font-semibold">
                      {isteachingChallan.top_qty && isteachingChallan.top_pcs_qty
                        ? Math.floor(isteachingChallan.top_qty / isteachingChallan.top_pcs_qty)
                        : 0}
                    </p>
                  </div>
                </>
              )}
              {isteachingChallan.cloth_type?.includes('BOTTOM') && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bottom Qty (mtr)</label>
                    <p className="text-gray-900">{isteachingChallan.bottom_qty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">1pcs Qty (mtr)</label>
                    <p className="text-gray-900">{isteachingChallan.bottom_pcs_qty || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bottom Pcs Created</label>
                    <p className="text-lg font-semibold">
                      {isteachingChallan.bottom_qty && isteachingChallan.bottom_pcs_qty
                        ? Math.floor(isteachingChallan.bottom_qty / isteachingChallan.bottom_pcs_qty)
                        : 0}
                    </p>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Total Product QTY</label>
                <p className="text-lg font-semibold">
                  {(isteachingChallan.top_qty && isteachingChallan.top_pcs_qty
                    ? Math.floor(isteachingChallan.top_qty / isteachingChallan.top_pcs_qty)
                    : 0) +
                    (isteachingChallan.bottom_qty && isteachingChallan.bottom_pcs_qty
                      ? Math.floor(isteachingChallan.bottom_qty / isteachingChallan.bottom_pcs_qty)
                      : 0)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isteachingChallan.product_image && (
                <div className="col-span-full">
                  <label className="text-sm font-medium text-gray-700">Product Image</label>
                  <div className="mt-2">
                    <Image src={isteachingChallan.product_image} alt="Product Image" width={200} height={200} className="rounded-lg" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700">Product Name</label>
                <p className="text-gray-900">{isteachingChallan.product_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Product SKU</label>
                <p className="text-gray-900">{isteachingChallan.product_sku || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Product Quantity</label>
                <p className="text-gray-900">{isteachingChallan.product_qty || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Product Color</label>
                <p className="text-gray-900">{isteachingChallan.product_color || 'N/A'}</p>
              </div>
              <div className="col-span-full">
                <label className="text-sm font-medium text-gray-700">Product Description</label>
                <p className="text-gray-900">{isteachingChallan.product_description || 'N/A'}</p>
              </div>
              {sizeDetails.length > 0 && (
                <div className="col-span-full">
                  <label className="text-sm font-medium text-gray-700">Product Sizes</label>
                  <ul>
                    {sizeDetails.map((s, i) => <li key={i}>{s.size}: {s.quantity}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {(isteachingChallan.transport_name || isteachingChallan.lr_number || isteachingChallan.transport_charge) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Factory className="h-5 w-5 mr-2" />
                  Transport Details
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isteachingChallan.transport_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transport Name</label>
                    <p className="text-gray-900">{isteachingChallan.transport_name}</p>
                  </div>
                )}
                {isteachingChallan.lr_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">LR Number</label>
                    <p className="text-gray-900">{isteachingChallan.lr_number}</p>
                  </div>
                )}
                {isteachingChallan.transport_charge && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transport Charge</label>
                    <p className="text-gray-900">₹{isteachingChallan.transport_charge.toFixed(2)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
