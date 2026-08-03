"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Loader2,
    CheckCircle,
    Clock,
    XCircle,
    AlertCircle,
    Search,
    RefreshCw,
    ChevronRight,
    ArrowLeft,
    Mail,
    Chrome,
    Filter,
} from "lucide-react"
import {
    getAdminSupportTickets,
    getSupportTicketStats,
    updateSupportTicket,
    deleteSupportTicket,
    SupportTicket,
    TicketStats,
} from "@/lib/api"

interface StatCardProps {
    title: string
    value: number
    icon: React.ReactNode
    color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    )
}

// Module-scope cache
let ticketCache: {
    key: string;
    data: {
        tickets: SupportTicket[];
        stats: TicketStats | null;
    };
} | null = null;

export function SupportTicketsView() {
    // Initialize from cache if filters match default (empty)
    const initialCacheUse = ticketCache && ticketCache.key === JSON.stringify({ status: "", priority: "", search: "" });

    const [tickets, setTickets] = React.useState<SupportTicket[]>(initialCacheUse ? ticketCache!.data.tickets : []);
    const [stats, setStats] = React.useState<TicketStats | null>(initialCacheUse ? ticketCache!.data.stats : null);
    const [loading, setLoading] = React.useState(!initialCacheUse);
    const [selectedTicket, setSelectedTicket] = React.useState<SupportTicket | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<string>("")
    const [priorityFilter, setPriorityFilter] = React.useState<string>("")
    const [updating, setUpdating] = React.useState(false)
    const [deleting, setDeleting] = React.useState(false)
    const [adminNotes, setAdminNotes] = React.useState("")
    const [newStatus, setNewStatus] = React.useState("")
    const [newPriority, setNewPriority] = React.useState("")

    React.useEffect(() => {
        loadData()
    }, [statusFilter, priorityFilter])

    const loadData = async (forceString?: string) => {
        const queryKey = JSON.stringify({
            status: statusFilter,
            priority: priorityFilter,
            search: searchQuery // Note: searchQuery is usually only applied on explicit search button/enter, but let's include it
        });

        // Use cache if available and matching, unless forced
        if (ticketCache && ticketCache.key === queryKey && !forceString) {
            setTickets(ticketCache.data.tickets);
            setStats(ticketCache.data.stats);
            setLoading(false);
            return;
        }

        try {
            setLoading(true)
            const [ticketsResponse, statsResponse] = await Promise.all([
                getAdminSupportTickets({
                    status: statusFilter || undefined,
                    priority: priorityFilter || undefined,
                    search: searchQuery || undefined,
                }),
                getSupportTicketStats(),
            ])

            // Update cache
            ticketCache = {
                key: queryKey,
                data: {
                    tickets: ticketsResponse.tickets || [],
                    stats: statsResponse
                }
            };

            setTickets(ticketsResponse.tickets || [])
            setStats(statsResponse)
        } catch (error) {
            console.error("Failed to load support tickets:", error)
        } finally {
            setLoading(false)
        }
    }

    // Wrapper for manual refresh button to bypass cache
    const forceRefresh = () => {
        // Clear cache for current view to force fetch
        if (ticketCache) ticketCache = null;
        loadData("force");
    }

    const handleSearch = () => {
        loadData()
    }

    const handleSelectTicket = (ticket: SupportTicket) => {
        setSelectedTicket(ticket)
        setAdminNotes(ticket.adminNotes || "")
        setNewStatus(ticket.status)
        setNewPriority(ticket.priority)
    }

    const handleUpdateTicket = async () => {
        if (!selectedTicket) return

        setUpdating(true)
        try {
            await updateSupportTicket(selectedTicket.id, {
                status: newStatus,
                priority: newPriority,
                adminNotes,
            })
            // Reload data and close detail view
            await loadData()
            setSelectedTicket(null)
        } catch (error) {
            console.error("Failed to update ticket:", error)
        } finally {
            setUpdating(false)
        }
    }

    const handleDeleteTicket = async () => {
        if (!selectedTicket) return
        if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) return

        setDeleting(true)
        try {
            await deleteSupportTicket(selectedTicket.id)
            await loadData()
            setSelectedTicket(null)
        } catch (error) {
            console.error("Failed to delete ticket:", error)
            alert("Failed to delete ticket. Please try again.")
        } finally {
            setDeleting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<
            string,
            { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
        > = {
            OPEN: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
            IN_PROGRESS: {
                variant: "default",
                icon: <Loader2 className="w-3 h-3 animate-spin" />,
            },
            RESOLVED: { variant: "outline", icon: <CheckCircle className="w-3 h-3" /> },
            CLOSED: { variant: "outline", icon: <XCircle className="w-3 h-3" /> },
        }
        const config = variants[status] || variants.OPEN
        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                {config.icon}
                {status.replace("_", " ")}
            </Badge>
        )
    }

    const getPriorityBadge = (priority: string) => {
        const colors: Record<string, string> = {
            LOW: "bg-gray-500/20 text-gray-400",
            MEDIUM: "bg-yellow-500/20 text-yellow-400",
            HIGH: "bg-orange-500/20 text-orange-400",
            URGENT: "bg-red-500/20 text-red-400",
        }
        return (
            <span className={`text-xs px-2 py-0.5 rounded ${colors[priority] || colors.MEDIUM}`}>
                {priority}
            </span>
        )
    }

    const getSourceIcon = (source: string) => {
        if (source === "extension") {
            return <Chrome className="w-4 h-4 text-muted-foreground" />
        }
        return <Mail className="w-4 h-4 text-muted-foreground" />
    }

    // Ticket Detail View
    if (selectedTicket) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(null)}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Tickets
                    </Button>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="text-foreground flex items-center gap-2">
                                    {getSourceIcon(selectedTicket.source)}
                                    {selectedTicket.title}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Ticket #{selectedTicket.id} • Created{" "}
                                    {new Date(selectedTicket.createdAt).toLocaleString()}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusBadge(selectedTicket.status)}
                                {getPriorityBadge(selectedTicket.priority)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* User Info */}
                        <div className="p-4 rounded-lg bg-muted/30 border border-border">
                            <h4 className="text-sm font-medium text-foreground mb-2">Submitted by</h4>
                            <p className="text-sm text-muted-foreground">
                                {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">{selectedTicket.user?.email}</p>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="text-sm font-medium text-foreground mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {selectedTicket.description}
                            </p>
                        </div>

                        {/* Update Form */}
                        <div className="border-t border-border pt-6 space-y-4">
                            <h4 className="text-sm font-medium text-foreground">Update Ticket</h4>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Status</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md bg-muted/50 border border-input text-foreground text-sm"
                                    >
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="CLOSED">Closed</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Priority</label>
                                    <select
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        className="w-full h-10 px-3 rounded-md bg-muted/50 border border-input text-foreground text-sm"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-muted-foreground">Admin Notes</label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add internal notes..."
                                    className="bg-muted/50 border-input text-foreground min-h-[100px]"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleUpdateTicket}
                                    disabled={updating || deleting}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating...
                                        </>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </Button>

                                {(selectedTicket.status === "RESOLVED" || selectedTicket.status === "CLOSED") && (
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteTicket}
                                        disabled={updating || deleting}
                                    >
                                        {deleting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Deleting...
                                            </>
                                        ) : (
                                            "Delete Ticket"
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Ticket List View
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Support Tickets</h2>
                <p className="text-muted-foreground">Manage and respond to user support requests.</p>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        title="Open Tickets"
                        value={stats.byStatus.open}
                        icon={<Clock className="h-4 w-4 text-yellow-400" />}
                        color="bg-yellow-500/10"
                    />
                    <StatCard
                        title="In Progress"
                        value={stats.byStatus.inProgress}
                        icon={<Loader2 className="h-4 w-4 text-blue-400" />}
                        color="bg-blue-500/10"
                    />
                    <StatCard
                        title="Resolved"
                        value={stats.byStatus.resolved}
                        icon={<CheckCircle className="h-4 w-4 text-green-400" />}
                        color="bg-green-500/10"
                    />
                    <StatCard
                        title="Total Tickets"
                        value={stats.total}
                        icon={<AlertCircle className="h-4 w-4 text-purple-400" />}
                        color="bg-purple-500/10"
                    />
                </div>
            )}

            {/* Filters */}
            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search tickets..."
                                    className="pl-9 bg-muted/50 border-input"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-10 px-3 rounded-md bg-muted/50 border border-input text-foreground text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="OPEN">Open</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                            <select
                                value={priorityFilter}
                                onChange={(e) => setPriorityFilter(e.target.value)}
                                className="h-10 px-3 rounded-md bg-muted/50 border border-input text-foreground text-sm"
                            >
                                <option value="">All Priority</option>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={forceRefresh}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets List */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">All Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p>No support tickets found.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => handleSelectTicket(ticket)}
                                    className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {getSourceIcon(ticket.source)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-foreground truncate">
                                                    {ticket.title}
                                                </h4>
                                                {getPriorityBadge(ticket.priority)}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {ticket.user?.email} •{" "}
                                                {new Date(ticket.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(ticket.status)}
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
