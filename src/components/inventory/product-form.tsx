'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Upload, X, Plus, Trash2 } from 'lucide-react'
import { Database } from '@/types/database'
import Image from 'next/image'
import { useToast } from '@/hooks/use-toast'

type Product = Database['public']['Tables']['products']['Insert']

const sizeSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
})

const productSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  product_sku: z.string().min(1, 'SKU is required'),
  product_category: z.string().min(1, 'Category is required'),
  product_sub_category: z.string().optional(),
  product_size: z.array(sizeSchema).optional(),
  product_color: z.string().optional(),
  product_description: z.string().optional(),
  product_material: z.string().optional(),
  product_brand: z.string(),
  product_country: z.string(),
  product_status: z.enum(['Active', 'Inactive', 'Pipeline']),
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
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(
    product?.product_image || null
  )
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_name: product?.product_name || '',
      product_sku: product?.product_sku || '',
      product_category: product?.product_category || '',
      product_sub_category: product?.product_sub_category || '',
      product_size: product?.product_size 
        ? (typeof product.product_size === 'string' 
            ? JSON.parse(product.product_size) 
            : product.product_size)
        : [{ size: 'S', quantity: 0 }],
      product_color: product?.product_color || '',
      product_description: product?.product_description || '',
      product_material: product?.product_material || '',
      product_brand: product?.product_brand || 'Bhaktinandan',
      product_country: product?.product_country || 'India',
      product_status: (product?.product_status as 'Active' | 'Inactive' | 'Pipeline') || 'Active',
      product_qty: product?.product_qty || 0,
      wash_care: product?.wash_care || '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'product_size',
  })

  const productQty = watch('product_qty')
  const productSizes = watch('product_size')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please select a JPG, JPEG, or PNG image.')
        setIsAlertOpen(true)
        return
      }

      const maxSizeInMB = 3
      if (file.size > maxSizeInMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeInMB}MB. Please choose a smaller file.`)
        setIsAlertOpen(true)
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError('') // Clear any previous errors
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

    // Validate size quantities don't exceed product quantity
    const totalSizeQty = data.product_size?.reduce((sum, s) => sum + s.quantity, 0) || 0
    if (data.product_qty && totalSizeQty > data.product_qty) {
      setError('Sum of size quantities cannot exceed Product Qty.')
      setIsAlertOpen(true)
      setLoading(false)
      return
    }

    try {
      let imageUrl = product?.product_image || null

      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile)
        if (!imageUrl) {
          setError('Failed to upload image. Please try again.')
          setIsAlertOpen(true)
          setLoading(false)
          return
        }
      }

      const productData: Product = {
        ...data,
        product_image: imageUrl,
        product_size: data.product_size ? JSON.stringify(data.product_size) : null,
        created_by: userId,
      }

      if (isEdit && product) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)

        if (updateError) {
          setError('Failed to update product. Please try again.')
          showToast('Failed to update product', 'error')
          return
        }
        showToast('Product updated successfully', 'success')
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert([productData])

        if (insertError) {
          setError('Failed to create product. Please try again.')
          showToast('Failed to create product', 'error')
          return
        }
        showToast('Product created successfully', 'success')
      }

      router.push('/dashboard/inventory/products')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      showToast('An unexpected error occurred', 'error')
      console.error('Error saving product:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Error</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setIsAlertOpen(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Product Details - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Enter comprehensive product information</CardDescription>
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
              <Label htmlFor="product_description">Product Description</Label>
              <Textarea
                id="product_description"
                {...register('product_description')}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              {imagePreview ? (
                <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg">
                  <Image
                    src={imagePreview}
                    alt="Product preview"
                    fill
                    className="object-cover rounded-lg"
                    unoptimized
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center w-32 h-32 flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500 text-sm">
                      Upload
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
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_qty">Product Qty *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="product_color">Product Color</Label>
              <Input
                id="product_color"
                {...register('product_color')}
                placeholder="e.g. Red, Blue"
              />
            </div>

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
              <Label htmlFor="product_material">Material</Label>
              <Input
                id="product_material"
                {...register('product_material')}
                placeholder="e.g. Cotton, Silk"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_status">Status</Label>
              <Select
                value={watch('product_status')}
                onValueChange={(value) => setValue('product_status', value as 'Active' | 'Inactive' | 'Pipeline')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {productQty === 0 ? (
                    <>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pipeline">Pipeline</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Pipeline">Pipeline</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_brand">Brand</Label>
              <Input
                id="product_brand"
                {...register('product_brand')}
                placeholder="Bhaktinandan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_country">Made In</Label>
              <Input
                id="product_country"
                {...register('product_country')}
                placeholder="India"
              />
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
          </div>
        </CardContent>
      </Card>

      {/* Product Size */}
      <Card>
        <CardHeader>
          <CardTitle>Product Size</CardTitle>
          <CardDescription>Define different sizes and their quantities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-4">
              <Select
                onValueChange={(value) => setValue(`product_size.${index}.size`, value)}
                defaultValue={field.size}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                {...register(`product_size.${index}.quantity`, { valueAsNumber: true })}
                placeholder="Quantity"
              />
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => append({ size: 'M', quantity: 0 })}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Size
          </Button>
          {productQty && productSizes && productSizes.reduce((sum, s) => sum + s.quantity, 0) > productQty && (
            <p className="text-sm text-red-600">Total size quantity exceeds product quantity.</p>
          )}
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
