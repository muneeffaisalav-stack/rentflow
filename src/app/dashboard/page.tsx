
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Receipt, Clock, ArrowUpRight, Loader2, MessageCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
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
    return query(
      collection(db, "invoices"), 
      where("landlordId", "==", user.uid),
      limit(50)
    )
  }, [db, user])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  const pendingInvoices = invoices.filter(i => i.status !== 'paid')
  const totalPendingRent = pendingInvoices.reduce((sum, i) => sum + i.amount, 0)
  const totalCollectedRent = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)

  // Identify tenants who need reminders (Pending or Overdue)
  const needsReminder = pendingInvoices.map(invoice => {
    const tenant = tenants.find(t => t.id === invoice.tenantId)
    return { invoice, tenant }
  }).filter(item => !!item.tenant)

  const stats = [
    { title: "Total Properties", value: properties.length, icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Total Tenants", value: tenants.length, icon: Users, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Pending Rent", value: `₹${totalPendingRent.toLocaleString()}`, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Collected Rent", value: `₹${totalCollectedRent.toLocaleString()}`, icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50" },
  ]

  const handleWhatsAppReminder = (tenant: Tenant, invoice: Invoice) => {
    const phone = tenant.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${tenant.name}, a reminder for your rent of ₹${invoice.amount} for ${invoice.month}. Please settle this via UPI at your earliest convenience. Thank you!`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Portfolio Overview</h2>
            <p className="text-muted-foreground">Real-time performance metrics and automated billing.</p>
          </div>
          {needsReminder.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 flex items-center gap-3 animate-pulse">
              <AlertCircle className="size-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">
                {needsReminder.length} payments require attention
              </p>
            </div>
          )}
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
                  Updated just now
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Recent Billing Activity</CardTitle>
              <CardDescription>The latest invoice statuses and payment records.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No recent activity found. Start by adding a property and a tenant.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoices.slice(0, 6).map((invoice) => {
                    const tenant = tenants.find(t => t.id === invoice.tenantId)
                    return (
                      <div key={invoice.id} className="flex items-center justify-between group p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
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

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Smart Reminders</CardTitle>
              <CardDescription>Follow up on pending payments.</CardDescription>
            </CardHeader>
            <CardContent>
              {needsReminder.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  All caught up! No pending reminders.
                </div>
              ) : (
                <div className="space-y-4">
                  {needsReminder.slice(0, 5).map(({ tenant, invoice }) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                      <div>
                        <p className="text-sm font-bold">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">₹{invoice.amount.toLocaleString()} ({invoice.month})</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={() => handleWhatsAppReminder(tenant, invoice)}
                      >
                        <MessageCircle className="size-5" />
                      </Button>
                    </div>
                  ))}
                  {needsReminder.length > 5 && (
                    <p className="text-[10px] text-center text-muted-foreground">
                      + {needsReminder.length - 5} more pending
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
