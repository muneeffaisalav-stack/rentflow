
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Receipt, Clock, Loader2, MessageCircle, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, doc } from "firebase/firestore"
import { Property, Tenant, Invoice, User as UserProfile } from "@/lib/types"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])
  const { data: profile } = useDoc<UserProfile>(userDocRef)

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
    const upiInfo = profile?.upiId ? ` via UPI (${profile.upiId})` : '';
    const message = encodeURIComponent(`Hi ${tenant.name}, a reminder for your rent of ₹${invoice.amount} for ${invoice.month}. Please settle this${upiInfo} at your earliest convenience. Thank you!`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const isLoading = pLoading || tLoading || iLoading

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="animate-spin size-10 text-primary" />
          <p className="text-muted-foreground font-medium">Synchronizing Portfolio Data...</p>
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
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-3">
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
                  Active in portfolio
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="font-headline">Recent Activity</CardTitle>
              <CardDescription>Latest invoice statuses and billing history.</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                  <Receipt className="size-12 mx-auto opacity-10 mb-2" />
                  <p>No billing activity found. Generating your first invoice...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {invoices.slice(0, 8).map((invoice) => {
                    const tenant = tenants.find(t => t.id === invoice.tenantId)
                    return (
                      <div key={invoice.id} className="flex items-center justify-between group p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {tenant?.name.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{tenant?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{invoice.month}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">₹{invoice.amount.toLocaleString()}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
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
              <div className="flex gap-3 mt-6">
                <Link href="/invoices" className="flex-1">
                  <Button className="w-full" variant="outline">View All Invoices</Button>
                </Link>
                <Link href="/reports" className="flex-1">
                  <Button className="w-full" variant="secondary">In-depth Reports</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 shadow-sm">
            <CardHeader className="bg-amber-50/50">
              <CardTitle className="font-headline text-amber-900 flex items-center gap-2">
                <MessageCircle className="size-5 text-amber-600" />
                Smart Reminders
              </CardTitle>
              <CardDescription className="text-amber-700/70">Proactive follow-ups for pending rent.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {needsReminder.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm flex flex-col items-center gap-2">
                  <CheckCircle2 className="size-8 text-emerald-500 opacity-20" />
                  <p>All caught up! No reminders needed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {needsReminder.slice(0, 6).map(({ tenant, invoice }) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-all shadow-sm">
                      <div>
                        <p className="text-sm font-bold">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">₹{invoice.amount.toLocaleString()} ({invoice.month})</p>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                        onClick={() => handleWhatsAppReminder(tenant, invoice)}
                        title="Send Reminder"
                      >
                        <MessageCircle className="size-5" />
                      </Button>
                    </div>
                  ))}
                  {needsReminder.length > 6 && (
                    <p className="text-[10px] text-center text-muted-foreground">
                      + {needsReminder.length - 6} more pending items
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
