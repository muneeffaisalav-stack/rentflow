
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Plus, MoreVertical, Users } from "lucide-react"
import { mockProperties, mockTenants } from "@/lib/mock-data"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export default function PropertiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Properties</h2>
            <p className="text-muted-foreground">Manage your real estate portfolio.</p>
          </div>
          <Button className="gap-2">
            <Plus className="size-4" />
            Add Property
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockProperties.map((property) => {
            const tenantCount = mockTenants.filter(t => t.propertyId === property.id).length
            const propertyImage = PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)]
            
            return (
              <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all group border-border/60">
                <div className="relative h-48 w-full overflow-hidden">
                  <Image 
                    src={propertyImage.imageUrl} 
                    alt={property.propertyName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    data-ai-hint={propertyImage.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-xs font-medium uppercase tracking-wider opacity-80">Portfolio Asset</p>
                    <h3 className="text-xl font-bold font-headline">{property.propertyName}</h3>
                  </div>
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 text-white hover:bg-white/20">
                    <MoreVertical className="size-5" />
                  </Button>
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{property.address}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Users className="size-4 text-primary" />
                      <span>{tenantCount} Tenants</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <Building2 className="size-4 text-primary" />
                      <span>{tenantCount > 0 ? 'Full' : 'Empty'}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 flex justify-between gap-2">
                  <Button variant="outline" size="sm" className="w-full">View Details</Button>
                  <Button variant="ghost" size="sm" className="w-full">Edit</Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
