"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle2, Clock, Mail, MessageSquare, TrendingUp } from "lucide-react"

export function DashboardView() {
    const stats = [
        {
            title: "Total Emails Processed",
            value: "12,345",
            change: "+12% from last month",
            icon: Mail,
            color: "text-cyan-400",
        },
        {
            title: "Pending Tasks",
            value: "23",
            change: "-5% from yesterday",
            icon: Clock,
            color: "text-amber-400",
        },
        {
            title: "AI Actions Taken",
            value: "1,203",
            change: "+18% from last week",
            icon: Activity,
            color: "text-emerald-400",
        },
        {
            title: "Time Saved",
            value: "45h",
            change: "Estimated this month",
            icon: TrendingUp,
            color: "text-purple-400",
        },
    ]

    const tasks = [
        {
            id: 1,
            title: "Review Q3 Report Draft",
            source: "Gmail",
            status: "Pending",
            priority: "High",
            time: "2h ago",
        },
        {
            id: 2,
            title: "Schedule meeting with Alex",
            source: "Outlook",
            status: "In Progress",
            priority: "Medium",
            time: "4h ago",
        },
        {
            id: 3,
            title: "Reply to invoice query",
            source: "Gmail",
            status: "Completed",
            priority: "Low",
            time: "1d ago",
        },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, John</h2>
                <p className="text-muted-foreground">Here's what's happening with your AI assistant today.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-card border-border hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-card-foreground">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">{stat.change}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground">Recent AI Tasks</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Your assistant has been busy. Here are the latest actions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${task.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                                            {task.status === 'Completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                                            <p className="text-xs text-muted-foreground flex items-center mt-1">
                                                <span className="mr-2">{task.source}</span>
                                                <span>•</span>
                                                <span className="ml-2">{task.time}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant={task.status === 'Completed' ? 'default' : 'outline'} className={task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-emerald-500/50' : 'text-muted-foreground border-border'}>
                                        {task.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Common tasks you can perform right now.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-primary-foreground">
                            <MessageSquare className="mr-2 h-4 w-4" /> Compose New Email
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                            <Clock className="mr-2 h-4 w-4" /> Schedule Focus Time
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground">
                            <Activity className="mr-2 h-4 w-4" /> View Analytics Report
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
