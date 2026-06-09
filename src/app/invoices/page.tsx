
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, CheckCircle2, Loader2, Plus, Search, MessageCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, updateDoc, doc, addDoc } from "firebase/firestore"
import { Invoice, Tenant, Property } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

function InvoicesContent() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const searchParams = useSearchParams()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsDialogOpen(true)
    }
  }, [searchParams])

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "properties"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: properties } = useCollection<Property>(propertiesQuery)

  const tenantsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "tenants"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: tenants } = useCollection<Tenant>(tenantsQuery)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "invoices"), 
      where("landlordId", "==", user.uid)
    )
  }, [db, user])
  const { data: invoices, loading } = useCollection<Invoice>(invoicesQuery)

  const markAsPaid = (invoiceId: string) => {
    if (!db) return
    const invoiceRef = doc(db, "invoices", invoiceId)
    
    updateDoc(invoiceRef, {
      status: 'paid',
      paymentDate: new Date().toISOString()
    })
    .then(() => {
      toast({
        title: "Invoice Updated",
        description: "Invoice marked as paid successfully."
      })
    })
    .catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: `invoices/${invoiceId}`,
        operation: 'update',
        requestResourceData: { status: 'paid' }
      })
      errorEmitter.emit('permission-error', permissionError)
    })
  }

  const handleWhatsAppReminder = (invoice: Invoice) => {
    const tenant = tenants.find(t => t.id === invoice.tenantId);
    if (!tenant) return;
    const phone = tenant.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${tenant.name}, your rent for ${invoice.month} is ${invoice.status}. Amount: ₹${invoice.amount}. Please settle this at your earliest convenience. Thank you!`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const tenantId = formData.get("tenantId") as string
    const tenant = tenants.find(t => t.id === tenantId)
    
    if (!tenant) {
       setIsSubmitting(false)
       return
    }

    const invoiceData = {
      tenantId: tenantId,
      propertyId: tenant.propertyId,
      landlordId: user.uid,
      month: formData.get("month") as string,
      amount: Number(formData.get("amount")),
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    addDoc(collection(db, "invoices"), invoiceData)
      .then(() => {
        setIsDialogOpen(false)
        setIsSubmitting(false)
        toast({ title: "Invoice Generated", description: "The rent invoice has been created successfully." })
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: "invoices",
          operation: "create",
          requestResourceData: invoiceData,
        })
        errorEmitter.emit("permission-error", permissionError)
        setIsSubmitting(false)
      })
  }

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "There are no invoices to export."
      })
      return
    }

    const headers = ["Tenant", "Property", "Month", "Amount (INR)", "Status", "Payment Date", "Created At"];
    const rows = filteredInvoices.map(invoice => {
      const tenant = tenants.find(t => t.id === invoice.tenantId);
      const property = properties.find(p => p.id === invoice.propertyId);
      return [
        `"${tenant?.name || 'Unknown'}"`,
        `"${property?.propertyName || 'Unknown'}"`,
        `"${invoice.month}"`,
        invoice.amount,
        `"${invoice.status}"`,
        `"${invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : '-'}"`,
        `"${new Date(invoice.createdAt).toLocaleDateString()}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rentflow_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: "Your billing data has been downloaded as CSV."
    })
  };

  const filteredInvoices = invoices
    .filter(invoice => {
      const tenant = tenants.find(t => t.id === invoice.tenantId)
      return tenant?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             invoice.month.includes(searchTerm)
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const pendingCount = invoices.filter(i => i.status === 'pending').length
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground">Monitor and manage rental payments across your portfolio.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddInvoice}>
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Generate a manual rent invoice for a registered tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="tenantId">Select Tenant</Label>
                    <Select name="tenantId" required onValueChange={(val) => {
                      const t = tenants.find(t => t.id === val);
                      if (t) {
                        const amountInput = document.getElementById('amount') as HTMLInputElement;
                        if (amountInput) amountInput.value = t.rentAmount.toString();
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose tenant" />
                      </SelectTrigger>
                      <SelectContent>
                        {tenants.map(t => (
                          <SelectItem key={t.id} value={t.id!}>{t.name} ({properties.find(p => p.id === t.propertyId)?.propertyName})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="month">Billing Month</Label>
                      <Input id="month" name="month" type="month" required defaultValue={new Date().toISOString().slice(0, 7)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Rent Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" placeholder="0" required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate Invoice
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2 hidden md:flex" onClick={handleExportCSV}>
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-amber-50 border-amber-200 shadow-none">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-amber-700 uppercase tracking-tight">Pending Invoices</p>
                 <p className="text-3xl font-bold text-amber-900 mt-1">{pendingCount}</p>
               </div>
               <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calendar className="size-6 text-amber-600" />
               </div>
             </div>
           </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200 shadow-none">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-emerald-700 uppercase tracking-tight">Paid this month</p>
                 <p className="text-3xl font-bold text-emerald-900 mt-1">{paidCount}</p>
               </div>
               <div className="size-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="size-6 text-emerald-600" />
               </div>
             </div>
           </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200 shadow-none">
           <CardContent className="pt-6">
             <div className="flex items-center justify-between">
               <div>
                 <p className="text-sm font-medium text-rose-700 uppercase tracking-tight">Overdue Payments</p>
                 <p className="text-3xl font-bold text-rose-900 mt-1">{overdueCount}</p>
               </div>
               <div className="size-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <MessageCircle className="size-6 text-rose-600" />
               </div>
             </div>
           </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
           <div className="flex items-center justify-between">
              <CardTitle className="font-headline">Billing History</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by tenant..." 
                  className="pl-9 w-[280px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-primary size-8" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No invoices found. {searchTerm ? "Try a different search term." : "Start by creating your first invoice."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const tenant = tenants.find(t => t.id === invoice.tenantId)
                  const property = properties.find(p => p.id === invoice.propertyId)
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{tenant?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-sm">{property?.propertyName || 'Unknown'}</TableCell>
                      <TableCell className="text-sm font-medium">{invoice.month}</TableCell>
                      <TableCell className="font-bold">₹{invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          className="capitalize"
                          variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.status !== 'paid' && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-primary hover:bg-primary/5"
                                onClick={() => markAsPaid(invoice.id!)}
                              >
                                Mark Paid
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                title="Send WhatsApp reminder"
                                onClick={() => handleWhatsAppReminder(invoice)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <MessageCircle className="size-4" />
                              </Button>
                            </>
                          )}
                          {invoice.status === 'paid' && (
                            <span className="text-xs text-muted-foreground font-medium flex items-center justify-end gap-1">
                              <CheckCircle2 className="size-3" /> Settled
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="animate-spin size-10 text-primary" />
          <p className="text-muted-foreground font-medium">Loading Invoices...</p>
        </div>
      }>
        <InvoicesContent />
      </Suspense>
    </DashboardLayout>
  )
}
