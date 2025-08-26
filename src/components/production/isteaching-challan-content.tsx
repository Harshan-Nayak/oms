'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
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
  History
} from 'lucide-react'
import { Database, Json } from '@/types/database'
import { formatDate } from '@/lib/utils'
import { IsteachingChallanForm } from './isteaching-challan-form'

type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Row'] & {
  ledgers?: {
    business_name: string
  }
}

type Ledger = Database['public']['Tables']['ledgers']['Row']
type Quality = { product_name: string }
type BatchNumber = { batch_number: string, quality_details: Json }
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface IsteachingChallanContentProps {
  challans: IsteachingChallan[]
  totalCount: number
  ledgers: Ledger[]
  qualities: Quality[]
  batchNumbers: BatchNumber[]
  userRole: UserRole
}

export function IsteachingChallanContent({ 
  challans, 
  totalCount, 
  ledgers, 
  qualities,
  batchNumbers,
  userRole
}: IsteachingChallanContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [partyFilter, setPartyFilter] = useState('')
  const [startDateFilter, setStartDateFilter] = useState('')
  const [endDateFilter, setEndDateFilter] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager'

  const filteredChallans = challans.filter(challan => {
    const matchesSearch = !searchTerm || 
      challan.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.quality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (challan.ledgers?.business_name && challan.ledgers.business_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesParty = !partyFilter || partyFilter === 'all' || challan.ledger_id === partyFilter
    
    const matchesDate = (!startDateFilter || new Date(challan.date) >= new Date(startDateFilter)) &&
                        (!endDateFilter || new Date(challan.date) < new Date(new Date(endDateFilter).setDate(new Date(endDateFilter).getDate() + 1)))

    const matchesQuality = !qualityFilter || qualityFilter === 'all' || challan.quality.toLowerCase().includes(qualityFilter.toLowerCase())

    return matchesSearch && matchesParty && matchesDate && matchesQuality
  })

  const resetFilters = () => {
    setSearchTerm('')
    setPartyFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setQualityFilter('')
  }

  const handleDeleteIsteachingChallan = async (challanId: number) => {
    if (!confirm(`Are you sure you want to delete this challan? This action cannot be undone.`)) {
      return
    }

    setDeletingId(challanId)

    try {
      const { error } = await supabase
        .from('isteaching_challans')
        .delete()
        .eq('id', challanId)

      if (error) {
        toast.error('Failed to delete challan. Please try again.')
        return
      }

      toast.success(`Challan has been deleted successfully.`)
      router.refresh()
    } catch (err) {
      console.error('Error deleting challan:', err)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Isteaching Challan</h1>
            <p className="text-gray-600 mt-1">
              Create a new isteaching challan.
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            Back to List
          </Button>
        </div>

        <IsteachingChallanForm 
          ledgers={ledgers}
          qualities={qualities}
          batchNumbers={batchNumbers}
          onSuccess={() => {
            setShowCreateForm(false)
            router.refresh()
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Isteaching Challans</h1>
          <p className="text-gray-600 mt-1">
            Manage isteaching challans ({totalCount} total challans)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challan
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search & Filter Challans
          </CardTitle>
          <CardDescription>
            Use the search bar for quick searches or expand the filters for more options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search challans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="filters">
              <AccordionTrigger>Advanced Filters</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                  <div className="space-y-2">
                    <Label>Party Name</Label>
                    <Select value={partyFilter} onValueChange={setPartyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Parties" />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="all">All Parties</SelectItem>
                        {ledgers.map(ledger => (
                          <SelectItem key={ledger.ledger_id} value={ledger.ledger_id}>
                            {ledger.business_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quality Name</Label>
                    <Select value={qualityFilter} onValueChange={setQualityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Qualities" />
                      </SelectTrigger>
                      <SelectContent className='bg-white'>
                        <SelectItem value="all">All Qualities</SelectItem>
                        {qualities.map(q => (
                          <SelectItem key={q.product_name} value={q.product_name}>
                            {q.product_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredChallans.length}
            </div>
            <div className="text-sm text-gray-600">Filtered Challans</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredChallans.reduce((sum, challan) => sum + Number(challan.quantity), 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Quantity</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(filteredChallans.map(c => c.quality)).size}
            </div>
            <div className="text-sm text-gray-600">Unique Qualities</div>
          </CardContent>
        </Card>
      </div>

      {/* Challans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Challan List</CardTitle>
          <CardDescription>
            {filteredChallans.length} of {totalCount} challans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChallans.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(challan.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(challan.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {challan.ledgers?.business_name || 'N/A'}
                  </TableCell>
                  <TableCell>{challan.quality}</TableCell>
                  <TableCell>{challan.batch_number}</TableCell>
                  <TableCell>{challan.quantity}</TableCell>
                  <TableCell>{challan.product_name}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className=' bg-white ' >
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/isteaching-challan/${challan.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/production/isteaching-challan/${challan.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/isteaching-challan/${challan.id}/logs`)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Change Logs
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteIsteachingChallan(challan.id)}
                            disabled={deletingId === challan.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingId === challan.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredChallans.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No challans found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your search or create a new challan
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
