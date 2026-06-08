
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, CreditCard, ShieldCheck, Loader2, AlertCircle } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { Property, Tenant, Invoice, User } from "@/lib/types"
import { useProfile } from "@/hooks/use-profile"
import { redirect } from "next/navigation"

export default function AdminPage() {
  const { isAdmin, profile, loading: authLoading } = useProfile()
  const db = useFirestore()

  // Only attempt to create collection references if we are confirmed as an admin in the database
  // this avoids triggering permission errors before the role sync completes
  const canFetchAdminData = isAdmin && profile?.role === 'super-admin'

  const usersColl = useMemoFirebase(() => {
    if (!db || !canFetchAdminData) return null
    return collection(db, "users")
  }, [db, canFetchAdminData])

  const propsColl = useMemoFirebase(() => {
    if (!db || !canFetchAdminData) return null
    return collection(db, "properties")
  }, [db, canFetchAdminData])

  const tenantsColl = useMemoFirebase(() => {
    if (!db || !canFetchAdminData) return null
    return collection(db, "tenants")
  }, [db, canFetchAdminData])

  const invoicesColl = useMemoFirebase(() => {
    if (!db || !canFetchAdminData) return null
    return collection(db, "invoices")
  }, [db, canFetchAdminData])

  const { data: users, loading: uLoading } = useCollection<User>(usersColl)
  const { data: properties, loading: pLoading } = useCollection<Property>(propsColl)
  const { data: tenants, loading: tLoading } = useCollection<Tenant>(tenantsColl)
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesColl)

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!isAdmin) redirect("/dashboard")

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0)

  const landlords = users.filter(u => u.role === 'landlord')

  const stats = [
    { title: "Total Landlords", value: landlords.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Platform Assets", value: properties.length, icon: Building2, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Active Tenants", value: tenants.length, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Global Revenue", value: `₹${totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50" },
  ]

  const isLoadingData = uLoading || pLoading || tLoading || iLoading || !canFetchAdminData

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Platform Admin Overview</h2>
          <p className="text-muted-foreground">Comprehensive system-wide metrics and landlord activity.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
           <Card>
             <CardHeader>
               <CardTitle className="font-headline">Recent Landlords</CardTitle>
             </CardHeader>
             <CardContent>
               {isLoadingData ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
               ) : landlords.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-2">
                   <AlertCircle className="size-8 opacity-20" />
                   <p>No landlords registered yet.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {landlords.slice(0, 5).map(user => (
                     <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                       <div>
                         <p className="font-medium">{user.name}</p>
                         <p className="text-xs text-muted-foreground">{user.email}</p>
                       </div>
                       <span className="text-[10px] bg-slate-100 px-2 py-1 rounded">
                         {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                       </span>
                     </div>
                   ))}
                 </div>
               )}
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle className="font-headline">Global Collection Status</CardTitle>
             </CardHeader>
             <CardContent>
               {isLoadingData ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
               ) : (
                 <div className="space-y-4 pt-2">
                   <div className="flex justify-between text-sm items-center">
                     <span className="text-muted-foreground">Paid Invoices</span>
                     <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                       {invoices.filter(i => i.status === 'paid').length}
                     </span>
                   </div>
                   <div className="flex justify-between text-sm items-center">
                     <span className="text-muted-foreground">Pending Payments</span>
                     <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                       {invoices.filter(i => i.status === 'pending').length}
                     </span>
                   </div>
                   <div className="flex justify-between text-sm items-center">
                     <span className="text-muted-foreground">Overdue Receivables</span>
                     <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                       {invoices.filter(i => i.status === 'overdue').length}
                     </span>
                   </div>
                 </div>
               )}
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
