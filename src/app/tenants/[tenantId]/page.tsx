
"use client"

import { use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { Tenant, Property, Invoice } from "@/lib/types"

export default function TenantDetailsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params)
  const db = useFirestore()

  const tenantRef = useMemoFirebase(() => doc(db, "tenants", tenantId), [db, tenantId])
  const { data: tenant, loading: tLoading } = useDoc<Tenant>(tenantRef)

  const propertyRef = useMemoFirebase(() => {
    if (!tenant) return null
    return doc(db, "properties", tenant.propertyId)
  }, [db, tenant])
  const { data: property, loading: pLoading } = useDoc<Property>(propertyRef)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !tenantId) return null
    return query(
      collection(db, "invoices"),
      where("tenantId", "==", tenantId),
      orderBy("createdAt", "desc")
    )
  }, [db, tenantId])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  if (tLoading || pLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!tenant) {
    return (
      <DashboardLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold">Tenant not found</h2>
          <Link href="/tenants">
            <Button variant="link" className="mt-4">Back to Tenants</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const paidInvoices = invoices.filter(i => i.status === 'paid')
  const totalPaid = paidInvoices.reduce((sum, i) => sum + i.amount, 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tenants">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">{tenant.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>{tenant.status}</Badge>
              <span className="text-muted-foreground text-sm">Tenant since {new Date(tenant.id).toLocaleDateString() === 'Invalid Date' ? 'Recently' : new Date(tenant.id).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Information Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Phone className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Phone</p>
                    <p className="font-medium">{tenant.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CreditCard className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">UPI ID</p>
                    <p className="font-medium">{tenant.upiId}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <MapPin className="size-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Property</p>
                    <p className="font-medium">{property?.propertyName || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate w-40">{property?.address}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Calendar className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Rent Cycle</p>
                    <p className="font-medium">₹{tenant.rentAmount.toLocaleString()} / Month</p>
                    <p className="text-xs text-muted-foreground">Due: Day {tenant.dueDate} of month</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-headline">Stats Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-sm font-medium text-slate-500">Total Rent Paid</p>
                <p className="text-2xl font-bold mt-1">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-xs font-medium text-emerald-600">Settled</p>
                  <p className="text-lg font-bold">{paidInvoices.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <p className="text-xs font-medium text-rose-600">Overdue</p>
                  <p className="text-lg font-bold">{overdueCount}</p>
                </div>
              </div>
              <Button className="w-full" variant="outline">Message Tenant</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Payment History</CardTitle>
            <CardDescription>Recent billing cycles and status for {tenant.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            {iLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No payment history found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Billing Month</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.month}</TableCell>
                      <TableCell className="font-bold">₹{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'overdue' ? 'destructive' : 'secondary'
                        }>
                          <div className="flex items-center gap-1">
                            {invoice.status === 'paid' && <CheckCircle2 className="size-3" />}
                            {invoice.status === 'overdue' && <AlertCircle className="size-3" />}
                            {invoice.status === 'pending' && <Clock className="size-3" />}
                            {invoice.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Download PDF</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
