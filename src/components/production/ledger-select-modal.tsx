'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database } from '@/types/database'
import Image from 'next/image'

type Ledger = Database['public']['Tables']['ledgers']['Row']

interface LedgerSelectModalProps {
  ledgers: Ledger[]
  onLedgerSelect: (ledgerId: string) => void
  children: React.ReactNode
}

export function LedgerSelectModal({ ledgers, onLedgerSelect, children }: LedgerSelectModalProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [stateFilter, setStateFilter] = useState('')

  const filteredLedgers = ledgers.filter(ledger => {
    const searchTermLower = searchTerm.toLowerCase()
    const cityLower = cityFilter.toLowerCase()
    const stateLower = stateFilter.toLowerCase()

    return (
      (ledger.business_name.toLowerCase().includes(searchTermLower) ||
       ledger.ledger_id.toLowerCase().includes(searchTermLower) ||
       (ledger.gst_number && ledger.gst_number.toLowerCase().includes(searchTermLower))) &&
      (!cityLower || (ledger.city && ledger.city.toLowerCase().includes(cityLower))) &&
      (!stateLower || (ledger.state && ledger.state.toLowerCase().includes(stateLower)))
    )
  })

  const handleSelect = (ledgerId: string) => {
    onLedgerSelect(ledgerId)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select a Ledger</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, ID, or GST..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Filter by city..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="Filter by state..."
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-72">
            <div className="space-y-2">
              {filteredLedgers.map(ledger => (
                <div
                  key={ledger.ledger_id}
                  className="p-2 border rounded-md cursor-pointer hover:bg-gray-100 flex items-center space-x-4"
                  onClick={() => handleSelect(ledger.ledger_id)}
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
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
                      <div className="text-gray-500 font-semibold text-lg">
                        {ledger.business_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{ledger.business_name}</div>
                    <div className="text-sm text-gray-500">
                      {ledger.ledger_id} | {ledger.city}, {ledger.state}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
