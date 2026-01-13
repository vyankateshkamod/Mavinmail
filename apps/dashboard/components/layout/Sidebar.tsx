"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    Bot,
    BarChart3,
    Calendar
} from "lucide-react"
import Image from "next/image"
import mavinlogo from "@/public/mavinlogo.png"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    activeView: string
    onViewChange: (view: string) => void
    isCollapsed: boolean
    toggleCollapse: () => void
}

export function Sidebar({ className, activeView, onViewChange, isCollapsed, toggleCollapse }: SidebarProps) {
    const navItems = [
        { name: "Dashboard", view: "dashboard", icon: LayoutDashboard },
        { name: "Tasks", view: "tasks", icon: Calendar },
        { name: "Analytics", view: "analytics", icon: BarChart3 },
        { name: "Connected Accounts", view: "accounts", icon: Users },
        { name: "Settings", view: "settings", icon: Settings },
        { name: "Profile", view: "profile", icon: User },
        { name: "Subscription", view: "subscription", icon: CreditCard },
        { name: "Support", view: "support", icon: HelpCircle },
    ]

    return (
        <div className={cn("relative flex flex-col h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300", isCollapsed ? "w-16" : "w-64", className)}>
            <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
                <Image
                    src={mavinlogo}
                    alt="MavinMail Logo"
                    className="w-6 h-6 mr-2"
                    width={24}
                    height={24}
                />
                {!isCollapsed && <span className="text-lg font-bold text-sidebar-foreground tracking-wider">MavinMail</span>}
            </div>

            <div className="flex-1 py-4">
                <nav className="grid gap-1 px-2">
                    {navItems.map((item) => (
                        <Button
                            key={item.view}
                            variant="ghost"
                            className={cn(
                                "justify-start transition-all duration-200 rounded-none border-l-2 border-transparent",
                                activeView === item.view
                                    ? "bg-sidebar-primary/10 text-sidebar-primary border-sidebar-primary"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:border-sidebar-accent-foreground/50",
                                isCollapsed ? "justify-center px-2" : "px-4"
                            )}
                            onClick={() => onViewChange(item.view)}
                        >
                            {(item.icon as any) && <item.icon className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3", activeView === item.view && "stroke-[2.5px]")} />}
                            {!isCollapsed && <span>{item.name}</span>}
                        </Button>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-sidebar-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="w-full flex items-center justify-center text-sidebar-foreground/70 hover:text-sidebar-primary"
                    onClick={toggleCollapse}
                >
                    {isCollapsed ? React.createElement(ChevronRight as any, { className: "h-5 w-5" }) : React.createElement(ChevronLeft as any, { className: "h-5 w-5" })}
                </Button>
            </div>
        </div>
    )
}

export function MobileSidebar({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-sidebar-foreground/70">
                    {React.createElement(Menu as any, { className: "h-6 w-6" })}
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 bg-sidebar border-sidebar-border w-64 text-sidebar-foreground">
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
                />
            </SheetContent>
        </Sheet>
    )
}
