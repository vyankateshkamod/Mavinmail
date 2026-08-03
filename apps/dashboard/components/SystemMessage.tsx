"use client"

import * as React from "react"
import { getPublicSystemStatus } from "@/lib/api"
import { AlertCircle, Terminal, X } from "lucide-react"

interface SystemStatus {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    announcement: string;
    announcementActive: boolean;
}

export function SystemMessage() {
    const [status, setStatus] = React.useState<SystemStatus | null>(null)
    const [isVisible, setIsVisible] = React.useState(true)

    React.useEffect(() => {
        const fetchStatus = async () => {
            const data = await getPublicSystemStatus()
            setStatus(data)
        }
        fetchStatus()

        // Poll every minute
        const interval = setInterval(fetchStatus, 60000)
        return () => clearInterval(interval)
    }, [])

    if (!status || !isVisible) return null

    // 1. Maintenance Mode (Highest Priority)
    if (status.maintenanceMode) {
        return (
            <div className="w-full bg-[#ef4444] text-white px-4 py-3 text-sm flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 font-medium">
                <div className="flex items-center gap-2 mx-auto">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{status.maintenanceMessage || "System maintenance is in progress."}</span>
                </div>
            </div>
        )
    }

    // 2. Global Announcement
    if (status.announcementActive && status.announcement) {
        return (
            <div className="w-full bg-[#22d3ee] text-black px-4 py-2.5 text-sm flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300 font-medium">
                <div className="flex items-center gap-2 mx-auto">
                    <Terminal className="w-4 h-4 shrink-0" />
                    <span>{status.announcement}</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="text-black/60 hover:text-black transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        )
    }

    return null
}
