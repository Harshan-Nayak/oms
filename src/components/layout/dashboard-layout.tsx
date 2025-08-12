'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface DashboardLayoutProps {
  children: React.ReactNode
  profile: Profile
}

export function DashboardLayout({ children, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        profile={profile} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          profile={profile}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
