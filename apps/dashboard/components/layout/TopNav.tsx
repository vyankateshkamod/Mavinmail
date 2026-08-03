"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MobileSidebar } from "./Sidebar"
import { ModeToggle } from "@/components/mode-toggle"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

interface TopNavProps {
    activeView: string
    onViewChange: (view: string) => void
    navItems?: any[]
}

export function TopNav({ activeView, onViewChange, navItems }: TopNavProps) {
    const { data: session } = useSession()
    const viewName = activeView.charAt(0).toUpperCase() + activeView.slice(1).replace("-", " ")

    const getInitials = (name?: string | null) => {
        if (!name) return "U"
        const parts = name.trim().split(" ")
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }

    const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "User"

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-sidebar px-6">
            <MobileSidebar activeView={activeView} onViewChange={onViewChange} navItems={navItems} />

            <div className="flex flex-1 items-center gap-4">
                {/* Breadcrumb */}
                <div className="hidden md:flex items-center gap-2 text-[13px]">
                    <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                        Home
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{viewName}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">

                <div className="flex items-center justify-center">
                    <ModeToggle />
                </div>

                {/* User dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-2 h-8 rounded-md hover:bg-accent transition-colors">
                            <span className="hidden sm:inline-block text-[13px] font-medium text-muted-foreground">{displayName}</span>
                            <Avatar className="h-6 w-6 rounded-md">
                                <AvatarImage src={session?.user?.image || "/avatars/01.png"} alt="@user" className="rounded-md object-cover" />
                                <AvatarFallback className="bg-accent text-primary rounded-md font-medium text-[10px]">
                                    {getInitials(displayName)}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-52 bg-popover border-border text-popover-foreground" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-[13px] font-medium">{displayName}</p>
                                <p className="text-[11px] text-muted-foreground">{session?.user?.email || "user@example.com"}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="text-[13px] text-muted-foreground focus:bg-accent focus:text-accent-foreground" onClick={() => onViewChange('profile')}>
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px] text-muted-foreground focus:bg-accent focus:text-accent-foreground" onClick={() => onViewChange('settings')}>
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                            className="text-[13px] text-destructive focus:bg-accent focus:text-destructive"
                            onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
