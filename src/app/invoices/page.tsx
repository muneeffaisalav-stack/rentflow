
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Receipt, Send, CheckCircle2, Loader2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore"
import { Invoice, Tenant, Property } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function InvoicesPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch all necessary data
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
    // Get invoices for all properties owned by this landlord
    return query(collection(db, "invoices"), where("propertyId", "in", properties.length > 0 ? properties.map(p => p.id) : ["none"]))
  }, [db, user, properties])
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

  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const tenantId = formData.get("tenantId") as string
    const tenant = tenants.find(t => t.id === tenantId)
    
    if (!tenant) return

    const invoiceData = {
      tenantId: tenantId,
      propertyId: tenant.propertyId,
      month: formData.get("month") as string, // e.g., "2024-03"
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

  const pendingCount = invoices.filter(i => i.status === 'pending').length
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">Monitor and manage rental payments.</p>
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
                      Generate a manual rent invoice for a tenant.
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
            <Button variant="outline" className="gap-2 hidden md:flex">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-amber-50 border-amber-200">
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-amber-700">Pending Invoices</p>
                   <p className="text-3xl font-bold text-amber-900">{pendingCount}</p>
                 </div>
                 <Calendar className="size-8 text-amber-300" />
               </div>
             </CardContent>
          </Card>
          <Card className="bg-emerald-50 border-emerald-200">
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-emerald-700">Paid this month</p>
                   <p className="text-3xl font-bold text-emerald-900">{paidCount}</p>
                 </div>
                 <CheckCircle2 className="size-8 text-emerald-300" />
               </div>
             </CardContent>
          </Card>
          <Card className="bg-rose-50 border-rose-200">
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-rose-700">Overdue Payments</p>
                   <p className="text-3xl font-bold text-rose-900">{overdueCount}</p>
                 </div>
                 <Send className="size-8 text-rose-300" />
               </div>
             </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Recent Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                No invoices generated yet.
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
                  {invoices.map((invoice) => {
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
                          {invoice.status !== 'paid' ? (
                            <Button 
                              variant="link" 
                              className="text-primary p-0 h-auto"
                              onClick={() => markAsPaid(invoice.id!)}
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <Button variant="link" className="text-muted-foreground p-0 h-auto opacity-50 pointer-events-none">
                              Completed
                            </Button>
                          )}
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
    </DashboardLayout>
  )
}
