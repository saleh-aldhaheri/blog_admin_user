'use client'

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
      <main className="flex-1 min-h-screen bg-background">
        <Outlet />
      </main>
    </div>
  )
}