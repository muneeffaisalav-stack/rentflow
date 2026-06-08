
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  ChartConfig
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Cell, Pie, PieChart } from "recharts"
import { Download, Filter, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const collectionData = [
  { month: "Jan", collected: 42000, pending: 8000 },
  { month: "Feb", collected: 48000, pending: 4500 },
  { month: "Mar", collected: 52000, pending: 12000 },
  { month: "Apr", collected: 45000, pending: 9000 },
  { month: "May", collected: 58000, pending: 2000 },
  { month: "Jun", collected: 62000, pending: 5000 },
]

const propertyDistribution = [
  { name: "Skyline Heights", value: 45 },
  { name: "Greenwood Villas", value: 30 },
  { name: "Blue Ocean", value: 25 },
]

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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))']

export default function ReportsPage() {
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
               <CardTitle className="font-headline text-lg">Revenue Growth</CardTitle>
               <CardDescription>Last 6 months collection trend</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold">+24.5%</span>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-1">
                    <TrendingUp className="size-4" /> Outperforming target
                  </div>
               </div>
             </CardContent>
           </Card>

           <Card className="flex flex-col">
             <CardHeader className="items-center pb-0">
               <CardTitle className="font-headline text-lg">Collection Efficiency</CardTitle>
               <CardDescription>Current Month Status</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold">92%</span>
                  <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium mt-1">
                    <ArrowUpRight className="size-4" /> 5% higher than Feb
                  </div>
               </div>
             </CardContent>
           </Card>

           <Card className="flex flex-col">
             <CardHeader className="items-center pb-0">
               <CardTitle className="font-headline text-lg">Avg. Days to Pay</CardTitle>
               <CardDescription>Payment speed tracking</CardDescription>
             </CardHeader>
             <CardContent className="flex-1 pb-0">
               <div className="flex flex-col items-center justify-center h-48">
                  <span className="text-4xl font-bold">3.2 Days</span>
                  <div className="flex items-center gap-1 text-rose-500 text-sm font-medium mt-1">
                    <ArrowDownRight className="size-4" /> Slightly slower
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
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <BarChart data={collectionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={10} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Revenue by Property</CardTitle>
              <CardDescription>Distribution of income across your assets.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {propertyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 text-sm font-medium mt-4">
                {propertyDistribution.map((p, i) => (
                   <div key={p.name} className="flex items-center gap-1.5">
                     <div className="size-3 rounded-full" style={{ background: COLORS[i] }} />
                     <span>{p.name}</span>
                   </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
