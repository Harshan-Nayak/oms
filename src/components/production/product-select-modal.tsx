'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import Image from 'next/image'

type Product = Database['public']['Tables']['products']['Row']

interface ProductSelectModalProps {
  products: Product[]
  onProductSelect: (productId: number) => void
  children: React.ReactNode
}

export function ProductSelectModal({ products, onProductSelect, children }: ProductSelectModalProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredProducts = products.filter(product => {
    const searchTermLower = searchTerm.toLowerCase()
    const categoryLower = categoryFilter.toLowerCase()
    const statusLower = statusFilter.toLowerCase()

    return (
      (product.product_name.toLowerCase().includes(searchTermLower) ||
       product.product_sku.toLowerCase().includes(searchTermLower) ||
       (product.product_description && product.product_description.toLowerCase().includes(searchTermLower))) &&
      (!categoryLower || product.product_category.toLowerCase().includes(categoryLower)) &&
      (!statusLower || (product.product_status && product.product_status.toLowerCase().includes(statusLower)))
    )
  })

  const handleSelect = (productId: number) => {
    onProductSelect(productId)
    setOpen(false)
  }

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'Active':
        return 'default'
      case 'Inactive':
        return 'destructive'
      case 'Pipeline':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Select a Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, SKU, or description..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="Filter by category..."
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input
                id="status"
                placeholder="Filter by status..."
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  className="p-3 border rounded-md cursor-pointer hover:bg-gray-100 flex items-center space-x-4"
                  onClick={() => handleSelect(product.id)}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product.product_image ? (
                      <Image
                        src={product.product_image}
                        alt={product.product_name}
                        width={64}
                        height={64}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-gray-500 font-semibold text-lg">
                        {product.product_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{product.product_name}</div>
                      <Badge variant={getStatusBadgeVariant(product.product_status)}>
                        {product.product_status || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      SKU: {product.product_sku} | Category: {product.product_category}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.product_sub_category && `Sub-Category: ${product.product_sub_category} | `}
                      Qty: {product.product_qty || 0} | Brand: {product.product_brand || 'N/A'}
                    </div>
                    {product.product_description && (
                      <div className="text-sm text-gray-600 mt-1 truncate">
                        {product.product_description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No products found matching your criteria.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}