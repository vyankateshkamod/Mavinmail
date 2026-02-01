"use client"

import { Book, HelpCircle, Bell, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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

    // Determine display name: prefer name, fallback to email username, then "User"
    const displayName = session?.user?.name || session?.user?.email?.split('@')[0] || "User"

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6">
            <MobileSidebar activeView={activeView} onViewChange={onViewChange} navItems={navItems} />

            <div className="flex flex-1 items-center gap-4">
                <Breadcrumb className="hidden md:flex">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild className="text-muted-foreground hover:text-primary">
                                <Link href="/dashboard">Home</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="text-primary font-medium">{viewName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-muted/50 border-input pl-9 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50 rounded-none border-b focus:border-b-primary focus-visible:ring-0"
                    />
                </div>

                <ModeToggle />

                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-none">
                    <Book className="h-5 w-5" />
                    <span className="sr-only">Docs</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary rounded-none">
                    <HelpCircle className="h-5 w-5" />
                    <span className="sr-only">Support</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 flex items-center gap-2 px-2 hover:bg-muted/50 rounded-none">
                            <span className="hidden sm:inline-block text-sm font-medium">{displayName}</span>
                            <Avatar className="h-8 w-8 border border-border rounded-none">
                                <AvatarImage src={session?.user?.image || "/avatars/01.png"} alt="@user" className="rounded-none object-cover" />
                                <AvatarFallback className="bg-muted text-primary rounded-none font-medium text-xs">
                                    {getInitials(displayName)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-card border-border text-foreground" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">
                                    {displayName}
                                </p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {session?.user?.email || "user@example.com"}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem className="focus:bg-muted focus:text-primary" onClick={() => onViewChange('profile')}>
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-muted focus:text-primary" onClick={() => onViewChange('settings')}>
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem
                            className="focus:bg-muted focus:text-primary text-destructive"
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
