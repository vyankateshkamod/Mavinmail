"use client"

import * as React from "react"

import { useState, useEffect } from "react"
import { getAuditLogs } from "@/lib/api"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ChevronLeft, ChevronRight, Search } from "lucide-react"

export function AuditLogsView() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchLogs()
    }, [page])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await getAuditLogs({ page, limit: 20 })
            setLogs(data.logs)
            setTotalPages(data.pagination.pages)
        } catch (error) {
            console.error("Failed to fetch audit logs:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            </div>

            <Card className="rounded-lg border-border">
                <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Security Audit Trail
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Metadata</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading logs...
                                        </TableCell>
                                    </TableRow>
                                ) : logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No audit logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{log.actor?.email || "Unknown"}</span>
                                                    <span className="text-xs text-muted-foreground">ID: {log.actorId}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-mono">
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.targetType} #{log.targetId}
                                            </TableCell>
                                            <TableCell>
                                                <pre className="text-[10px] text-muted-foreground overflow-x-auto max-w-[200px]">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                                {log.ipAddress && (
                                                    <div className="text-[10px] text-muted-foreground mt-1 text-blue-400">
                                                        IP: {log.ipAddress}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-muted-foreground">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
