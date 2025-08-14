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
  Phone,
  Mail,
  MapPin
} from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

type Ledger = Database['public']['Tables']['ledgers']['Row'] & {
  profiles: { email: string } | null;
};
type UserRole = Database['public']['Tables']['profiles']['Row']['user_role']

interface LedgersContentProps {
  ledgers: Ledger[]
  totalCount: number
  userRole: UserRole
}

export function LedgersContent({ ledgers, totalCount, userRole }: LedgersContentProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const canEdit = userRole === 'Admin' || userRole === 'Manager'

  const filteredLedgers = ledgers.filter(ledger => {
    const matchesSearch = !searchTerm || 
      ledger.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ledger.ledger_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ledger.contact_person_name && ledger.contact_person_name.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

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

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Ledgers
          </CardTitle>
          <CardDescription>
            Search by business name, ledger ID, or contact person
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search ledgers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ledgers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLedgers.map((ledger) => (
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

      {filteredLedgers.length === 0 && (
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
      {filteredLedgers.length < totalCount && (
        <div className="text-center">
          <Button variant="outline">
            Load More Ledgers
          </Button>
        </div>
      )}
    </div>
  )
}
