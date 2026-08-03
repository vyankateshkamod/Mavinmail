"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
    LayoutDashboard,
    Users,
    Settings,
    User,
    CreditCard,
    HelpCircle,
    Menu,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    Calendar
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import mavinlogo from "@/public/mavinlogo.png"
import mavinlogodark from "@/public/mavin-logo-dark.png"

interface NavItem {
    name: string
    view: string
    icon: any
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    activeView: string
    onViewChange: (view: string) => void
    isCollapsed: boolean
    toggleCollapse: () => void
    navItems?: NavItem[]
}

export function Sidebar({ className, activeView, onViewChange, isCollapsed, toggleCollapse, navItems: customNavItems }: SidebarProps) {
    const defaultNavItems = [
        { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { name: "Tasks", view: "tasks", icon: Calendar },
        { name: "Analytics", view: "analytics", icon: BarChart3 },
        { name: "Connected Accounts", view: "accounts", icon: Users },
        { name: "Settings", view: "settings", icon: Settings },
        { name: "Profile", view: "profile", icon: User },
        { name: "Subscription", view: "subscription", icon: CreditCard },
        { name: "Support", view: "support", icon: HelpCircle },
    ]

    const navItems = customNavItems || defaultNavItems

    return (
        <div className={cn(
            "relative flex flex-col h-screen border-r border-border bg-sidebar transition-all duration-300",
            isCollapsed ? "w-16" : "w-60",
            className
        )}>
            {/* Logo */}
            <div className="flex items-center h-16 px-4 border-b border-border">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <Image src={mavinlogo} alt="MavinMail" className="w-7 h-7 rounded-md flex-shrink-0 hidden dark:block" width={28} height={28} />
                    <Image src={mavinlogodark} alt="MavinMail" className="h-7 w-auto object-contain flex-shrink-0 block dark:hidden" width={120} height={28} />
                    {!isCollapsed && (
                        <span className="text-[14px] font-semibold text-sidebar-foreground tracking-[-0.02em]">
                            MavinMail
                        </span>
                    )}
                </Link>
            </div>

            {/* Nav */}
            <div className="flex-1 py-3 overflow-y-auto">
                <nav className="grid gap-0.5 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.view}
                            className={cn(
                                "flex items-center gap-3 h-9 px-3 rounded-md text-[13px] font-medium transition-colors w-full text-left",
                                activeView === item.view
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                                isCollapsed && "justify-center px-0"
                            )}
                            onClick={() => onViewChange(item.view)}
                        >
                            {(item.icon as any) && <item.icon className={cn(
                                "h-4 w-4 flex-shrink-0",
                                activeView === item.view ? "text-primary" : "text-muted-foreground"
                            )} />}
                            {!isCollapsed && <span>{item.name}</span>}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-border">
                <button
                    className="w-full flex items-center justify-center h-8 rounded-md text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                    onClick={toggleCollapse}
                >
                    {isCollapsed
                        ? React.createElement(ChevronRight as any, { className: "h-4 w-4" })
                        : React.createElement(ChevronLeft as any, { className: "h-4 w-4" })
                    }
                </button>
            </div>
        </div>
    )
}

export function MobileSidebar({ activeView, onViewChange, navItems }: { activeView: string, onViewChange: (view: string) => void, navItems?: NavItem[] }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-500">
                    {React.createElement(Menu as any, { className: "h-5 w-5" })}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar border-border w-60 text-sidebar-foreground">
                <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <Sidebar
                    activeView={activeView}
                    onViewChange={(view) => {
                        onViewChange(view)
                        setOpen(false)
                    }}
                    isCollapsed={false}
                    toggleCollapse={() => { }}
                    className="border-none"
                    navItems={navItems}
                />
            </SheetContent>
        </Sheet>
    )
}
