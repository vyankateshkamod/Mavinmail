"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Mail } from "lucide-react"

export function ConnectedAccountsView() {
    const accounts = [
        {
            id: 1,
            provider: "Gmail",
            email: "john.doe@gmail.com",
            status: "Active",
            lastSync: "2 mins ago",
            icon: Mail, // In a real app, use provider logos
        },
        {
            id: 2,
            provider: "Outlook",
            email: "john.d@company.com",
            status: "Re-auth Needed",
            lastSync: "1 day ago",
            icon: Mail,
        },
        {
            id: 3,
            provider: "Gmail",
            email: "j.doe.personal@gmail.com",
            status: "Active",
            lastSync: "5 mins ago",
            icon: Mail,
        },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Connected Accounts</h2>
                    <p className="text-muted-foreground">Manage your linked email accounts and data sources.</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                </Button>
            </div>

            <div className="grid gap-4">
                {accounts.map((account) => (
                    <Card key={account.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                        <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 rounded-full bg-muted text-muted-foreground">
                                    <account.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="text-lg font-medium text-foreground">{account.provider}</h3>
                                        {account.status === 'Active' ? (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                                                <AlertTriangle className="mr-1 h-3 w-3" /> Re-auth Needed
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{account.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-muted-foreground">Last synced</p>
                                    <p className="text-sm text-foreground/80">{account.lastSync}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    {account.status !== 'Active' && (
                                        <Button variant="outline" size="sm" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-600">
                                            Re-connect
                                        </Button>
                                    )}
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
