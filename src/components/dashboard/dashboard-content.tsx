'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database } from '@/types/database'
import Link from 'next/link'
import { 
  Package, 
  Book, 
  Factory, 
  ShoppingCart, 
  TrendingUp,
  Calendar,
  Sun
} from 'lucide-react'

type Profile = Database['public']['Tables']['profiles']['Row']
type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'] & {
  ledgers?: {
    business_name: string
    contact_person_name: string | null
  } | null
}
type WeaverChallan = Database['public']['Tables']['weaver_challans']['Row'] & {
  ledgers?: {
    business_name: string
    contact_person_name: string | null
  } | null
}

interface DashboardData {
  stats: {
    todayOrders: number
    totalOrders: number
    totalProducts: number
    activeLedgers: number
    productionBatches: number
  }
  recentPurchaseOrders: PurchaseOrder[]
  recentWeaverChallans: WeaverChallan[]
}

interface DashboardContentProps {
  profile: Profile
  dashboardData: DashboardData
}

export function DashboardContent({ profile, dashboardData }: DashboardContentProps) {
  const stats = [
    {
      title: "Today's Orders",
      value: dashboardData.stats.todayOrders.toLocaleString(),
      change: "Purchase Orders + Weaver Challans",
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Total Orders",
      value: dashboardData.stats.totalOrders.toLocaleString(),
      change: "All time orders",
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-emerald-600 bg-emerald-100"
    },
    {
      title: "Active Products",
      value: dashboardData.stats.totalProducts.toLocaleString(),
      change: "Products in inventory",
      icon: <Package className="h-5 w-5" />,
      color: "text-blue-600 bg-blue-100"
    },
    {
      title: "Active Ledgers",
      value: dashboardData.stats.activeLedgers.toLocaleString(),
      change: "Business partners",
      icon: <Book className="h-5 w-5" />,
      color: "text-purple-600 bg-purple-100"
    }
  ]

  const quickActions = [
    {
      title: "Create Product",
      description: "Add new product to inventory",
      href: "/dashboard/inventory/products/create",
      icon: <Package className="h-8 w-8" />,
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100"
    },
    {
      title: "New Ledger",
      description: "Create business ledger entry",
      href: "/dashboard/ledger/create",
      icon: <Book className="h-8 w-8" />,
      color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
    },
    {
      title: "Weaver Challan",
      description: "Start production process",
      href: "/dashboard/production/weaver-challan",
      icon: <Factory className="h-8 w-8" />,
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100"
    },
    {
      title: "Purchase Order",
      description: "Create new purchase order",
      href: "/dashboard/purchase/create",
      icon: <ShoppingCart className="h-8 w-8" />,
      color: "text-orange-600 bg-orange-50 hover:bg-orange-100"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Weather Card */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Ahmedabad, India</h3>
              <p className="text-blue-100">Today&apos;s Weather</p>
            </div>
            <div className="flex items-center space-x-4">
              <Sun className="h-8 w-8" />
              <div className="text-right">
                <div className="text-3xl font-bold">31°C</div>
                <div className="text-blue-100">Sunny</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-2 rounded-full ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className={`inline-flex p-3 rounded-full ${action.color} mb-4`}>
                    {action.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchase Orders</CardTitle>
            <CardDescription>Latest purchase order activity in your system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentPurchaseOrders.length > 0 ? (
                dashboardData.recentPurchaseOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{order.po_number}</div>
                      <div className="text-sm text-gray-600">
                        {order.ledgers?.business_name || order.supplier_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(order.po_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{order.total_amount.toLocaleString()}</div>
                      <Badge 
                        variant={
                          order.status === 'Completed' ? 'default' :
                          order.status === 'Confirmed' ? 'secondary' :
                          order.status === 'Sent' ? 'outline' :
                          'destructive'
                        }
                        className="text-xs"
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No purchase orders yet</p>
                  <Link 
                    href="/dashboard/purchase/create" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Create your first purchase order
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Weaver Challans</CardTitle>
            <CardDescription>Current production batches and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentWeaverChallans.length > 0 ? (
                dashboardData.recentWeaverChallans.map((challan) => (
                  <div key={challan.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{challan.challan_no}</div>
                        <div className="text-sm text-gray-600">
                          {challan.ledgers?.business_name || challan.ms_party_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Batch: {challan.batch_number}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(challan.challan_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {challan.total_grey_mtr} meters
                        </div>
                        <div className="text-sm text-gray-600">
                          {challan.taka} taka
                        </div>
                      </div>
                    </div>
                    {challan.transport_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        Transport: {challan.transport_name}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Factory className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No weaver challans yet</p>
                  <Link 
                    href="/dashboard/production/weaver-challan" 
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Create your first weaver challan
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
