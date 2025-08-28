'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface IsteachingChallanListProps {
  ledgerId: string
}

interface IsteachingChallan {
  id: number;
  challan_no: string
  date: string
  quality: string;
  batch_number: string[];
  quantity: number;
}

export default function IsteachingChallanList({ ledgerId }: IsteachingChallanListProps) {
  const [challans, setChallans] = useState<IsteachingChallan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchChallans() {
      const { data, error } = await supabase
        .from('isteaching_challans')
        .select('id, challan_no, date, quality, batch_number, quantity')
        .eq('ledger_id', ledgerId)
        .order('date', { ascending: false })

      if (error) {
        console.error('Error fetching isteaching challans:', error)
      } else {
        setChallans(data as IsteachingChallan[])
      }
      setLoading(false)
    }

    fetchChallans()
  }, [ledgerId, supabase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stitching  Challans</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading challans...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Batch Numbers</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challans.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell>
                    <Link href={`/dashboard/production/isteaching-challan/${challan.id}`}>
                      <span className="text-blue-600 hover:underline">{challan.challan_no}</span>
                    </Link>
                  </TableCell>
                  <TableCell>{new Date(challan.date).toLocaleDateString()}</TableCell>
                  <TableCell>{challan.quality}</TableCell>
                  <TableCell>{challan.batch_number.join(', ')}</TableCell>
                  <TableCell>{challan.quantity}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
