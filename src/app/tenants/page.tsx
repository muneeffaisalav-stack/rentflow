"use client"

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
  MessageSquare, 
  Phone,
  Building
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { mockTenants, mockProperties } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

export default function TenantsPage() {
  const { toast } = useToast()

  const handleSendReminder = (tenantId: string) => {
    const tenant = mockTenants.find(t => t.id === tenantId)
    if (!tenant) return

    // Simple simulation of sending a reminder
    toast({
      title: "Reminder Sent",
      description: `A rent reminder has been drafted for ${tenant.name}.`,
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Tenants</h2>
            <p className="text-muted-foreground">Manage tenant records and communication.</p>
          </div>
          <Button className="gap-2 self-start md:self-auto">
            <Plus className="size-4" />
            Add Tenant
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-headline">Tenant Directory</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search tenants..." 
                    className="pl-8 w-[250px] bg-muted/50"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                {mockTenants.map((tenant) => {
                  const property = mockProperties.find(p => p.id === tenant.propertyId)
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
                          <span className="text-sm font-medium">{property?.propertyName}</span>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => handleSendReminder(tenant.id)}
                          >
                            <MessageSquare className="size-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Profile</DropdownMenuItem>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}