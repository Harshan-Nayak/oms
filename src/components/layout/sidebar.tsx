'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Database } from '@/types/database'
import { 
  LayoutDashboard, 
  Package, 
  Book, 
  Factory, 
  ShoppingCart, 
  Users,
  X,
  ChevronDown
} from 'lucide-react'
import { useState } from 'react'

type Profile = Database['public']['Tables']['profiles']['Row']

interface SidebarProps {
  profile: Profile
  isOpen: boolean
  onClose: () => void
}

interface MenuItem {
  title: string
  icon: React.ReactNode
  href?: string
  items?: {
    title: string
    href: string
  }[]
}

export function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['inventory'])

  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuTitle) 
        ? prev.filter(m => m !== menuTitle)
        : [...prev, menuTitle]
    )
  }

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: '/dashboard'
    },
    {
      title: 'Ledger',
      icon: <Book className="h-5 w-5" />,
      items: [
        { title: 'Create Ledger', href: '/dashboard/ledger/create' },
        { title: 'All Ledgers', href: '/dashboard/ledger/list' }
      ]
    },
    {
      title: 'Production',
      icon: <Factory className="h-5 w-5" />,
      items: [
        { title: 'Weaver Challan', href: '/dashboard/production/weaver-challan' },
        { title: 'Shorting Entry', href: '/dashboard/production/shorting-entry' },
        { title: 'Stitching  Challan', href: '/dashboard/production/isteaching-challan' },
        { title: 'Expense', href: '/dashboard/production/expense' },
        { title: 'Payment Voucher', href: '/dashboard/production/payment-voucher' }
      ]
    },
    {
      title: 'Inventory',
      icon: <Package className="h-5 w-5" />,
      items: [
        { title: 'Products', href: '/dashboard/inventory/products' }
      ]
    },
    {
      title: 'Purchase',
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        { title: 'Manage PO', href: '/dashboard/purchase/manage' },
        { title: 'Create PO', href: '/dashboard/purchase/create' }
      ]
    }
  ]

  // Add User Management only for Admin
  if (profile.user_role === 'Admin') {
    menuItems.push({
      title: 'User Manager',
      icon: <Users className="h-5 w-5" />,
      items: [
        { title: 'Manage Users', href: '/dashboard/users/manage' },
        { title: 'Create Users', href: '/dashboard/users/create' }
      ]
    })
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">Bhaktinandan</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => (
            <div key={item.title}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    pathname === item.href
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.title}</span>
                </Link>
              ) : (
                <div>
                  <button
                    onClick={() => toggleMenu(item.title)}
                    className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="flex items-center">
                      {item.icon}
                      <span className="ml-3">{item.title}</span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedMenus.includes(item.title) && "rotate-180"
                      )} 
                    />
                  </button>
                  {expandedMenus.includes(item.title) && item.items && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block px-3 py-2 text-sm rounded-md",
                            pathname === subItem.href
                              ? "bg-blue-100 text-blue-700"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          )}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}
