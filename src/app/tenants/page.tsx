
"use client"

import { useState } from "react"
import Link from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Phone,
  Building,
  Loader2,
  Mail,
  Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc } from "firebase/firestore"
import { Tenant, Property } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function TenantsPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "properties"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: properties } = useCollection<Property>(propertiesQuery)

  const tenantsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "tenants"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: tenants, loading } = useCollection<Tenant>(tenantsQuery)

  const handleAddTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const tenantData = {
      name: formData.get("name") as string,
      phone: formData.get("phone") as string,
      rentAmount: Number(formData.get("rent")),
      dueDate: Number(formData.get("dueDate")),
      upiId: formData.get("upi") as string,
      propertyId: formData.get("propertyId") as string,
      landlordId: user.uid,
      status: 'active',
    }

    addDoc(collection(db, "tenants"), tenantData)
      .then(() => {
        setIsDialogOpen(false)
        setIsSubmitting(false)
        toast({ title: "Tenant Added", description: `${tenantData.name} has been successfully registered.` })
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: "tenants",
          operation: "create",
          requestResourceData: tenantData,
        })
        errorEmitter.emit("permission-error", permissionError)
        setIsSubmitting(false)
      })
  }

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.phone.includes(searchTerm)
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Tenants</h2>
            <p className="text-muted-foreground">Manage tenant records and communication.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 self-start md:self-auto">
                <Plus className="size-4" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddTenant}>
                <DialogHeader>
                  <DialogTitle>Register New Tenant</DialogTitle>
                  <DialogDescription>
                    Onboard a new tenant to one of your properties.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="propertyId">Property</Label>
                    <Select name="propertyId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map(p => (
                          <SelectItem key={p.id} value={p.id!}>{p.propertyName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tenant Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" name="phone" placeholder="+91..." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rent">Monthly Rent (₹)</Label>
                      <Input id="rent" name="rent" type="number" placeholder="25000" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Due Date (Day of Month)</Label>
                      <Input id="dueDate" name="dueDate" type="number" min="1" max="31" placeholder="5" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="upi">UPI ID</Label>
                      <Input id="upi" name="upi" placeholder="name@upi" required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Tenant
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-headline">Tenant Directory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tenants..." 
                    className="pl-8 w-[250px] bg-muted/50"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground">
                No tenants found. Add your first tenant to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Rent Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => {
                    const property = properties.find(p => p.id === tenant.propertyId)
                    return (
                      <TableRow key={tenant.id} className="group transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold">{tenant.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="size-3" /> {tenant.phone}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building className="size-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{property?.propertyName || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-bold">₹{tenant.rentAmount.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">Due: Day {tenant.dueDate}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/tenants/${tenant.id}`}>
                              <Button variant="ghost" size="icon" title="View details">
                                <Eye className="size-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="icon" title="Send reminder">
                              <Mail className="size-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/tenants/${tenant.id}`}>View Profile</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit Record</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">Archive Tenant</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
    </DashboardLayout>
  )
}
