'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Calendar, Package, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

type BatchData = {
  batch_number: string
  weaver_challan_date: string
  weaver_challan_party: string
  weaver_challan_quantity: number
  total_raw_fabric_used: number
  stitching_challans: {
    id: number
    date: string
    challan_no: string
    product_name: string | null
    quantity: number
    top_qty: number | null
    top_pcs_qty: number | null
    bottom_qty: number | null
    bottom_pcs_qty: number | null
    both_selected: boolean | null
    both_top_qty: number | null
    both_bottom_qty: number | null
    inventory_classification: string | null
  }[]
  expenses: {
    id: number
    expense_date: string
    cost: number
    expense_for: string[]
  }[]
}

interface ProductionDashboardContentProps {
  finishedStock: {
    quality_name: string
    total_qty: number
    shorted_qty: number
    issued_qty: number
    available_qty: number
  }[]
  batchNumbers: string[]
  batchData: BatchData[]
}

export function ProductionDashboardContent({ finishedStock, batchNumbers, batchData }: ProductionDashboardContentProps) {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'in-pipeline' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [partyFilter, setPartyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-pipeline' | 'completed'>('all')
 const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const router = useRouter()

  const handleViewHistory = () => {
    if (selectedBatch) {
      router.push(`/dashboard/production/batch/${selectedBatch}`)
    }
  }

  // Get unique parties for filter dropdown
  const uniqueParties = useMemo(() => {
    const parties = batchData.map(batch => batch.weaver_challan_party)
    return Array.from(new Set(parties)).filter(party => party)
  }, [batchData])

  // Filter batches based on active tab and search term
  const filteredBatches = useMemo(() => {
    return batchData.filter(batch => {
      // Search filter
      const matchesSearch = 
        batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.weaver_challan_party.toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesSearch) return false

      // Tab filter
      let tabFilterPassed = true
      switch (activeTab) {
        case 'all':
          tabFilterPassed = true
          break
        case 'in-pipeline':
          // Batches without stitching challans or with unclassified challans
          tabFilterPassed = batch.stitching_challans.length === 0 || 
                 batch.stitching_challans.some(challan => 
                   !challan.inventory_classification || 
                   challan.inventory_classification === 'unclassified'
                 )
          break
        case 'completed':
          // Batches with at least one stitching challan classified as 'good'
          tabFilterPassed = batch.stitching_challans.some(challan => 
            challan.inventory_classification === 'good'
          )
          break
      }
      
      if (!tabFilterPassed) return false

      // Party filter
      const partyFilterPassed = partyFilter === 'all' || batch.weaver_challan_party === partyFilter
      
      if (!partyFilterPassed) return false

      // Status filter
      let batchStatus: 'in-pipeline' | 'completed' = 'in-pipeline'
      if (batch.stitching_challans.length === 0) {
        batchStatus = 'in-pipeline'
      } else if (batch.stitching_challans.some(challan => 
        challan.inventory_classification === 'good'
      )) {
        batchStatus = 'completed'
      } else {
        batchStatus = 'in-pipeline'
      }
      
      const statusFilterPassed = statusFilter === 'all' || batchStatus === statusFilter
      
      return statusFilterPassed
    })
  }, [batchData, searchTerm, activeTab, partyFilter, statusFilter])

  // Sort batches
  const sortedBatches = useMemo(() => {
    if (!sortConfig) return filteredBatches
    
    return [...filteredBatches].sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date
      
      switch (sortConfig.key) {
        case 'batch_number':
          aValue = a.batch_number
          bValue = b.batch_number
          break
        case 'date':
          aValue = new Date(a.weaver_challan_date)
          bValue = new Date(b.weaver_challan_date)
          break
        case 'party':
          aValue = a.weaver_challan_party
          bValue = b.weaver_challan_party
          break
        case 'quantity':
          aValue = a.weaver_challan_quantity
          bValue = b.weaver_challan_quantity
          break
        case 'status':
          // Determine status for a
          let aStatus: 'in-pipeline' | 'completed' = 'in-pipeline'
          if (a.stitching_challans.length === 0) {
            aStatus = 'in-pipeline'
          } else if (a.stitching_challans.some(challan => 
            challan.inventory_classification === 'good'
          )) {
            aStatus = 'completed'
          }
          
          // Determine status for b
          let bStatus: 'in-pipeline' | 'completed' = 'in-pipeline'
          if (b.stitching_challans.length === 0) {
            bStatus = 'in-pipeline'
          } else if (b.stitching_challans.some(challan => 
            challan.inventory_classification === 'good'
          )) {
            bStatus = 'completed'
          }
          
          aValue = aStatus
          bValue = bStatus
          break
        default:
          return 0
      }
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredBatches, sortConfig])

  // Pagination
  const totalPages = Math.ceil(sortedBatches.length / itemsPerPage)
  const paginatedBatches = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedBatches.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedBatches, currentPage, itemsPerPage])

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  // Reset to first page when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [filteredBatches])

  const totalStock = finishedStock.reduce((sum, stock) => sum + stock.available_qty, 0)
  const totalQualities = finishedStock.length
  const totalIssued = finishedStock.reduce((sum, stock) => sum + stock.issued_qty, 0)
  const totalReceived = finishedStock.reduce((sum, stock) => sum + stock.total_qty, 0)
  const totalShorted = finishedStock.reduce((sum, stock) => sum + stock.shorted_qty, 0)
  const topStockQuality = finishedStock.reduce((max, stock) => stock.available_qty > max.available_qty ? stock : max, { quality_name: 'N/A', available_qty: 0 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Dashboard</h1>
          <p className="text-gray-600 mt-1">
            An overview of your production status.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          className={activeTab === 'all' ? 'bg-white shadow' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Batches
        </Button>
        <Button
          variant={activeTab === 'in-pipeline' ? 'default' : 'ghost'}
          className={activeTab === 'in-pipeline' ? 'bg-white shadow' : ''}
          onClick={() => setActiveTab('in-pipeline')}
        >
          In Pipeline
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'default' : 'ghost'}
          className={activeTab === 'completed' ? 'bg-white shadow' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </Button>
      </div>

      {/* Batch Search and Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle>Batches</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search batches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-full md:w-64"
                />
              </div>
              <Select value={partyFilter} onValueChange={setPartyFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parties</SelectItem>
                  {uniqueParties.map(party => (
                    <SelectItem key={party} value={party}>{party}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'in-pipeline' | 'completed')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in-pipeline">In Pipeline</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('batch_number')}
                >
                  Batch Number {sortConfig?.key === 'batch_number' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('date')}
                >
                  Date {sortConfig?.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('party')}
                >
                  Party {sortConfig?.key === 'party' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 text-right"
                  onClick={() => requestSort('quantity')}
                >
                  Quantity (mtrs) {sortConfig?.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('status')}
                >
                  Status {sortConfig?.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBatches.map((batch) => {
                // Determine batch status
                let status = 'Unknown'
                let statusIcon = <AlertTriangle className="h-4 w-4 text-gray-500" />
                let statusColor = 'bg-gray-100 text-gray-800'
                
                if (batch.stitching_challans.length === 0) {
                  status = 'In Pipeline'
                  statusIcon = <Package className="h-4 w-4 text-blue-500" />
                  statusColor = 'bg-blue-100 text-blue-800'
                } else if (batch.stitching_challans.some(challan => 
                  challan.inventory_classification === 'good'
                )) {
                  status = 'Completed'
                  statusIcon = <CheckCircle className="h-4 w-4 text-green-500" />
                  statusColor = 'bg-green-100 text-green-800'
                } else {
                  status = 'In Pipeline'
                  statusIcon = <Package className="h-4 w-4 text-blue-500" />
                  statusColor = 'bg-blue-100 text-blue-800'
                }

                return (
                  <TableRow key={batch.batch_number}>
                    <TableCell className="font-medium">{batch.batch_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(batch.weaver_challan_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{batch.weaver_challan_party}</TableCell>
                    <TableCell className="text-right">{batch.weaver_challan_quantity}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                        {statusIcon}
                        <span className="ml-1">{status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/dashboard/production/batch/${batch.batch_number}`)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {paginatedBatches.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No batches found</div>
              <div className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filter criteria
              </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {paginatedBatches.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sortedBatches.length)} to {Math.min(currentPage * itemsPerPage, sortedBatches.length)} of {sortedBatches.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch History Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Batch History</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Select onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select a batch number" />
            </SelectTrigger>
            <SelectContent className='bg-white' >
              {batchNumbers.map(batch => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleViewHistory} disabled={!selectedBatch}>
            View History
          </Button>
        </CardContent>
      </Card>

      {/* Finished Cloth Stock */}
      <Card>
        <CardHeader>
          <CardTitle>Finished Cloth Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quality Name</TableHead>
                <TableHead>Total Quantity</TableHead>
                <TableHead>Shorted Quantity</TableHead>
                <TableHead>Issued Quantity</TableHead>
                <TableHead>Available Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finishedStock.map(stock => (
                <TableRow key={stock.quality_name}>
                  <TableCell>{stock.quality_name}</TableCell>
                  <TableCell>{stock.total_qty.toFixed(2)}</TableCell>
                  <TableCell>{stock.shorted_qty.toFixed(2)}</TableCell>
                  <TableCell>{stock.issued_qty.toFixed(2)}</TableCell>
                  <TableCell>{stock.available_qty.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Available Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total units of all qualities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Number of Qualities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQualities}</div>
            <p className="text-xs text-muted-foreground">Distinct qualities in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Issued Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalIssued.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total units issued for stitching</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Received Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReceived.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From weaver challans</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Shorted Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShorted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total units marked as short</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Stocked Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topStockQuality.quality_name}</div>
            <p className="text-xs text-muted-foreground">Highest available quantity</p>
          </CardContent>
        </Card>
      </div>
    </div>
 )
}
