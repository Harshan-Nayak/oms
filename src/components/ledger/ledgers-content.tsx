'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  History,
  Filter,
  X,
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

type Ledger = Database['public']['Tables']['ledgers']['Row'] & {
  profiles: { email: string } | null
}
type LedgerLog = Database['public']['Tables']['ledger_logs']['Row'] & {
  profiles: { email: string } | null
}
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface LedgersContentProps {
  ledgers: Ledger[]
  totalCount: number
  userRole: UserRole
}

export function LedgersContent({ ledgers, totalCount, userRole }: LedgersContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
    fromDate: searchParams.get('fromDate') || '',
    toDate: searchParams.get('toDate') || '',
  })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedLedgerLogs, setSelectedLedgerLogs] = useState<LedgerLog[]>([])
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [states, setStates] = useState<string[]>([])
  const [cities, setCities] = useState<string[]>([])

  const canEdit = userRole === 'Admin' || userRole === 'Manager'

  useEffect(() => {
    const fetchStates = async () => {
      const { data, error } = await supabase.from('ledgers').select('state').neq('state', '')
      if (data) {
        const uniqueStates = [...new Set(data.map(item => item.state).filter(Boolean))] as string[]
        setStates(uniqueStates)
      }
    }
    fetchStates()
  }, [])

  useEffect(() => {
    if (filters.state) {
      const fetchCities = async () => {
        const { data, error } = await supabase.from('ledgers').select('city').eq('state', filters.state).neq('city', '')
        if (data) {
          const uniqueCities = [...new Set(data.map(item => item.city).filter(Boolean))] as string[]
          setCities(uniqueCities)
        }
      }
      fetchCities()
    } else {
      setCities([])
    }
  }, [filters.state])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams)
    params.set('page', '1')
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.push(`/dashboard/ledger/list?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setFilters({ state: '', city: '', fromDate: '', toDate: '' })
    router.push('/dashboard/ledger/list')
  }

  const handleDeleteLedger = async (ledgerId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete "${businessName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(ledgerId)

    try {
      const { error } = await supabase
        .from('ledgers')
        .delete()
        .eq('ledger_id', ledgerId)

      if (error) {
        alert('Failed to delete ledger. Please try again.')
        return
      }

      // Refresh the page to show updated data
      router.refresh()
    } catch (err) {
      console.error('Error deleting ledger:', err)
      alert('An unexpected error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleShowLogs = async (ledger: Ledger) => {
    setSelectedLedger(ledger)
    setIsLogModalOpen(true)

    const { data: logs, error } = await supabase
      .from('ledger_logs')
      .select(`*`)
      .eq('ledger_id', ledger.ledger_id)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching ledger logs:', error)
      alert('Failed to fetch change logs. Please try again.')
      return
    }

    const userIds = logs.map(log => log.changed_by).filter(Boolean) as string[];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)

    const logsWithEmails = logs.map(log => {
      const profile = profiles?.find(p => p.id === log.changed_by)
      return {
        ...log,
        profiles: profile ? { email: profile.email } : null
      }
    })
    
    setSelectedLedgerLogs(logsWithEmails as LedgerLog[])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ledgers</h1>
          <p className="text-gray-600 mt-1">
            Manage business partners and vendors ({totalCount} total ledgers)
          </p>
        </div>
        {canEdit && (
          <Button onClick={() => router.push('/dashboard/ledger/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Ledger
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Search Ledgers
          </CardTitle>
          <CardDescription>
            Use filters to narrow down your search results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="By name, ID, contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)} disabled={!filters.state}>
                <SelectTrigger>
                  <SelectValue placeholder="Select City" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={applyFilters}>
              <Search className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ledgers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ledgers.map((ledger) => (
          <Card key={ledger.ledger_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {ledger.business_logo ? (
                      <Image
                        src={ledger.business_logo}
                        alt={ledger.business_name}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="text-blue-600 font-semibold text-lg">
                        {ledger.business_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{ledger.business_name}</CardTitle>
                    <p className="text-sm text-gray-500 font-mono">{ledger.ledger_id}</p>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className='bg-white' >
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/ledger/${ledger.ledger_id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/ledger/${ledger.ledger_id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem onClick={() => handleShowLogs(ledger)}>
                        <History className="mr-2 h-4 w-4" />
                        Change Logs
                      </DropdownMenuItem>
                    )}
                    {canEdit && (
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDeleteLedger(ledger.ledger_id, ledger.business_name)}
                        disabled={deletingId === ledger.ledger_id}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingId === ledger.ledger_id ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {ledger.contact_person_name && (
                <div className="flex items-center text-sm text-gray-600">
                  <Eye className="h-4 w-4 mr-2" />
                  <span>{ledger.contact_person_name}</span>
                </div>
              )}
              
              {ledger.mobile_number && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>{ledger.mobile_number}</span>
                </div>
              )}
              
              {ledger.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  <span className="truncate">{ledger.email}</span>
                </div>
              )}
              
              {ledger.city && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{ledger.city}, {ledger.state}</span>
                </div>
              )}

              {ledger.gst_number && (
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    GST: {ledger.gst_number}
                  </Badge>
                </div>
              )}

              <div className="pt-2 text-xs text-gray-600">
                Created by {ledger.profiles?.email ? ledger.profiles.email : 'N/A'} on {formatDate(ledger.created_at)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {ledgers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">No ledgers found</div>
            <div className="text-sm text-gray-400 mt-1">
              Try adjusting your search or create a new ledger
            </div>
          </CardContent>
        </Card>
      )}

      {/* Load More */}
      {ledgers.length < totalCount && (
        <div className="text-center">
          <Button variant="outline">
            Load More Ledgers
          </Button>
        </div>
      )}

      {/* Change Log Modal */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="max-w-3xl bg-white">
          <DialogHeader>
            <DialogTitle>Change Log for {selectedLedger?.business_name}</DialogTitle>
            <DialogDescription>
              Showing all changes made to this ledger.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {selectedLedgerLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Changed By</TableHead>
                    <TableHead>Changed At</TableHead>
                    <TableHead>Changes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedLedgerLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>{formatDate(log.changed_at)}</TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded-md text-xs">
                          {JSON.stringify(log.changes, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-gray-500 py-8">No changes have been logged for this ledger yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
