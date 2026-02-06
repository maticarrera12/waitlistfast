import React from 'react'
import { SidebarProvider } from './contexts/sidebar-context'
import AppMainSidebar from './_components/app-main-sidebar'

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppMainSidebar />
        <main className="flex-1 transition-all duration-300 p-6 md:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

export default AppLayout