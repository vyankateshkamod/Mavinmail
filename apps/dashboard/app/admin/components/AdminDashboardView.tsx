"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, CreditCard, AlertTriangle } from "lucide-react"

import { getAdminStats } from "@/lib/api"

export function AdminDashboardView() {
    const [stats, setStats] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getAdminStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch admin stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="rounded-lg border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : stats?.users?.total ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">+0% from last month</p>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : stats?.users?.active ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">+0 since last hour</p>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loading ? "..." : stats?.activity?.totalApiCalls ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            +{loading ? "..." : stats?.activity?.apiCallsToday ?? 0} today
                        </p>
                    </CardContent>
                </Card>
                <Card className="rounded-lg border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Health</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">Normal</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
