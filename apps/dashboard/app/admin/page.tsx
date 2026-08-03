"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/layout/Sidebar"
import { TopNav } from "@/components/layout/TopNav"
import { LayoutDashboard, Users, Shield, Settings, Ticket } from "lucide-react"
import { AdminDashboardView } from "./components/AdminDashboardView"
import { UserManagementView } from "./components/UserManagementView"
import { AuditLogsView } from "./components/AuditLogsView"
import { AdminSettingsView } from "./components/AdminSettingsView"
import { SupportTicketsView } from "./components/SupportTicketsView"
import { redirect } from "next/navigation"

export default function AdminPage() {
    const { data: session, status } = useSession()
    const [activeView, setActiveView] = React.useState("overview")
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)

    React.useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/login")
        }
        if (status === "authenticated") {
            const role = session?.user?.role;
            if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
                redirect("/dashboard")
            }
        }
    }, [status, session])

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center">Loading...</div>
    }

    const navItems = [
        { name: "Overview", view: "overview", icon: LayoutDashboard },
        { name: "Users", view: "users", icon: Users },
        { name: "Support Tickets", view: "support-tickets", icon: Ticket },
        { name: "Audit Logs", view: "audit-logs", icon: Shield },
        { name: "Settings", view: "settings", icon: Settings },
    ]

    const renderView = () => {
        switch (activeView) {
            case "overview":
                return <AdminDashboardView />
            case "users":
                return <UserManagementView />
            case "support-tickets":
                return <SupportTicketsView />
            case "audit-logs":
                return <AuditLogsView />
            case "settings":
                return <AdminSettingsView />
            default:
                return <AdminDashboardView />
        }
    }

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans">
            <Sidebar
                className="hidden md:flex"
                activeView={activeView}
                onViewChange={setActiveView}
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                navItems={navItems}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <TopNav
                    activeView={activeView}
                    onViewChange={setActiveView}
                    navItems={navItems}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="max-w-7xl mx-auto w-full">
                        {renderView()}
                    </div>
                </main>
            </div>
        </div>
    )
}
