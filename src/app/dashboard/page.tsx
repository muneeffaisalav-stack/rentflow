"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Receipt, Clock, ArrowUpRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Property, Tenant, Invoice } from "@/lib/types"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "properties"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: properties, loading: pLoading } = useCollection<Property>(propertiesQuery)

  const tenantsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "tenants"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: tenants, loading: tLoading } = useCollection<Tenant>(tenantsQuery)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "invoices"), where("propertyId", "in", properties.length > 0 ? properties.map(p => p.id) : ["none"]))
  }, [db, user, properties])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  const totalPendingRent = invoices
    .filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + i.amount, 0)
  const totalCollectedRent = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.amount, 0)

  const stats = [
    { title: "Total Properties", value: properties.length, icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Total Tenants", value: tenants.length, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Pending Rent", value: `₹${totalPendingRent.toLocaleString()}`, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Collected Rent", value: `₹${totalCollectedRent.toLocaleString()}`, icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50" },
  ]

  if (pLoading || tLoading || iLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Financial Overview</h2>
          <p className="text-muted-foreground">Real-time performance metrics of your property portfolio.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.bg} p-2 rounded-lg`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-500 font-medium inline-flex items-center">
                    +4.3% <ArrowUpRight className="size-3 ml-0.5" />
                  </span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Recent Activity</CardTitle>
              <CardDescription>Track the latest payment activities and management events.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No recent invoice activity.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoices.slice(0, 4).map((invoice) => {
                    const tenant = tenants.find(t => t.id === invoice.tenantId)
                    return (
                      <div key={invoice.id} className="flex items-center justify-between group p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs uppercase">
                            {tenant?.name.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tenant?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{invoice.month}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">₹{invoice.amount.toLocaleString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                            invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                            invoice.status === 'overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <Link href="/invoices">
                <Button className="w-full mt-6" variant="outline">View All Invoices</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
