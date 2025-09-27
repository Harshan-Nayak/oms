'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface IsteachingChallan {
  id: number;
  challan_no: string;
  date: string;
 batch_number: string[];
  quality: string;
  quantity: number;
  product_size: { size: string; quantity: number }[];
}

interface WeaverChallan {
  challan_no: string;
  batch_number: string;
  quality_details: Record<string, unknown> | null;
  vendor_amount: number;
}

interface Product {
  id: number;
  product_image?: string;
  product_name: string;
  product_description?: string;
  product_sku: string;
  product_category: string;
  product_sub_category?: string;
  product_size?: string;
  product_color?: string;
  product_material?: string;
  product_brand: string;
  product_country: string;
  product_status: 'Active' | 'Inactive';
  product_qty: number;
  wash_care?: string;
 created_at: string;
 updated_at: string;
  batch_numbers?: string[];
  cost_incurred?: number;
  weaver_challan_numbers?: string[];
  stitching_challan_numbers?: string[];
  associated_data?: {
    stitching_challans: IsteachingChallan[];
    weaver_challans: WeaverChallan[];
  };
}

export default function PublicProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Get URL parameters for size and barcode
 const [urlParams, setUrlParams] = useState({ size: null as string | null, barcode: null as string | null });

  // Parse size details from various formats
  const parseSizeDetails = (sizeDetails: unknown): { size: string; quantity: number }[] => {
    if (!sizeDetails) return []
    try {
      if (typeof sizeDetails === 'string') {
        // If it's a string, try to parse as JSON
        const parsed = JSON.parse(sizeDetails);
        // If parsed result is an array, return it
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // If parsed result is an object with size and quantity, wrap in array
        if (parsed && typeof parsed === 'object' && parsed.size && parsed.quantity !== undefined) {
          return [parsed];
        }
        return [];
      } else if (Array.isArray(sizeDetails)) {
        // If it's already an array, return as is
        return sizeDetails;
      } else if (sizeDetails && typeof sizeDetails === 'object' && (sizeDetails as { size: string; quantity: number }).size && (sizeDetails as { size: string; quantity: number }).quantity !== undefined) {
        // If it's a single object with size and quantity, wrap in array
        return [(sizeDetails as { size: string; quantity: number })];
      }
      return [];
    } catch {
      return [];
    }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${resolvedParams.id}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const data = await response.json();
        
        // Parse product_size in associated_data.stitching_challans to handle different formats
        if (data.associated_data?.stitching_challans) {
          data.associated_data.stitching_challans = data.associated_data.stitching_challans.map((challan: IsteachingChallan) => ({
            ...challan,
            product_size: parseSizeDetails(challan.product_size)
          }));
        }
        
        setProduct(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    // Get URL parameters
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlParams({
        size: searchParams.get('size'),
        barcode: searchParams.get('barcode')
      });
    }

    if (resolvedParams.id && resolvedParams.id !== 'test') {
      fetchProduct();
    } else if (resolvedParams.id === 'test') {
      // Mock test product data
      setProduct({
        id: 1,
        product_name: 'Test Product',
        product_description: 'This is a sample product for testing the barcode functionality',
        product_sku: 'TEST001',
        product_category: 'Test Category',
        product_sub_category: 'Test Subcategory',
        product_size: '{"size":"M","quantity":5}',
        product_color: 'Blue',
        product_material: 'Cotton',
        product_brand: 'Test Brand',
        product_country: 'Test Country',
        product_status: 'Active',
        product_qty: 100,
        wash_care: 'Machine wash cold',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        batch_numbers: ['BATCH001', 'BATCH02'],
        cost_incurred: 1500.50,
        weaver_challan_numbers: ['WC001', 'WC002'],
        stitching_challan_numbers: ['SC001', 'SC002'],
        associated_data: {
          stitching_challans: [
            {
              id: 1,
              challan_no: 'SC001',
              date: new Date().toISOString(),
              batch_number: ['BATCH001'],
              quality: 'Premium',
              quantity: 100,
              product_size: [{size: 'S', quantity: 20}, {size: 'M', quantity: 30}, {size: 'L', quantity: 50}]
            },
            {
              id: 2,
              challan_no: 'SC002',
              date: new Date().toISOString(),
              batch_number: ['BATCH02'],
              quality: 'Premium',
              quantity: 80,
              product_size: [{size: 'XS', quantity: 10}, {size: 'XL', quantity: 15}]
            }
          ],
          weaver_challans: [
            {
              challan_no: 'WC001',
              batch_number: 'BATCH001',
              quality_details: { quality_name: 'Premium', rate: 15.50 },
              vendor_amount: 1500.50
            }
          ]
        }
      });
      setLoading(false);
    }
  }, [resolvedParams.id]);

  // Find specific size information if size parameter exists
 const selectedSizeInfo = product?.associated_data?.stitching_challans?.flatMap((challan: IsteachingChallan) => 
    Array.isArray(challan.product_size) ? challan.product_size : []
  ).find((sizeObj: { size: string; quantity: number }) => urlParams.size && sizeObj.size === urlParams.size);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Product not found'}</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-90">Product Details</h1>
              <p className="text-gray-600 mt-1">
                View product information and specifications
              </p>
            </div>
          </div>
        </div>

        {/* Size-specific information banner if size parameter exists */}
        {urlParams.size && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800">Barcode Information</h2>
            <p className="text-blue-700">
              You accessed this page via a barcode for <span className="font-bold">Size {urlParams.size}</span>
              {urlParams.barcode && ` (Barcode #${urlParams.barcode})`}
            </p>
            {selectedSizeInfo && (
              <p className="mt-2 text-blue-700">
                Available quantity for Size {selectedSizeInfo.size}: <span className="font-semibold">{selectedSizeInfo.quantity} pcs</span>
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                {product.product_image ? (
                  <Image
                    src={product.product_image}
                    alt={product.product_name}
                    width={300}
                    height={300}
                    className="rounded-lg object-cover w-full h-full"
                  />
                ) : (
                  <div className="text-gray-40 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4" />
                    <p>No image available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Product details and specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Product Name</label>
                    <p className="text-lg font-semibold">{product.product_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">SKU</label>
                    <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {product.product_sku}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      {product.product_status === 'Active' ? (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700">Inactive</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <p className="text-lg">{product.product_qty || 0} units</p>
                  </div>
                
                {product.product_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="text-gray-600 mt-1">{product.product_description}</p>
                  </div>
                  
                )}

                </div>
              </CardContent>
            </Card>

            {/* Product Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Product specifications and attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Category</label>
                    <p className="text-gray-900">{product.product_category || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Sub-Category</label>
                    <p className="text-gray-900">{product.product_sub_category || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Size</label>
                    <p className="text-gray-900">{product.product_size || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Color</label>
                    <p className="text-gray-900">{product.product_color || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Material</label>
                    <p className="text-gray-90">{product.product_material || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Brand</label>
                    <p className="text-gray-900">{product.product_brand}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Country</label>
                    <p className="text-gray-900">{product.product_country}</p>
                  </div>
                
                {product.wash_care && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700">Wash Care Instructions</label>
                    <p className="text-gray-60 mt-1">{product.wash_care}</p>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>
            
            {/* Additional Product Information */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Extended product details and tracking information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Batch Numbers */}
                {product.batch_numbers && product.batch_numbers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Batch Numbers</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.batch_numbers.map((batch, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {batch}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Cost Incurred */}
                {product.cost_incurred !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cost Incurred</label>
                    <p className="text-gray-900 font-semibold">₹{product.cost_incurred.toFixed(2)}</p>
                  </div>
                )}
                
                {/* Weaver Challan Numbers */}
                {product.weaver_challan_numbers && product.weaver_challan_numbers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Associated Weaver Challan Numbers</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.weaver_challan_numbers.map((challan, index) => (
                        <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                          {challan}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Stitching Challan Numbers */}
                {product.stitching_challan_numbers && product.stitching_challan_numbers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Associated Stitching Challan Numbers</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {product.stitching_challan_numbers.map((challan, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          {challan}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Sizes - formatted more intuitively */}
                {product.associated_data?.stitching_challans && product.associated_data.stitching_challans.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Available Sizes & Quantities</label>
                    <div className="mt-2">
                      {product.associated_data.stitching_challans.map((challan: IsteachingChallan, index: number) => {
                        // Ensure challan.product_size is an array before filtering
                        const challanSizes = Array.isArray(challan.product_size) ? challan.product_size : [];
                        
                        // Filter sizes based on URL parameter if it exists
                        const sizesToShow = urlParams.size
                          ? challanSizes.filter((sizeObj: { size: string; quantity: number }) => sizeObj.size === urlParams.size)
                          : challanSizes;
                        
                        if (!sizesToShow || sizesToShow.length === 0) return null;
                        
                        return (
                          <div key={index} className="mb-3">
                            <p className="text-sm text-gray-600 mb-1">From Stitching Challan: {challan.challan_no}</p>
                            <div className="flex flex-wrap gap-2">
                              {sizesToShow.map((sizeObj: { size: string; quantity: number }, sizeIndex: number) => (
                                <span key={sizeIndex} className={`bg-gray-100 text-gray-800 px-3 py-1 rounded-md ${urlParams.size === sizeObj.size ? 'ring-2 ring-blue-500' : ''}`}>
                                  {sizeObj.size}: {sizeObj.quantity} pcs
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
                <CardDescription>Product creation and modification details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created At</label>
                    <p className="text-gray-900">{formatDate(product.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-90">{formatDate(product.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}