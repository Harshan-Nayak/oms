'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShortingEntryForm } from './shorting-entry-form'
import { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

type Ledger = Database['public']['Tables']['ledgers']['Row']
type ShortingEntry = Database['public']['Tables']['shorting_entries']['Row'] & {
  ledgers: { business_name: string } | null
  weaver_challans: { challan_no: string } | null
}

interface ShortingEntryContentProps {
  ledgers: Ledger[]
  shortingEntries: ShortingEntry[]
  userId: string
  userName: string
}

export function ShortingEntryContent({ ledgers, shortingEntries, userId, userName }: ShortingEntryContentProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shorting Entry</h1>
          <p className="text-gray-600 mt-1">
            Create a new shorting entry
          </p>
        </div>
      </div>

      <ShortingEntryForm 
        ledgers={ledgers}
        userId={userId}
        userName={userName}
        onSuccess={() => {
          router.refresh()
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Shorting Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead>Weaver Challan</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Shorting Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortingEntries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{formatDate(entry.entry_date)}</TableCell>
                  <TableCell>{entry.ledgers?.business_name}</TableCell>
                  <TableCell>{entry.weaver_challans?.challan_no}</TableCell>
                  <TableCell>{entry.quality_name}</TableCell>
                  <TableCell>{entry.shorting_qty} mtr</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
