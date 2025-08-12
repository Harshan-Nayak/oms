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
import { Loader2, Upload, X } from 'lucide-react'
import { Database } from '@/types/database'
import Image from 'next/image'

type Product = Database['public']['Tables']['products']['Insert']

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

interface ProductFormProps {
  userId: string
  product?: Database['public']['Tables']['products']['Row']
  isEdit?: boolean
}

export function ProductForm({ userId, product, isEdit = false }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.product_image || null
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: product?.product_name || '',
      product_sku: product?.product_sku || '',
      product_category: product?.product_category || '',
      product_sub_category: product?.product_sub_category || '',
      product_size: product?.product_size || '',
      product_color: product?.product_color || '',
      product_description: product?.product_description || '',
      product_material: product?.product_material || '',
      product_brand: product?.product_brand || 'Bhaktinandan',
      product_country: product?.product_country || 'India',
      product_status: (product?.product_status as 'Active' | 'Inactive') || 'Active',
      product_qty: product?.product_qty || 0,
      wash_care: product?.wash_care || '',
    },
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setError('Please select a valid image file')
      }
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true)
    setError('')

    try {
      let imageUrl = product?.product_image || null

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setError('Failed to upload image. Please try again.')
          setLoading(false)
          return
        }
      }

      const productData: Product = {
        ...data,
        product_image: imageUrl,
        created_by: userId,
      }

      if (isEdit && product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (updateError) {
          setError('Failed to update product. Please try again.')
          return
        }
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData])

        if (insertError) {
          setError('Failed to create product. Please try again.')
          return
        }
      }

      router.push('/dashboard/inventory/products')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Error saving product:', err)
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

      {/* Product Image */}
      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
          <CardDescription>Upload a high-quality product image</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg">
                <Image
                  src={imagePreview}
                  alt="Product preview"
                  fill
                  className="object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">
                      Upload an image
                    </span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">PNG, JPG up to 1MB</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Enter the basic product details</CardDescription>
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
              <Label htmlFor="product_sku">SKU *</Label>
              <Input
                id="product_sku"
                {...register('product_sku')}
                placeholder="Enter product SKU"
              />
              {errors.product_sku && (
                <p className="text-sm text-red-600">{errors.product_sku.message}</p>
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

      {/* Categories and Attributes */}
      <Card>
        <CardHeader>
          <CardTitle>Categories and Attributes</CardTitle>
          <CardDescription>Categorize and define product attributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_category">Category *</Label>
              <Input
                id="product_category"
                {...register('product_category')}
                placeholder="e.g. Saree, Dupatta"
              />
              {errors.product_category && (
                <p className="text-sm text-red-600">{errors.product_category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_sub_category">Sub Category</Label>
              <Input
                id="product_sub_category"
                {...register('product_sub_category')}
                placeholder="e.g. Cotton Saree"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_color">Color</Label>
              <Input
                id="product_color"
                {...register('product_color')}
                placeholder="e.g. Red, Blue"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_size">Size</Label>
              <Input
                id="product_size"
                {...register('product_size')}
                placeholder="e.g. Free Size, M, L"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_material">Material</Label>
              <Input
                id="product_material"
                {...register('product_material')}
                placeholder="e.g. Cotton, Silk"
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
          <CardDescription>Brand, origin, and care instructions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_brand">Brand</Label>
              <Input
                id="product_brand"
                {...register('product_brand')}
                placeholder="Bhaktinandan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_country">Country</Label>
              <Input
                id="product_country"
                {...register('product_country')}
                placeholder="India"
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
              placeholder="Enter care instructions"
              rows={2}
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
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update Product' : 'Create Product'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/inventory/products')}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
