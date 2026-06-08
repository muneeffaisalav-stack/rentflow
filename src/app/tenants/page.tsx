
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
import { mockTenants, mockProperties, mockInvoices } from "@/lib/mock-data"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { intelligentRentReminder } from "@/ai/flows/intelligent-rent-reminder"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

export default function TenantsPage() {
  const { toast } = useToast()
  const [loadingReminder, setLoadingReminder] = useState<string | null>(null)

  const handleSendReminder = async (tenantId: string) => {
    setLoadingReminder(tenantId)
    const tenant = mockTenants.find(t => t.id === tenantId)
    if (!tenant) return

    const history = mockInvoices
      .filter(i => i.tenantId === tenantId)
      .map(i => ({ month: i.month, status: i.status }))

    try {
      const response = await intelligentRentReminder({
        tenantName: tenant.name,
        amount: tenant.rentAmount,
        dueDate: `Day ${tenant.dueDate} of the month`,
        paymentLink: `upi://pay?pa=${tenant.upiId}&am=${tenant.rentAmount}`,
        paymentHistory: history,
        reminderType: 'due_soon'
      })

      // Simulate sending via WhatsApp
      console.log("Generated WhatsApp Message:", response.reminderMessage)
      
      toast({
        title: "Reminder Generated",
        description: `Message for ${tenant.name} is ready for WhatsApp.`,
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate reminder using AI.",
      })
    } finally {
      setLoadingReminder(null)
    }
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
                            disabled={loadingReminder === tenant.id}
                          >
                            <MessageSquare className={`size-4 ${loadingReminder === tenant.id ? 'animate-pulse' : ''}`} />
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
