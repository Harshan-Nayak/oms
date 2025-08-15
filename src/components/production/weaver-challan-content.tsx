'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Truck,
  Calendar,
  History
} from 'lucide-react'
import { Database, Json } from '@/types/database'
import { formatDate, formatCurrency } from '@/lib/utils'
import { WeaverChallanForm } from './weaver-challan-form'

type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row'] & {
  ledgers?: {
    business_name: string
    contact_person_name: string | null
    mobile_number: string | null
    address: string | null
    city: string | null
    state: string | null
  }
}

type Ledger = Database['public']['Tables']['ledgers']['Row']
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface WeaverChallanContentProps {
  challans: WeaverChallan[]
  totalCount: number
  ledgers: Ledger[]
  userRole: UserRole
  userId: string
  userName: string
}

export function WeaverChallanContent({ 
  challans, 
  totalCount, 
  ledgers, 
  userRole, 
  userId, 
  userName 
}: WeaverChallanContentProps) {
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
      challan.challan_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      challan.ms_party_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (challan.ledgers?.business_name && challan.ledgers.business_name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesParty = !partyFilter || partyFilter === 'all' || challan.ledger_id === partyFilter
    
    const matchesDate = (!startDateFilter || new Date(challan.challan_date) >= new Date(startDateFilter)) &&
                        (!endDateFilter || new Date(challan.challan_date) <= new Date(endDateFilter))

    const matchesQuality = !qualityFilter || qualityFilter === 'all' ||
      (challan.quality_details && Array.isArray(challan.quality_details) &&
       challan.quality_details.some(q =>
         q && typeof q === 'object' && 'quality_name' in q && typeof q.quality_name === 'string' &&
         q.quality_name.toLowerCase().includes(qualityFilter.toLowerCase())
       ))

    return matchesSearch && matchesParty && matchesDate && matchesQuality
  })

  const resetFilters = () => {
    setSearchTerm('')
    setPartyFilter('')
    setStartDateFilter('')
    setEndDateFilter('')
    setQualityFilter('')
  }

  const handleDeleteWeaverChallan = async (challanId: number, challanNo: string) => {
    if (!confirm(`Are you sure you want to delete Weaver Challan "${challanNo}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(challanId)

    try {
      const { error } = await supabase
        .from('weaver_challans')
        .delete()
        .eq('id', challanId)

      if (error) {
        alert('Failed to delete weaver challan. Please try again.')
        return
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error deleting weaver challan:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (challan: WeaverChallan) => {
    // You can add status logic based on your business rules
    const isRecent = new Date(challan.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return isRecent ? (
      <Badge variant="default" className="bg-green-100 text-green-700">Active</Badge>
    ) : (
      <Badge variant="secondary" className="bg-blue-100 text-blue-700">Completed</Badge>
    )
  }

  const parseQualityDetails = (qualityDetails: Json | null) => {
    if (!qualityDetails) return []
    try {
      return typeof qualityDetails === 'string' 
        ? JSON.parse(qualityDetails)
        : qualityDetails
    } catch {
      return []
    }
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Weaver Challan</h1>
            <p className="text-gray-600 mt-1">
              Create a new production challan for weaving process
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            Back to List
          </Button>
        </div>

        <WeaverChallanForm 
          ledgers={ledgers}
          userId={userId}
          userName={userName}
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
          <h1 className="text-3xl font-bold text-gray-900">Weaver Challans</h1>
          <p className="text-gray-600 mt-1">
            Manage production challans for weaving process ({totalCount} total challans)
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
                        <SelectItem value="Cotton">Cotton</SelectItem>
                        <SelectItem value="Linen">Linen</SelectItem>
                        <SelectItem value="Silk">Silk</SelectItem>
                        <SelectItem value="Wool">Wool</SelectItem>
                        <SelectItem value="Cashmere">Cashmere</SelectItem>
                        <SelectItem value="Hemp">Hemp</SelectItem>
                        <SelectItem value="Polyester">Polyester</SelectItem>
                        <SelectItem value="Nylon">Nylon</SelectItem>
                        <SelectItem value="Rayon">Rayon</SelectItem>
                        <SelectItem value="Lycra">Lycra</SelectItem>
                        <SelectItem value="Acrylic">Acrylic</SelectItem>
                        <SelectItem value="Chiffon">Chiffon</SelectItem>
                        <SelectItem value="Georgette">Georgette</SelectItem>
                        <SelectItem value="Organza">Organza</SelectItem>
                        <SelectItem value="Tulle">Tulle</SelectItem>
                        <SelectItem value="Satin">Satin</SelectItem>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {filteredChallans.reduce((sum, challan) => sum + challan.total_grey_mtr, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Grey Mtr</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {filteredChallans.reduce((sum, challan) => sum + challan.taka, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Taka</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredChallans.filter(c => c.transport_name).length}
            </div>
            <div className="text-sm text-gray-600">With Transport</div>
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
                <TableHead>Batch/Challan</TableHead>
                <TableHead>Party Name</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Total Grey (Mtr)</TableHead>
                <TableHead>Taka</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChallans.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{challan.batch_number}</div>
                      <div className="text-sm text-gray-500 font-mono">{challan.challan_no}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{challan.ms_party_name}</div>
                    {challan.delivery_at && (
                      <div className="text-sm text-gray-500">→ {challan.delivery_at}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {challan.ledgers?.business_name || 'N/A'}
                      </div>
                      {challan.ledgers?.contact_person_name && (
                        <div className="text-sm text-gray-500">
                          {challan.ledgers.contact_person_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {challan.total_grey_mtr.toFixed(2)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {challan.taka}
                  </TableCell>
                  <TableCell>
                    {challan.transport_name ? (
                      <div>
                        <div className="flex items-center text-sm">
                          <Truck className="h-3 w-3 mr-1" />
                          {challan.transport_name}
                        </div>
                        {challan.lr_number && (
                          <div className="text-xs text-gray-500">
                            LR: {challan.lr_number}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(challan.challan_date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(challan.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(challan)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className=' bg-white ' >
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/weaver-challan/${challan.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/weaver-challan/${challan.id}/print`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Print Challan
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/production/weaver-challan/${challan.id}/edit`)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => router.push(`/dashboard/production/weaver-challan/${challan.id}/logs`)}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Change Logs
                        </DropdownMenuItem>
                        {canEdit && (
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDeleteWeaverChallan(challan.id, challan.challan_no)}
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
