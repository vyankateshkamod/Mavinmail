"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Clock, XCircle, Send, RefreshCw } from "lucide-react"
import { createSupportTicket, getUserSupportTickets, SupportTicket } from "@/lib/api"

export function SupportView() {
    const [subject, setSubject] = React.useState("")
    const [message, setMessage] = React.useState("")
    const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [submitSuccess, setSubmitSuccess] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [tickets, setTickets] = React.useState<SupportTicket[]>([])
    const [loadingTickets, setLoadingTickets] = React.useState(true)

    // Load tickets on mount
    React.useEffect(() => {
        loadTickets()
    }, [])

    const loadTickets = async () => {
        try {
            setLoadingTickets(true)
            const response = await getUserSupportTickets()
            setTickets(response.tickets || [])
        } catch (error) {
            console.error("Failed to load tickets:", error)
        } finally {
            setLoadingTickets(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subject.trim() || !message.trim()) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            await createSupportTicket({
                title: subject,
                description: message,
                priority,
            })
            setSubmitSuccess(true)
            setSubject("")
            setMessage("")
            setPriority("MEDIUM")

            // Reload tickets
            loadTickets()

            // Reset success message after delay
            setTimeout(() => {
                setSubmitSuccess(false)
            }, 3000)
        } catch (error: any) {
            setSubmitError(error.message || "Failed to create ticket")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
            OPEN: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
            IN_PROGRESS: { variant: "default", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Support</h2>
                <p className="text-muted-foreground">Need help? We've got you covered.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Create Ticket Form */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Create Support Ticket</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Send us a message and we'll get back to you.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {submitSuccess ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <CheckCircle className="text-green-400 mb-3" size={48} />
                                <p className="text-green-400 font-medium">Ticket Created Successfully!</p>
                                <p className="text-sm text-muted-foreground mt-1">We'll get back to you soon.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-foreground">Subject</Label>
                                    <Input
                                        id="subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="I need help with..."
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="text-foreground">Message</Label>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Describe your issue..."
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50 min-h-[150px]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="priority" className="text-foreground">Priority</Label>
                                    <select
                                        id="priority"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full h-10 px-3 rounded-md bg-muted/50 border border-input text-foreground text-sm"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>

                                {submitError && (
                                    <div className="flex items-center gap-2 text-red-400 text-sm">
                                        <AlertCircle size={16} />
                                        {submitError}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* FAQ Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Frequently Asked Questions</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Quick answers to common questions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="item-1" className="border-border">
                                    <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline">How do I connect a new account?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Go to the Connected Accounts tab and click the "Add Account" button in the top right corner.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2" className="border-border">
                                    <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline">Is my data secure?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Yes, we use enterprise-grade encryption for all your data. We never share your emails with third parties.
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3" className="border-border">
                                    <AccordionTrigger className="text-foreground hover:text-primary hover:no-underline">Can I change my plan later?</AccordionTrigger>
                                    <AccordionContent className="text-muted-foreground">
                                        Absolutely. You can upgrade or downgrade your subscription at any time from the Subscription tab.
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* My Tickets Section */}
            <Card className="bg-card border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-foreground">My Support Tickets</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Track the status of your support requests.
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadTickets}
                        disabled={loadingTickets}
                    >
                        <RefreshCw className={`h-4 w-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    {loadingTickets ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-primary" size={24} />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>You haven't created any support tickets yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-border"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-medium text-foreground truncate">
                                                {ticket.title}
                                            </h4>
                                            {getPriorityBadge(ticket.priority)}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {ticket.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Created {new Date(ticket.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        {getStatusBadge(ticket.status)}
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
