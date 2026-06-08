
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Properties", icon: Building2, href: "/properties" },
  { title: "Tenants", icon: Users, href: "/tenants" },
  { title: "Invoices", icon: FileText, href: "/invoices" },
  { title: "Reports", icon: BarChart3, href: "/reports" },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="size-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Building2 className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-headline font-bold leading-tight tracking-tight">RentFlow</h1>
            <p className="text-xs text-muted-foreground">Property Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <div className="px-4 py-2">
           <Button className="w-full justify-start gap-2 shadow-sm" variant="default">
             <Plus className="size-4" />
             <span>Quick Invoice</span>
           </Button>
        </div>
        <SidebarMenu className="mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 transition-colors",
                      isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("size-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground">
                <Settings className="size-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-destructive transition-colors">
                <LogOut className="size-5" />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
