
"use client"

import { use } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Building2, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Loader2, 
  Receipt, 
  TrendingUp,
  UserPlus
} from "lucide-react"
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { Property, Tenant, Invoice } from "@/lib/types"

export default function PropertyDetailsPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params)
  const { user } = useUser()
  const db = useFirestore()

  const propertyRef = useMemoFirebase(() => doc(db, "properties", propertyId), [db, propertyId])
  const { data: property, loading: pLoading } = useDoc<Property>(propertyRef)

  const tenantsQuery = useMemoFirebase(() => {
    if (!db || !propertyId || !user) return null
    return query(
      collection(db, "tenants"), 
      where("propertyId", "==", propertyId),
      where("landlordId", "==", user.uid)
    )
  }, [db, propertyId, user])
  const { data: tenants, loading: tLoading } = useCollection<Tenant>(tenantsQuery)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !propertyId || !user) return null
    // Mandatory landlordId filter required by Security Rules
    return query(
      collection(db, "invoices"),
      where("propertyId", "==", propertyId),
      where("landlordId", "==", user.uid)
    )
  }, [db, propertyId, user])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  if (pLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!property) {
    return (
      <DashboardLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold font-headline">Property not found</h2>
          <p className="text-muted-foreground mt-2">The requested asset could not be located.</p>
          <Link href="/properties">
            <Button variant="link" className="mt-4">Back to Properties</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const pendingAmount = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0)
  const activeTenants = tenants.filter(t => t.status === 'active').length

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/properties">
              <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                <ArrowLeft className="size-4" />
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tight">{property.propertyName}</h2>
              <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                <MapPin className="size-3.5" />
                <span>{property.address}</span>
              </div>
            </div>
          </div>
          <Link href="/tenants">
            <Button className="gap-2">
              <UserPlus className="size-4" />
              Add Tenant
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Revenue History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalCollected.toLocaleString()}</div>
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="size-3" /> Lifetime collected
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTenants} / {tenants.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Occupancy rate: {tenants.length > 0 ? Math.round((activeTenants/tenants.length)*100) : 0}%</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-amber-100 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 uppercase tracking-wider">Outstanding Rent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-900">₹{pendingAmount.toLocaleString()}</div>
              <p className="text-xs text-amber-600 mt-1">Pending from {invoices.filter(i => i.status !== 'paid').length} cycles</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Tenant List</CardTitle>
              <CardDescription>All residents currently or previously assigned to this property.</CardDescription>
            </CardHeader>
            <CardContent>
              {tLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
              ) : tenants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  No tenants registered for this property yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Monthly Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {tenant.name.charAt(0)}
                            </div>
                            <span className="font-medium">{tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm">₹{tenant.rentAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/tenants/${tenant.id}`}>
                            <Button variant="ghost" size="sm">Profile</Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline">Recent Billing</CardTitle>
              <CardDescription>Latest payment records for this property.</CardDescription>
            </CardHeader>
            <CardContent>
              {iLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No billing history found.
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium">{invoice.month}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenants.find(t => t.id === invoice.tenantId)?.name || 'Tenant'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">₹{invoice.amount.toLocaleString()}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'outline'} className="text-[10px] h-4">
                          {invoice.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Link href="/invoices" className="block mt-4">
                    <Button variant="outline" className="w-full text-xs" size="sm">
                      <Receipt className="mr-2 size-3" /> View All Invoices
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
