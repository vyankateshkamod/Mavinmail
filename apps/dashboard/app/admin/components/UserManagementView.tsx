"use client"

import * as React from "react"

import { getUsers } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAdminUser } from "@/lib/api"
import { Loader2, Plus, Copy, Check } from "lucide-react"

// Module-level cache
let usersCache: any[] | null = null;

export function UserManagementView() {
    const [users, setUsers] = React.useState<any[]>(usersCache || []);
    const [loading, setLoading] = React.useState(!usersCache);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false)
    const [creating, setCreating] = React.useState(false)
    const [formData, setFormData] = React.useState({
        email: "",
        password: "",
        role: "USER",
        firstName: "",
        lastName: "",
    })
    const [createdUser, setCreatedUser] = React.useState<{ email: string, password: string } | null>(null)
    const [copied, setCopied] = React.useState(false)

    const fetchUsers = async (force = false) => {
        if (usersCache && !force) {
            setUsers(usersCache);
            setLoading(false);
            return;
        }

        try {
            setLoading(true)
            const result = await getUsers({ page: 1, limit: 20 });
            const newUsers = result.users || [];

            setUsers(newUsers);
            usersCache = newUsers;
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)
        try {
            await createAdminUser(formData)
            setCreatedUser({
                email: formData.email,
                password: formData.password
            })
            // Refresh list
            fetchUsers(true)
        } catch (error) {
            console.error("Failed to create user:", error)
            alert("Failed to create user. Please check the inputs and try again.")
        } finally {
            setCreating(false)
        }
    }

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            role: "USER",
            firstName: "",
            lastName: "",
        })
        setCreatedUser(null)
        setIsCreateOpen(false)
    }

    const copyToClipboard = () => {
        if (!createdUser) return
        navigator.clipboard.writeText(`Email: ${createdUser.email}\nPassword: ${createdUser.password}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>

                <Dialog open={isCreateOpen} onOpenChange={(open) => !open && resetForm()}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                            <DialogDescription>
                                Create a new user account manually. Verification email will NOT be sent.
                            </DialogDescription>
                        </DialogHeader>

                        {createdUser ? (
                            <div className="space-y-4 py-4">
                                <div className="p-4 rounded-lg bg-muted text-sm space-y-2">
                                    <div className="flex items-center gap-2 text-green-500 font-medium">
                                        <Check className="h-4 w-4" />
                                        User Created Successfully
                                    </div>
                                    <p className="text-muted-foreground">
                                        Please copy the credentials below and share them with the user securely.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Email</Label>
                                        <div className="col-span-3 font-mono text-sm">{createdUser.email}</div>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label className="text-right">Password</Label>
                                        <div className="col-span-3 font-mono text-sm bg-muted px-2 py-1 rounded">
                                            {createdUser.password}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={copyToClipboard}
                                    className="w-full"
                                    variant={copied ? "outline" : "default"}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied to Clipboard
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy Credentials
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateUser} className="space-y-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="email" className="text-right">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="password" className="text-right">
                                        Password
                                    </Label>
                                    <Input
                                        id="password"
                                        type="text"
                                        required
                                        minLength={6}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="col-span-3"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="firstName" className="text-right">
                                        First Name
                                    </Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="lastName" className="text-right">
                                        Last Name
                                    </Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right">
                                        Role
                                    </Label>
                                    <select
                                        id="role"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                    >
                                        <option value="USER">User</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="SUPER_ADMIN">Super Admin</option>
                                    </select>
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={creating}>
                                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create User
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border border-border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    {user.email}
                                    <div className="text-xs text-muted-foreground">{user.firstName} {user.lastName}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                        {user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                                        {user.isActive ? 'Active' : 'Suspended'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Edit</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-4">
                                    No users found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
