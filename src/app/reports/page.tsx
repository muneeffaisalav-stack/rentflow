
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { Download, Filter, TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Property, Invoice } from "@/lib/types"

const chartConfig: ChartConfig = {
  collected: {
    label: "Collected",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--accent))",
  },
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

export default function ReportsPage() {
  const { user } = useUser()
  const db = useFirestore()

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "properties"), where("landlordId", "==", user.uid))
  }, [db, user])
  const { data: properties, loading: pLoading } = useCollection<Property>(propertiesQuery)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "invoices"), where("propertyId", "in", properties.length > 0 ? properties.map(p => p.id) : ["none"]))
  }, [db, user, properties])
  const { data: invoices, loading: iLoading } = useCollection<Invoice>(invoicesQuery)

  // Process data for charts
  const collectionByMonth = invoices.reduce((acc: any, invoice) => {
    const month = invoice.month
    if (!acc[month]) acc[month] = { month, collected: 0, pending: 0 }
    if (invoice.status === 'paid') {
      acc[month].collected += invoice.amount
    } else {
      acc[month].pending += invoice.amount
    }
    return acc
  }, {})

  const sortedMonthData = Object.values(collectionByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month))

  const collectionByProperty = invoices.reduce((acc: any, invoice) => {
    const property = properties.find(p => p.id === invoice.propertyId)
    const name = property?.propertyName || 'Unknown'
    if (!acc[name]) acc[name] = 0
    acc[name] += invoice.amount
    return acc
  }, {})

  const propertyPieData = Object.entries(collectionByProperty).map(([name, value]) => ({ name, value }))

  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0)
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.amount, 0)
  const efficiency = totalCollected + totalPending > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0

  if (pLoading || iLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Analytics & Reports</h2>
            <p className="text-muted-foreground">In-depth analysis of your rental revenue stream.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="size-4" /> Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Download className="size-4" /> Generate Report
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <Card className="flex flex-col">
             <CardHeader className="items-center pb-0">
               <CardTitle className="font-headline text-lg">Total Revenue</CardTitle>
               <CardDescription>All-time collected rent</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold">₹{totalCollected.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-1">
                    <TrendingUp className="size-4" /> Active portfolio
                  </div>
               </div>
             </CardContent>
           </Card>

           <Card className="flex flex-col">
             <CardHeader className="items-center pb-0">
               <CardTitle className="font-headline text-lg">Collection Efficiency</CardTitle>
               <CardDescription>Overall recovery rate</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold">{efficiency}%</span>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-1">
                    <ArrowUpRight className="size-4" /> Based on {invoices.length} invoices
                  </div>
               </div>
             </CardContent>
           </Card>

           <Card className="flex flex-col">
             <CardHeader className="items-center pb-0">
               <CardTitle className="font-headline text-lg">Pending Receivables</CardTitle>
               <CardDescription>Unpaid rent amount</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold text-rose-500">₹{totalPending.toLocaleString()}</span>
                  <div className="flex items-center gap-1 text-rose-500 text-sm font-medium mt-1">
                    <ArrowDownRight className="size-4" /> Action required
                  </div>
               </div>
             </CardContent>
           </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Collection Trends</CardTitle>
              <CardDescription>Monthly breakdown of collected vs pending rent.</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedMonthData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No data available for trends.
                </div>
              ) : (
                <ChartContainer config={chartConfig} className="h-[350px] w-full">
                  <BarChart data={sortedMonthData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis hide />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Revenue by Property</CardTitle>
              <CardDescription>Distribution of income across your assets.</CardDescription>
            </CardHeader>
            <CardContent>
              {propertyPieData.length === 0 ? (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No property revenue data.
                </div>
              ) : (
                <>
                  <div className="h-[350px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={propertyPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {propertyPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 text-xs font-medium mt-4">
                    {propertyPieData.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="truncate max-w-[100px]">{p.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
