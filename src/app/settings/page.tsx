
"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useUser } from "@/firebase"
import { updateProfile } from "firebase/auth"
import { User, Bell, Shield, Wallet, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    const formData = new FormData(e.currentTarget)
    const displayName = formData.get("name") as string

    try {
      await updateProfile(user, { displayName })
      toast({
        title: "Profile Updated",
        description: "Your display name has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h2 className="text-3xl font-headline font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and app preferences.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <form onSubmit={handleUpdateProfile}>
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
                  <Input id="name" name="name" defaultValue={user?.displayName || ""} placeholder="John Doe" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" defaultValue={user?.email || ""} disabled />
                </div>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </form>
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
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Overdue Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify me when rent is 3 days overdue.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" />
                <CardTitle className="text-lg">Payment Gateway</CardTitle>
              </div>
              <CardDescription>Configure your UPI and bank details for rent collection.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="upi">Default UPI ID</Label>
                <Input id="upi" placeholder="yourname@upi" />
              </div>
              <Button variant="outline">Update Payment Info</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
