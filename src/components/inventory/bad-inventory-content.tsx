'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Calendar, Undo } from 'lucide-react'
import { Database } from '@/types/database'
import { formatDate } from '@/lib/utils'

type IsteachingChallan = Database['public']['Tables']['isteaching_challans']['Row'] & {
  ledgers?: {
    business_name: string
  }
  products?: {
    product_name: string
    product_description: string
    product_image: string
    product_sku: string
  }
} & {
  top_qty: number | null | undefined
  top_pcs_qty: number | null | undefined
  bottom_qty: number | null | undefined
  bottom_pcs_qty: number | null | undefined
  both_selected: boolean | null | undefined
  both_top_qty: number | null | undefined
  both_bottom_qty: number | null | undefined
  inventory_classification: 'unclassified' | 'good' | 'bad' | 'wastage' | 'shorting' | null | undefined
}

interface BadInventoryContentProps {
  items: IsteachingChallan[]
  userRole: string
}

export function BadInventoryContent({ items, userRole }: BadInventoryContentProps) {
  const router = useRouter()
  const [selectedChallan, setSelectedChallan] = useState<IsteachingChallan | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  const handleUndo = async (challanId: number) => {
    try {
      const response = await fetch('/api/inventory/undo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challanId
        }),
      });
      
      if (response.ok) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        console.error('Failed to undo classification');
      }
    } catch (error) {
      console.error('Error undoing classification:', error);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Bad Inventory</h1>
        <p className="text-gray-600 mt-1">
          View and manage bad inventory items
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bad Inventory Items</CardTitle>
          <CardDescription>
            All items classified as bad inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Ledger</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.challan_no}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.ledgers?.business_name || 'N/A'}
                  </TableCell>
                  <TableCell>{item.quality}</TableCell>
                  <TableCell>{item.batch_number.join(', ')}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.products?.product_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Dialog open={isPopupOpen && selectedChallan?.id === item.id} onOpenChange={setIsPopupOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChallan(item)
                              setIsPopupOpen(true)
                            }}
                          >
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Challan Details</DialogTitle>
                            <DialogDescription>
                              Detailed information for challan {item.challan_no}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedChallan && (
                            <div className="space-y-6">
                              {/* Challan Information */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Challan Information</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Challan Number:</span>
                                    <span className="font-medium">{selectedChallan.challan_no}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Date:</span>
                                    <span className="font-medium">{new Date(selectedChallan.date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Ledger:</span>
                                    <span className="font-medium">{selectedChallan.ledgers?.business_name || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Quality:</span>
                                    <span className="font-medium">{selectedChallan.quality}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Product Information */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Product Information</h3>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Product Name:</span>
                                    <span className="font-medium">{selectedChallan.products?.product_name || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">SKU:</span>
                                    <span className="font-medium">{selectedChallan.products?.product_sku || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Description:</span>
                                    <span className="font-medium">{selectedChallan.products?.product_description || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Quantity:</span>
                                    <span className="font-medium">{selectedChallan.quantity}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Batch Details */}
                              <div>
                                <h3 className="text-lg font-semibold mb-2">Batch Details</h3>
                                {selectedChallan.both_selected && (
                                  <div className="mb-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                                    Note: This challan uses the &quot;Both (Top + Bottom)&quot; configuration
                                  </div>
                                )}
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Batch Numbers:</span>
                                    <span className="font-medium">{selectedChallan.batch_number.join(', ')}</span>
                                  </div>
                                  {selectedChallan.both_selected ? (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Top 1pc Quantity:</span>
                                        <span className="font-medium">
                                          {selectedChallan.both_top_qty !== null && selectedChallan.both_top_qty !== undefined ? selectedChallan.both_top_qty : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Top Pcs created:</span>
                                        <span className="font-medium">
                                          {(() => {
                                            // For "Both" case, calculate pieces created
                                            if (selectedChallan.quantity && selectedChallan.both_top_qty !== null && selectedChallan.both_bottom_qty !== null) {
                                              const totalQty = selectedChallan.both_top_qty + selectedChallan.both_bottom_qty;
                                              if (totalQty > 0) {
                                                return Math.floor(selectedChallan.quantity / totalQty);
                                              }
                                            }
                                            return 'N/A';
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bottom 1pc Quantity:</span>
                                        <span className="font-medium">
                                          {selectedChallan.both_bottom_qty !== null && selectedChallan.both_bottom_qty !== undefined ? selectedChallan.both_bottom_qty : 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bottom Pcs created:</span>
                                        <span className="font-medium">
                                          {(() => {
                                            // For "Both" case, calculate pieces created (same as top pieces)
                                            if (selectedChallan.quantity && selectedChallan.both_top_qty !== null && selectedChallan.both_bottom_qty !== null) {
                                              const totalQty = selectedChallan.both_top_qty + selectedChallan.both_bottom_qty;
                                              if (totalQty > 0) {
                                                return Math.floor(selectedChallan.quantity / totalQty);
                                              }
                                            }
                                            return 'N/A';
                                          })()}
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Top Quantity (Total mtrs):</span>
                                        <span className="font-medium">
                                          {selectedChallan.top_qty !== null && selectedChallan.top_qty !== undefined ? selectedChallan.top_qty : (selectedChallan.top_qty === 0 ? '0' : 'N/A')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Top 1pc Quantity:</span>
                                        <span className="font-medium">
                                          {selectedChallan.top_pcs_qty !== null && selectedChallan.top_pcs_qty !== undefined ? selectedChallan.top_pcs_qty : (selectedChallan.top_pcs_qty === 0 ? '0' : 'N/A')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Top Pcs created:</span>
                                        <span className="font-medium">
                                          {(() => {
                                            // For regular case, calculate pieces created
                                            if (selectedChallan.top_qty && selectedChallan.top_pcs_qty && selectedChallan.top_pcs_qty > 0) {
                                              return Math.floor(selectedChallan.top_qty / selectedChallan.top_pcs_qty);
                                            }
                                            return 'N/A';
                                          })()}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bottom Quantity (Total mtrs):</span>
                                        <span className="font-medium">
                                          {selectedChallan.bottom_qty !== null && selectedChallan.bottom_qty !== undefined ? selectedChallan.bottom_qty : (selectedChallan.bottom_qty === 0 ? '0' : 'N/A')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bottom 1pc Quantity:</span>
                                        <span className="font-medium">
                                          {selectedChallan.bottom_pcs_qty !== null && selectedChallan.bottom_pcs_qty !== undefined ? selectedChallan.bottom_pcs_qty : (selectedChallan.bottom_pcs_qty === 0 ? '0' : 'N/A')}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Bottom Pcs created:</span>
                                        <span className="font-medium">
                                          {(() => {
                                            // For regular case, calculate pieces created
                                            if (selectedChallan.bottom_qty && selectedChallan.bottom_pcs_qty && selectedChallan.bottom_pcs_qty > 0) {
                                              return Math.floor(selectedChallan.bottom_qty / selectedChallan.bottom_pcs_qty);
                                            }
                                            return 'N/A';
                                          })()}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUndo(item.id)}
                      >
                        <Undo className="h-4 w-4 mr-2" />
                        Undo
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {items.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No bad inventory items found</div>
              <div className="text-sm text-gray-400 mt-1">
                Items classified as bad inventory will appear here
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}