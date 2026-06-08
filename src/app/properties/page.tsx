
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin, Plus, MoreVertical, Users, Loader2, AlertCircle } from "lucide-react"
import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, addDoc } from "firebase/firestore"
import { Property, Tenant } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function PropertiesPage() {
  const { user, loading: authLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "properties"), where("landlordId", "==", user.uid))
  }, [db, user])

  const { data: properties, loading: propertiesLoading } = useCollection<Property>(propertiesQuery)

  const tenantsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "tenants"), where("landlordId", "==", user.uid))
  }, [db, user])

  const { data: allTenants } = useCollection<Tenant>(tenantsQuery)

  const handleAddProperty = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to add properties.",
      })
      return
    }

    if (!db) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const address = formData.get("address") as string

    const propertyData = {
      propertyName: name,
      address: address,
      landlordId: user.uid,
      createdAt: new Date().toISOString(),
    }

    addDoc(collection(db, "properties"), propertyData)
      .then(() => {
        setIsDialogOpen(false)
        setIsSubmitting(false)
        toast({
          title: "Property Added",
          description: `${name} has been added to your portfolio.`,
        })
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: "properties",
          operation: "create",
          requestResourceData: propertyData,
        })
        errorEmitter.emit("permission-error", permissionError)
        setIsSubmitting(false)
      })
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">Properties</h2>
            <p className="text-muted-foreground">Manage your real estate portfolio.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!user}>
                <Plus className="size-4" />
                Add Property
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddProperty}>
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Enter the details of the property you want to add to your portfolio.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Property Name</Label>
                    <Input id="name" name="name" placeholder="e.g. Skyline Heights" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address">Full Address</Label>
                    <Input id="address" name="address" placeholder="123 Street, City" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Property
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!user && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Not Signed In</AlertTitle>
            <AlertDescription>
              Please sign in using the user menu in the top right to manage your properties.
            </AlertDescription>
          </Alert>
        ) }

        {propertiesLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : user && properties.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
            <div className="size-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Building2 className="size-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold font-headline">No properties found</h3>
            <p className="text-muted-foreground mt-2 max-w-xs">
              Start building your portfolio by adding your first property.
            </p>
            <Button className="mt-6" onClick={() => setIsDialogOpen(true)}>Add Property</Button>
          </Card>
        ) : user && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => {
              const tenantCount = allTenants?.filter(t => t.propertyId === property.id).length || 0
              const propertyImage = PlaceHolderImages?.[index % PlaceHolderImages.length] || PlaceHolderImages?.[0]
              
              return (
                <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-all group border-border/60">
                  <div className="relative h-48 w-full overflow-hidden">
                    {propertyImage && (
                      <Image 
                        src={propertyImage.imageUrl} 
                        alt={property.propertyName}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        data-ai-hint={propertyImage.imageHint}
                      />
                    )}
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
                        <span>Active</span>
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
        )}
      </div>
    </DashboardLayout>
  )
}
