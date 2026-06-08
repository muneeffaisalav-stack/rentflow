
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Mail, ShieldCheck, UserCheck, Plus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore"
import { User } from "@/lib/types"
import { useProfile } from "@/hooks/use-profile"
import { redirect } from "next/navigation"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { initializeApp, deleteApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from "firebase/auth"
import { firebaseConfig } from "@/firebase/config"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function UserManagementPage() {
  const { isAdmin, profile, loading: authLoading } = useProfile()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ensure we only query the users collection if the profile confirms admin role
  const canFetchUsers = isAdmin && profile?.role === 'super-admin'

  const usersQuery = useMemoFirebase(() => {
    if (!db || !canFetchUsers) return null
    return query(collection(db, "users"), orderBy("createdAt", "desc"))
  }, [db, canFetchUsers])

  const { data: users, loading: uLoading } = useCollection<User>(usersQuery)

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!isAdmin) redirect("/dashboard")

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as 'landlord' | 'super-admin'

    let secondaryApp;
    try {
      const appName = `temp-user-${Date.now()}`
      secondaryApp = initializeApp(firebaseConfig, appName)
      const secondaryAuth = getAuth(secondaryApp)

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
      const newUid = userCredential.user.uid

      const userData = {
        id: newUid,
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
      }

      await setDoc(doc(db, "users", newUid), userData)

      await authSignOut(secondaryAuth)
      await deleteApp(secondaryApp)

      toast({
        title: "User Created",
        description: `${name} has been added as a ${role}.`,
      })
      setIsDialogOpen(false)
    } catch (error: any) {
      console.error("Error adding user:", error)
      
      let errorMessage = error.message || "Failed to create user account."
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered."
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters."
      }

      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: errorMessage,
      })

      if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: "users",
          operation: "create",
        })
        errorEmitter.emit('permission-error', permissionError)
      }

      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp)
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-headline font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">Monitor and manage roles for platform participants.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9 w-[250px] md:w-[300px]" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle>Add New Platform User</DialogTitle>
                    <DialogDescription>
                      Create a new authentication account and profile for a landlord or administrator.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="Jane Doe" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="jane@example.com" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Temporary Password</Label>
                      <Input id="password" name="password" type="password" required />
                      <p className="text-[10px] text-muted-foreground">Minimum 6 characters. Provide this to the user for their first login.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="role">Platform Role</Label>
                      <Select name="role" defaultValue="landlord" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="landlord">Landlord</SelectItem>
                          <SelectItem value="super-admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {uLoading || !canFetchUsers ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                <AlertCircle className="size-8 mx-auto opacity-20 mb-2" />
                <p>{searchTerm ? "No users match your search." : "No users registered yet."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="size-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'super-admin' ? 'default' : 'secondary'}>
                          <div className="flex items-center gap-1">
                            {user.role === 'super-admin' ? <ShieldCheck className="size-3" /> : <UserCheck className="size-3" />}
                            {user.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-emerald-600 bg-emerald-50">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
