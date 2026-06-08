
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { updateProfile } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { User, Bell, Shield, Wallet, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { User as UserProfile } from "@/lib/types"

export default function SettingsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "users", user.uid)
  }, [db, user])

  const { data: profile, loading: profileLoading } = useDoc<UserProfile>(userRef)

  const [notifications, setNotifications] = useState({
    paymentReceived: true,
    overdueAlerts: true
  })

  useEffect(() => {
    if (profile?.notifications) {
      setNotifications(profile.notifications)
    }
  }, [profile])

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("name") as string
    const upiId = formData.get("upi") as string

    try {
      // Update Auth Profile
      await updateProfile(user, { displayName })
      
      // Update Firestore Profile
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        name: displayName,
        upiId: upiId,
        notifications: notifications
      })

      toast({
        title: "Settings Saved",
        description: "Your preferences and profile have been updated.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update settings.",
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
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and app preferences.</p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleUpdateProfile}>
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="size-5 text-primary" />
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                  </div>
                  <CardDescription>Update your personal and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" name="name" defaultValue={profile?.name || user?.displayName || ""} placeholder="John Doe" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue={user?.email || ""} disabled className="bg-muted/50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Wallet className="size-5 text-primary" />
                    <CardTitle className="text-lg">Payment Gateway</CardTitle>
                  </div>
                  <CardDescription>Configure your UPI ID for rent collection reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="upi">Your UPI ID (Receiver)</Label>
                    <Input id="upi" name="upi" defaultValue={profile?.upiId || ""} placeholder="yourname@upi" />
                    <p className="text-[10px] text-muted-foreground italic">This ID is included in automated WhatsApp messages to tenants.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="size-5 text-primary" />
                    <CardTitle className="text-lg">Notifications</CardTitle>
                  </div>
                  <CardDescription>Choose how you want to be notified about payments.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Received</Label>
                      <p className="text-sm text-muted-foreground">Notify me when a tenant pays rent.</p>
                    </div>
                    <Switch 
                      checked={notifications.paymentReceived} 
                      onCheckedChange={(val) => setNotifications(prev => ({ ...prev, paymentReceived: val }))} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Overdue Alerts</Label>
                      <p className="text-sm text-muted-foreground">Notify me when rent is 3 days overdue.</p>
                    </div>
                    <Switch 
                      checked={notifications.overdueAlerts} 
                      onCheckedChange={(val) => setNotifications(prev => ({ ...prev, overdueAlerts: val }))} 
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isUpdating} className="w-full md:w-auto px-12">
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save All Settings
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
