'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'

interface ProductionDashboardContentProps {
  finishedStock: {
    quality_name: string
    total_qty: number
    shorted_qty: number
    issued_qty: number
    available_qty: number
  }[]
  batchNumbers: string[]
}

export function ProductionDashboardContent({ finishedStock, batchNumbers }: ProductionDashboardContentProps) {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const router = useRouter()

  const handleViewHistory = () => {
    if (selectedBatch) {
      router.push(`/dashboard/production/batch/${selectedBatch}`)
    }
  }

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
