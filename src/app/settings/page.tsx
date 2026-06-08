
"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { Bell, Wallet, Loader2, Settings } from "lucide-react"
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

  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !db) return

    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const upiId = formData.get("upi") as string

    try {
      // Update Firestore Settings
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        upiId: upiId,
        notifications: notifications
      })

      toast({
        title: "Preferences Saved",
        description: "Your application settings have been updated.",
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
          <h2 className="text-3xl font-headline font-bold tracking-tight text-primary flex items-center gap-3">
             <Settings className="size-8" />
             App Settings
          </h2>
          <p className="text-muted-foreground">Configure your payments and notification preferences.</p>
        </div>

        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                <CardTitle className="text-lg">Payment Gateway</CardTitle>
              </div>
              <CardDescription>Configure your default receiver UPI ID for automated tenant reminders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="upi">Your Receiver UPI ID</Label>
                <Input id="upi" name="upi" defaultValue={profile?.upiId || ""} placeholder="landlord@upi" />
                <p className="text-[11px] text-muted-foreground italic bg-muted/30 p-2 rounded">
                  This ID is embedded in the WhatsApp reminders sent to tenants to simplify the payment process.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="size-5 text-primary" />
                <CardTitle className="text-lg">Communication Preferences</CardTitle>
              </div>
              <CardDescription>Decide when you want to receive system alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-0.5">
                  <Label>Payment Notifications</Label>
                  <p className="text-xs text-muted-foreground">Get notified immediately when a tenant settles an invoice.</p>
                </div>
                <Switch 
                  checked={notifications.paymentReceived} 
                  onCheckedChange={(val) => setNotifications(prev => ({ ...prev, paymentReceived: val }))} 
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label>Automated Overdue Alerts</Label>
                  <p className="text-xs text-muted-foreground">Receive a summary of tenants who are past their due date.</p>
                </div>
                <Switch 
                  checked={notifications.overdueAlerts} 
                  onCheckedChange={(val) => setNotifications(prev => ({ ...prev, overdueAlerts: val }))} 
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isUpdating} className="w-full md:w-auto px-12 font-bold shadow-lg">
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Preferences
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
