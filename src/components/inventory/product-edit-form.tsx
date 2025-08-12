'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Package } from 'lucide-react'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_sku: z.string().min(1, 'SKU is required'),
  product_category: z.string().min(1, 'Category is required'),
  product_sub_category: z.string().optional(),
  product_size: z.string().optional(),
  product_color: z.string().optional(),
  product_description: z.string().optional(),
  product_material: z.string().optional(),
  product_brand: z.string(),
  product_country: z.string(),
  product_status: z.enum(['Active', 'Inactive']),
  product_qty: z.number().min(0),
  wash_care: z.string().optional(),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductEditFormProps {
  product: Product
  userId: string
}

export function ProductEditForm({ product, userId }: ProductEditFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: product.product_name,
      product_sku: product.product_sku,
      product_category: product.product_category,
      product_sub_category: product.product_sub_category || '',
      product_size: product.product_size || '',
      product_color: product.product_color || '',
      product_description: product.product_description || '',
      product_material: product.product_material || '',
      product_brand: product.product_brand || 'Bhaktinandan',
      product_country: product.product_country || 'India',
      product_status: product.product_status as 'Active' | 'Inactive',
      product_qty: product.product_qty || 0,
      wash_care: product.wash_care || '',
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError('')

    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)

      if (updateError) {
        setError('Failed to update product. Please try again.')
        return
      }

      router.push(`/dashboard/inventory/products/${product.id}`)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Error updating product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Basic Information
          </CardTitle>
          <CardDescription>Update basic product details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                {...register('product_name')}
                placeholder="Enter product name"
              />
              {errors.product_name && (
                <p className="text-sm text-red-600">{errors.product_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sku">Product SKU *</Label>
              <Input
                id="product_sku"
                {...register('product_sku')}
                placeholder="Enter product SKU"
              />
              {errors.product_sku && (
                <p className="text-sm text-red-600">{errors.product_sku.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_category">Category *</Label>
              <Input
                id="product_category"
                {...register('product_category')}
                placeholder="Enter product category"
              />
              {errors.product_category && (
                <p className="text-sm text-red-600">{errors.product_category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sub_category">Sub-Category</Label>
              <Input
                id="product_sub_category"
                {...register('product_sub_category')}
                placeholder="Enter sub-category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_size">Size</Label>
              <Input
                id="product_size"
                {...register('product_size')}
                placeholder="Enter product size"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_color">Color</Label>
              <Input
                id="product_color"
                {...register('product_color')}
                placeholder="Enter product color"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_material">Material</Label>
              <Input
                id="product_material"
                {...register('product_material')}
                placeholder="Enter product material"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_qty">Quantity</Label>
              <Input
                id="product_qty"
                type="number"
                {...register('product_qty', { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.product_qty && (
                <p className="text-sm text-red-600">{errors.product_qty.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_description">Description</Label>
            <Textarea
              id="product_description"
              {...register('product_description')}
              placeholder="Enter product description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Brand, country, and care information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_brand">Brand</Label>
              <Input
                id="product_brand"
                {...register('product_brand')}
                placeholder="Brand name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_country">Country</Label>
              <Input
                id="product_country"
                {...register('product_country')}
                placeholder="Country of origin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_status">Status</Label>
              <Select 
                value={watch('product_status')} 
                onValueChange={(value) => setValue('product_status', value as 'Active' | 'Inactive')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wash_care">Wash Care Instructions</Label>
            <Textarea
              id="wash_care"
              {...register('wash_care')}
              placeholder="Enter wash care instructions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating Product...
            </>
          ) : (
            'Update Product'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/dashboard/inventory/products/${product.id}`)}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
