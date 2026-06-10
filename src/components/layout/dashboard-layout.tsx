"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SidebarNav } from "./sidebar-nav"
import { UserNav } from "./user-nav"
import { Breadcrumb } from "./breadcrumb"
import { ProfileSync } from "./profile-sync"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ProfileSync />
      <SidebarNav />
      <SidebarInset className="min-w-0 flex flex-col h-svh">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Breadcrumb />
          </div>
          <UserNav />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8 min-w-0 w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
