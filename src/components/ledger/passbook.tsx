'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface PassbookProps {
  ledgerId: string
}

interface Challan {
  challan_no: string
  challan_date: string
  total_grey_mtr: number
  quality_details: { rate: number }[]
}

export default function Passbook({ ledgerId }: PassbookProps) {
  const [challans, setChallans] = useState<Challan[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchChallans() {
      const { data, error } = await supabase
        .from('weaver_challans')
        .select('challan_no, challan_date, total_grey_mtr, quality_details')
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

  let balance = 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Passbook</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading passbook...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>S.NO</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>DETAIL</TableHead>
                <TableHead>REMARK</TableHead>
                <TableHead>CREDIT</TableHead>
                <TableHead>DEBIT</TableHead>
                <TableHead>BALANCE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {challans.map((challan, index) => {
                const credit = challan.total_grey_mtr * (challan.quality_details[0]?.rate || 0)
                balance += credit
                return (
                  <TableRow key={challan.challan_no}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{formatDate(challan.challan_date)}</TableCell>
                    <TableCell>Weaver Challan</TableCell>
                    <TableCell>{challan.challan_no}</TableCell>
                    <TableCell>{credit.toFixed(2)} INR</TableCell>
                    <TableCell>0.00 INR</TableCell>
                    <TableCell>{balance.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
