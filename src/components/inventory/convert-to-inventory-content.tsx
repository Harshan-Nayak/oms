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
import { Badge } from '@/components/ui/badge'
import { Calendar, Check, X, AlertTriangle } from 'lucide-react'
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

interface ConvertToInventoryContentProps {
  challans: IsteachingChallan[]
  userRole: string
}

export function ConvertToInventoryContent({ challans, userRole }: ConvertToInventoryContentProps) {
  const router = useRouter()
 const [selectedChallan, setSelectedChallan] = useState<IsteachingChallan | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Debug: Log the first challan to see what data we're getting
  // useEffect(() => {
  //   if (challans && challans.length > 0) {
  //     console.log('First challan data:', challans[0]);
  //   }
  // }, [challans]);

  // Filter challans that haven't been converted to inventory
  // Only show challans that are unclassified
  const unconvertedChallans = challans.filter(challan => {
    return !challan.inventory_classification || challan.inventory_classification === 'unclassified'
  })

  const handleClassification = async (challanId: number, classification: 'good' | 'bad' | 'wastage' | 'shorting') => {
    try {
      const response = await fetch('/api/inventory/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          challanId,
          classification
        }),
      });
      
      if (response.ok) {
        // Refresh the page to show updated data
        router.refresh();
      } else {
        console.error('Failed to classify challan');
      }
    } catch (error) {
      console.error('Error classifying challan:', error);
    }
    
    // Close the popup
    setIsPopupOpen(false)
    setSelectedChallan(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Convert To Inventory</h1>
        <p className="text-gray-600 mt-1">
          Convert stitching challans to inventory items
        </p>
      </div>

      {/* Current Date Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Date</CardTitle>
          <CardDescription>
            The current date is automatically selected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-2xl font-bold">
            <Calendar className="h-6 w-6 mr-2 text-gray-500" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </CardContent>
      </Card>

      {/* Challans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stitching Challans</CardTitle>
          <CardDescription>
            Select a challan to convert to inventory
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
              {unconvertedChallans.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell>{challan.challan_no}</TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(challan.date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {challan.ledgers?.business_name || 'N/A'}
                  </TableCell>
                  <TableCell>{challan.quality}</TableCell>
                  <TableCell>{challan.batch_number.join(', ')}</TableCell>
                  <TableCell>{challan.quantity}</TableCell>
                  <TableCell>{challan.products?.product_name || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isPopupOpen && selectedChallan?.id === challan.id} onOpenChange={setIsPopupOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedChallan(challan)
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
                            Detailed information for challan {challan.challan_no}
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

                            {/* Classification Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                              <Button
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleClassification(selectedChallan.id, 'good')}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Good Inventory
                              </Button>
                              <Button
                                className="flex-1 bg-red-600 hover:bg-red-700"
                                onClick={() => handleClassification(selectedChallan.id, 'bad')}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Bad Inventory
                              </Button>
                              <Button
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                                onClick={() => handleClassification(selectedChallan.id, 'wastage')}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Wastage
                              </Button>
                              <Button
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => handleClassification(selectedChallan.id, 'shorting')}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Shorting
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {unconvertedChallans.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-500">No unconverted challans found</div>
              <div className="text-sm text-gray-400 mt-1">
                All challans have been converted to inventory
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
