'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface ChallanListProps {
  ledgerId: string
}

interface Challan {
  id: number;
  challan_no: string
  challan_date: string
  total_grey_mtr: number;
  taka: string;
  transport_name: string | null;
  ledgers: {
    business_name: string;
  }[] | null;
}

export default function ChallanList({ ledgerId }: ChallanListProps) {
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchChallans() {
      const { data, error } = await supabase
        .from('weaver_challans')
        .select('id, challan_no, challan_date, total_grey_mtr, taka, transport_name, ledgers(business_name)')
        .eq('ledger_id', ledgerId)
        .order('challan_date', { ascending: false })

      if (error) {
        console.error('Error fetching challans:', error)
      } else {
        setChallans(data as Challan[])
      }
      setLoading(false)
    }

    fetchChallans()
  }, [ledgerId, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challan Details</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading challans...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch/Challan</TableHead>
                {/* <TableHead>Party Name</TableHead> */}
                <TableHead>Business</TableHead>
                <TableHead>Total Grey (Mtr)</TableHead>
                <TableHead>Taka</TableHead>
                <TableHead>Transport</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challans.map((challan) => (
                <TableRow key={challan.challan_no}>
                  <TableCell>
                    <Link href={`/dashboard/production/weaver-challan/${challan.id}`}>
                      <span className="text-blue-600 hover:underline">{challan.challan_no}</span>
                    </Link>
                  </TableCell>
                  {/* <TableCell>{challan.ledgers?.[0]?.business_name || 'N/A'}</TableCell> */}
                  <TableCell>Weaving</TableCell>
                  <TableCell>{challan.total_grey_mtr}</TableCell>
                  <TableCell>{challan.taka}</TableCell>
                  <TableCell>{challan.transport_name || 'N/A'}</TableCell>
                  <TableCell>{formatDate(challan.challan_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
