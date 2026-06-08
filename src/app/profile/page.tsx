
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { User, Loader2, Mail, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { User as UserProfile } from "@/lib/types"

export default function ProfilePage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("name") as string

    try {
      // Update Auth Profile
      await updateProfile(user, { displayName })
      
      // Update Firestore Profile
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        name: displayName,
      })

      toast({
        title: "Profile Updated",
        description: "Your personal information has been saved.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (profileLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="animate-spin size-8 text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Your Profile</h2>
          <p className="text-muted-foreground">Manage your identity and public information.</p>
        </div>

        <Card>
          <form onSubmit={handleUpdateProfile}>
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <User className="size-5" />
                <CardTitle className="text-lg">Account Details</CardTitle>
              </div>
              <CardDescription>Update how your name appears across the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={profile?.name || user?.displayName || ""} 
                  placeholder="John Doe" 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Mail className="size-3 text-muted-foreground" /> Email Address
                </Label>
                <Input id="email" defaultValue={user?.email || ""} disabled className="bg-muted/50" />
                <p className="text-[10px] text-muted-foreground">Email is managed via your authentication provider.</p>
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <Shield className="size-3 text-muted-foreground" /> Platform Role
                </Label>
                <div className="px-3 py-2 bg-muted/30 rounded-md border text-sm font-medium capitalize">
                  {profile?.role || "Landlord"}
                </div>
              </div>
            </CardContent>
            <CardContent className="pt-0 flex justify-end">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Profile
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
