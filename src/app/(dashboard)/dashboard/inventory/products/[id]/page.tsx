import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit, Package } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
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

  // Fetch product details
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) {
    notFound()
  }

  const canEdit = profile.user_role === 'Admin' || profile.user_role === 'Manager'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/inventory/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
            <p className="text-gray-600 mt-1">
              View product information and specifications
            </p>
          </div>
        </div>
        {canEdit && (
          <Link href={`/dashboard/inventory/products/${product.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Product
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Product Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              {product.product_image ? (
                <Image
                  src={product.product_image}
                  alt={product.product_name}
                  width={300}
                  height={300}
                  className="rounded-lg object-cover w-full h-full"
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4" />
                  <p>No image available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Product details and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Product Name</label>
                  <p className="text-lg font-semibold">{product.product_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">SKU</label>
                  <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                    {product.product_sku}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {product.product_status === 'Active' ? (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-700">Inactive</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Quantity</label>
                  <p className="text-lg">{product.product_qty || 0} units</p>
                </div>
              </div>
              
              {product.product_description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-600 mt-1">{product.product_description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
              <CardDescription>Product specifications and attributes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="text-gray-900">{product.product_category || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Sub-Category</label>
                  <p className="text-gray-900">{product.product_sub_category || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <p className="text-gray-900">{product.product_size || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Color</label>
                  <p className="text-gray-900">{product.product_color || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Material</label>
                  <p className="text-gray-900">{product.product_material || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Brand</label>
                  <p className="text-gray-900">{product.product_brand}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <p className="text-gray-900">{product.product_country}</p>
                </div>
              </div>
              
              {product.wash_care && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-700">Wash Care Instructions</label>
                  <p className="text-gray-600 mt-1">{product.wash_care}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Product creation and modification details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Created At</label>
                  <p className="text-gray-900">{formatDate(product.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="text-gray-900">{formatDate(product.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
