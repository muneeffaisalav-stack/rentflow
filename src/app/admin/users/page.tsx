"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Edit, Trash2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export default function UserManagementPage() {
  const { isAdmin, profile, loading: authLoading } = useProfile()
  const db = useFirestore()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const canFetchUsers = isAdmin && profile?.role === 'super-admin'

  const usersQuery = useMemoFirebase(() => {
    if (!db || !canFetchUsers) return null
    return query(collection(db, "users"), orderBy("createdAt", "desc"))
  }, [db, canFetchUsers])

  const { data: users, loading: uLoading } = useCollection<User>(usersQuery)

  if (authLoading || (isAdmin && !profile)) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-primary size-8" />
            <p className="text-sm text-muted-foreground font-medium">Authorizing User Management...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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

      toast({ title: "User Created", description: `${name} has been added.` })
      setIsAddDialogOpen(false)
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message })
      if (secondaryApp) await deleteApp(secondaryApp)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser || !db) return
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const role = formData.get("role") as 'landlord' | 'super-admin'

    try {
      const userRef = doc(db, "users", selectedUser.id)
      await updateDoc(userRef, { name, role })
      
      // Close dialog immediately to prevent pointer-events lock issues
      setIsEditDialogOpen(false)
      toast({ title: "User Updated", description: "Profile saved successfully." })
    } catch (error: any) {
      errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `users/${selectedUser.id}`,
        operation: "update",
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!db) return
    deleteDoc(doc(db, "users", userId))
      .then(() => toast({ title: "User Removed", description: "Profile deleted." }))
      .catch(() => errorEmitter.emit("permission-error", new FirestorePermissionError({
        path: `users/${userId}`,
        operation: "delete",
      })))
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
            <p className="text-muted-foreground">Monitor platform roles.</p>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[250px]"
            />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="size-4" />Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Label>Name</Label><Input name="name" required />
                    <Label>Email</Label><Input name="email" type="email" required />
                    <Label>Password</Label><Input name="password" type="password" required />
                    <Label>Role</Label>
                    <Select name="role" defaultValue="landlord">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landlord">Landlord</SelectItem>
                        <SelectItem value="super-admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter><Button type="submit" disabled={isSubmitting}>Create</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell><Badge>{user.role}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { setSelectedUser(user); setIsEditDialogOpen(true); }}>
                            <Edit className="mr-2 size-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => handleDeleteUser(user.id)} className="text-destructive">
                            <Trash2 className="mr-2 size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog 
        open={isEditDialogOpen} 
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setSelectedUser(null);
        }}
      >
        <DialogContent>
          {selectedUser && (
            <form onSubmit={handleUpdateUser}>
              <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <Label>Name</Label><Input name="name" defaultValue={selectedUser.name} required />
                <Label>Role</Label>
                <Select name="role" defaultValue={selectedUser.role}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landlord">Landlord</SelectItem>
                    <SelectItem value="super-admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter><Button type="submit" disabled={isSubmitting}>Save</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
