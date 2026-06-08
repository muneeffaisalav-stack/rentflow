
"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Mail, ShieldCheck, UserCheck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { User } from "@/lib/types"
import { useProfile } from "@/hooks/use-profile"
import { redirect } from "next/navigation"
import { useState } from "react"

export default function UserManagementPage() {
  const { isAdmin, loading: authLoading } = useProfile()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")

  const usersQuery = useMemoFirebase(() => query(collection(db, "users"), orderBy("createdAt", "desc")), [db])
  const { data: users, loading: uLoading } = useCollection<User>(usersQuery)

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (!isAdmin) redirect("/dashboard")

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
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-9 w-[300px]" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">All Users</CardTitle>
          </CardHeader>
          <CardContent>
            {uLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm ? "No users match your search." : "No users registered yet."}
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
                          <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary">
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
