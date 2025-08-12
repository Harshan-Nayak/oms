'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

type Product = Database['public']['Tables']['products']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface ProductsContentProps {
  products: Product[]
  totalCount: number
  filterOptions: {
    categories: string[]
    colors: string[]
    materials: string[]
    statuses: string[]
  }
  userRole: UserRole
}

export function ProductsContent({ products, totalCount, filterOptions, userRole }: ProductsContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager'

  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedCategory || product.product_category === selectedCategory
    const matchesColor = !selectedColor || product.product_color === selectedColor
    const matchesMaterial = !selectedMaterial || product.product_material === selectedMaterial
    const matchesStatus = !selectedStatus || product.product_status === selectedStatus

    return matchesSearch && matchesCategory && matchesColor && matchesMaterial && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return status === 'Active' ? (
      <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-700">Inactive</Badge>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedColor('')
    setSelectedMaterial('')
    setSelectedStatus('')
  }

  const handleDeleteProduct = async (productId: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(productId)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        alert('Failed to delete product. Please try again.')
        return
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory ({totalCount} total products)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => router.push('/dashboard/inventory/products/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter products by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedColor} onValueChange={setSelectedColor}>
              <SelectTrigger>
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger>
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.materials.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || selectedCategory || selectedColor || selectedMaterial || selectedStatus) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {filteredProducts.length} of {totalCount} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      {product.product_image ? (
                        <Image
                          src={product.product_image}
                          alt={product.product_name}
                          width={40}
                          height={40}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">No img</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-sm text-gray-500">{product.product_description}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{product.product_sku}</TableCell>
                  <TableCell>{product.product_category}</TableCell>
                  <TableCell>{product.product_color}</TableCell>
                  <TableCell>{product.product_material}</TableCell>
                  <TableCell>{getStatusBadge(product.product_status)}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(product.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/inventory/products/${product.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/inventory/products/${product.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteProduct(product.id, product.product_name)}
                            disabled={deletingId === product.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === product.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No products found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your filters or add a new product
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
