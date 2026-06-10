
"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageCircle,
  Download,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
import { Tenant, Property, Invoice } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function TenantDetailsPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = use(params)
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const router = useRouter()

  const tenantRef = useMemoFirebase(() => doc(db, "tenants", tenantId), [db, tenantId])
  const { data: tenant, loading: tLoading } = useDoc<Tenant>(tenantRef)

  const propertyRef = useMemoFirebase(() => {
    if (!tenant) return null
    return doc(db, "properties", tenant.propertyId)
  }, [db, tenant])
  const { data: property, loading: pLoading } = useDoc<Property>(propertyRef)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !tenantId || !user) return null
    return query(
      collection(db, "invoices"),
      where("tenantId", "==", tenantId),
      where("landlordId", "==", user.uid)
    )
  }, [db, tenantId, user])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  const handleWhatsAppMessage = () => {
    if (!tenant) return;
    const phone = tenant.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${tenant.name}, reaching out regarding the property at ${property?.propertyName || 'your rental'}.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleDeleteTenant = async () => {
    if (!db || !user || !tenantId) return

    deleteDoc(doc(db, "tenants", tenantId))
      .then(() => {
        toast({
          title: "Tenant Removed",
          description: "Record has been permanently deleted from the system.",
        })
        router.push("/tenants")
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `tenants/${tenantId}`,
          operation: "delete",
        })
        errorEmitter.emit("permission-error", permissionError)
      })
  }

  const handleDownloadInvoice = (invoice: Invoice) => {
    if (!tenant || !property) return;
    
    const content = `
RENTFLOW PAYMENT RECORD
-----------------------
Invoice ID: ${invoice.id}
Property: ${property.propertyName}
Tenant: ${tenant.name}
Billing Month: ${invoice.month}
Amount: INR ${invoice.amount.toLocaleString()}
Status: ${invoice.status.toUpperCase()}
Payment Date: ${invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : 'N/A'}
Generated On: ${new Date().toLocaleString()}

Thank you for choosing RentFlow.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `RentFlow_Receipt_${invoice.month}_${tenant.name.replace(/\s+/g, '_')}.txt`);
    link.click();
    
    toast({
      title: "Receipt Downloaded",
      description: "Payment record saved to your device."
    });
  }

  if (tLoading || pLoading || !user) {
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

  const tenantSince = tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'Recently'

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <span className="text-muted-foreground text-sm">Tenant since {tenantSince}</span>
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2 self-start md:self-auto">
                <Trash2 className="size-4" />
                Remove Tenant
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently remove <strong>{tenant.name}</strong> from your records. This process cannot be undone and you will lose access to their profile and agreement history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <Button className="w-full gap-2" variant="outline" onClick={handleWhatsAppMessage}>
                <MessageCircle className="size-4 text-green-600" />
                Message Tenant
              </Button>
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
                        <Button variant="ghost" size="sm" className="gap-2" onClick={() => handleDownloadInvoice(invoice)}>
                          <Download className="size-4" /> Download
                        </Button>
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
