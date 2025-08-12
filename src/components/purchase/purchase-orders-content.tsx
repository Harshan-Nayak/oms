'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'

type PurchaseOrder = {
  id: number
  po_number: string
  po_date: string
  supplier_name: string
  ledger_id: string | null
  total_amount: number
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Partial' | 'Completed' | 'Cancelled'
  description: string | null
  delivery_date: string | null
  terms_conditions: string | null
  created_at: string
  updated_at: string
  created_by: string
  ledgers?: {
    business_name: string
    contact_person_name: string | null
    mobile_number: string | null
  }
}

type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface PurchaseOrdersContentProps {
  purchaseOrders: PurchaseOrder[]
  totalCount: number
  userRole: UserRole
}

export function PurchaseOrdersContent({ purchaseOrders, totalCount, userRole }: PurchaseOrdersContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager'

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = !searchTerm || 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.ledgers?.business_name && po.ledgers.business_name.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const handleDeletePurchaseOrder = async (poId: number, poNumber: string) => {
    if (!confirm(`Are you sure you want to delete Purchase Order "${poNumber}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(poId)

    try {
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', poId)

      if (error) {
        alert('Failed to delete purchase order. Please try again.')
        return
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error deleting purchase order:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Draft': 'bg-gray-100 text-gray-700',
      'Sent': 'bg-blue-100 text-blue-700',
      'Confirmed': 'bg-green-100 text-green-700',
      'Partial': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-emerald-100 text-emerald-700',
      'Cancelled': 'bg-red-100 text-red-700'
    }
    
    return (
      <Badge variant="secondary" className={statusColors[status as keyof typeof statusColors]}>
        {status}
      </Badge>
    )
  }

  const getTotalAmount = () => {
    return purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0)
  }

  const getStatusCounts = () => {
    const counts = purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    return counts
  }

  const statusCounts = getStatusCounts()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">
            Manage purchase orders and supplier communications ({totalCount} total POs)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => router.push('/dashboard/purchase/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create PO
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
                <div className="text-sm text-gray-600">Total POs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getTotalAmount())}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts['Confirmed'] || 0}
            </div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {statusCounts['Sent'] || 0}
            </div>
            <div className="text-sm text-gray-600">Sent</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Purchase Orders
          </CardTitle>
          <CardDescription>
            Search by PO number, supplier name, or business name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search purchase orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>
            {filteredPOs.length} of {totalCount} purchase orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>PO Date</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPOs.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <div className="font-medium font-mono">{po.po_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{po.supplier_name}</div>
                    {po.ledgers?.contact_person_name && (
                      <div className="text-sm text-gray-500">
                        {po.ledgers.contact_person_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {po.ledgers?.business_name || 'Direct Supplier'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(po.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(po.po_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {po.delivery_date ? (
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(po.delivery_date).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/purchase/${po.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/purchase/${po.id}/print`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Print PO
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/purchase/${po.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeletePurchaseOrder(po.id, po.po_number)}
                            disabled={deletingId === po.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === po.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredPOs.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No purchase orders found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your search or create a new purchase order
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
