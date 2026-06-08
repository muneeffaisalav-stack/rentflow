
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  Plus,
  ShieldCheck,
  UserCog,
  Loader2
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
import { useAuth } from "@/firebase"
import { signOut } from "firebase/auth"
import { useToast } from "@/hooks/use-toast"
import { useProfile } from "@/hooks/use-profile"

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Properties", icon: Building2, href: "/properties" },
  { title: "Tenants", icon: Users, href: "/tenants" },
  { title: "Invoices", icon: FileText, href: "/invoices" },
  { title: "Reports", icon: BarChart3, href: "/reports" },
]

const adminItems = [
  { title: "Admin Overview", icon: ShieldCheck, href: "/admin" },
  { title: "User Management", icon: UserCog, href: "/admin/users" },
]

export function SidebarNav() {
  const pathname = usePathname()
  const auth = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { isAdmin, loading } = useProfile()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Signed Out",
        description: "Successfully logged out of your account.",
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      })
    }
  }

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
           <Link href="/invoices?action=new">
             <Button className="w-full justify-start gap-2 shadow-sm" variant="default">
               <Plus className="size-4" />
               <span>Quick Invoice</span>
             </Button>
           </Link>
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

        {loading ? (
          <div className="px-6 mt-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Checking access...</span>
          </div>
        ) : isAdmin && (
          <>
            <div className="px-6 mt-8 mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Controls</p>
            </div>
            <SidebarMenu>
              {adminItems.map((item) => {
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
          </>
        )}
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
            <SidebarMenuButton onClick={handleLogout} tooltip="Logout" className="w-full justify-start text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="size-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
