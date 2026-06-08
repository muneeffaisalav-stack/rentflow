
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { mockInvoices, mockTenants, mockProperties } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { Calendar, Download, Receipt, Send, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function InvoicesPage() {
  const { toast } = useToast()

  const markAsPaid = (id: string) => {
    toast({
      title: "Invoice Updated",
      description: `Invoice ${id} marked as paid successfully.`
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">Monitor and manage rental payments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button className="gap-2">
              <Receipt className="size-4" />
              Generate All
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-amber-50 border-amber-200">
             <CardContent className="pt-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm font-medium text-amber-700">Pending Invoices</p>
                   <p className="text-3xl font-bold text-amber-900">{mockInvoices.filter(i => i.status === 'pending').length}</p>
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
                   <p className="text-3xl font-bold text-emerald-900">{mockInvoices.filter(i => i.status === 'paid').length}</p>
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
                   <p className="text-3xl font-bold text-rose-900">{mockInvoices.filter(i => i.status === 'overdue').length}</p>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInvoices.map((invoice) => {
                  const tenant = mockTenants.find(t => t.id === invoice.tenantId)
                  const property = mockProperties.find(p => p.id === invoice.propertyId)
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground uppercase">{invoice.id}</TableCell>
                      <TableCell className="font-medium">{tenant?.name}</TableCell>
                      <TableCell className="text-sm">{property?.propertyName}</TableCell>
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
                            onClick={() => markAsPaid(invoice.id)}
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
