"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Check, Zap, Coins, Crown, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { getUserCredits, upgradeToPro, topUpCredits } from "@/lib/api"

interface CreditData {
    credits: number
    plan: string
}

const FEATURE_COSTS = [
    { name: "Summarize Email", cost: 5 },
    { name: "Draft Reply", cost: 10 },
    { name: "Enhance Text", cost: 2 },
    { name: "Ask Question (RAG)", cost: 15 },
    { name: "Autocomplete", cost: 1 },
    { name: "Schedule Task", cost: 20 },
]

export function SubscriptionView() {
    const [creditData, setCreditData] = useState<CreditData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [proCode, setProCode] = useState("")
    const [topUpCode, setTopUpCode] = useState("")
    const [proLoading, setProLoading] = useState(false)
    const [topUpLoading, setTopUpLoading] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const fetchCredits = async () => {
        try {
            const data = await getUserCredits()
            setCreditData(data)
        } catch {
            setCreditData({ credits: 0, plan: "FREE" })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCredits()
    }, [])

    const handleUpgradePro = async () => {
        if (!proCode.trim()) return
        setProLoading(true)
        setMessage(null)
        try {
            const result = await upgradeToPro(proCode.trim())
            setCreditData({ credits: result.credits, plan: result.plan })
            setMessage({ type: "success", text: result.message })
            setProCode("")
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.error || "Invalid promo code." })
        } finally {
            setProLoading(false)
        }
    }

    const handleTopUp = async () => {
        if (!topUpCode.trim()) return
        setTopUpLoading(true)
        setMessage(null)
        try {
            const result = await topUpCredits(topUpCode.trim())
            setCreditData({ credits: result.credits, plan: result.plan })
            setMessage({ type: "success", text: result.message })
            setTopUpCode("")
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.error || "Invalid top-up code." })
        } finally {
            setTopUpLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const isAdmin = creditData?.plan === "ADMIN"
    const isPro = creditData?.plan === "PRO"
    const isUnlimited = isAdmin || creditData?.credits === -1
    const credits = creditData?.credits ?? 0
    const maxCredits = isPro ? 10000 : 50
    const progressPercent = isUnlimited ? 100 : Math.min((credits / maxCredits) * 100, 100)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Subscription & Credits</h2>
                <p className="text-muted-foreground">Manage your plan, credits, and feature usage.</p>
            </div>

            {/* Status Message */}
            {message && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${message.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}>
                    {message.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                </div>
            )}

            {/* Current Plan Card */}
            <Card className="bg-card border-border border-l-4 border-l-primary">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                {isAdmin ? <Crown className="h-5 w-5 text-red-400" /> : isPro ? <Crown className="h-5 w-5 text-yellow-400" /> : <Zap className="h-5 w-5 text-primary" />}
                                Current Plan: {isAdmin ? "Admin" : isPro ? "Pro" : "Free"}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground mt-1">
                                {isAdmin
                                    ? "You have admin access with unlimited credits."
                                    : isPro
                                        ? "You're on the Pro plan with 10,000 credits."
                                        : "Free plan with 50 credits. Upgrade to Pro for more."}
                            </CardDescription>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : isPro
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-primary/20 text-primary border border-primary/30"
                            }`}>
                            {creditData?.plan}
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                                <Coins className="h-4 w-4" /> Credits Remaining
                            </span>
                            <span className="text-primary font-semibold text-lg">
                                {isUnlimited ? "∞ Unlimited" : credits.toLocaleString()}
                            </span>
                        </div>
                        {!isUnlimited && (
                            <>
                                <Progress value={progressPercent} className="h-3 bg-muted" />
                                <p className="text-xs text-muted-foreground text-right">
                                    {credits.toLocaleString()} / {maxCredits.toLocaleString()} credits
                                </p>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Action Cards — hidden for admins */}
            {!isAdmin && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Upgrade to Pro */}
                    <Card className={`bg-card border-border ${isPro ? "opacity-60" : ""}`}>
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Crown className="h-5 w-5 text-yellow-400" />
                                {isPro ? "Already Pro" : "Upgrade to Pro — $30"}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {isPro ? "You already have Pro access." : "Get 10,000 credits and Pro status."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> 10,000 AI Credits</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> All AI Features Unlocked</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-primary" /> Priority Support</li>
                            </ul>
                            {!isPro && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={proCode}
                                        onChange={(e) => setProCode(e.target.value)}
                                        placeholder="Enter promo code"
                                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            )}
                        </CardContent>
                        {!isPro && (
                            <CardFooter>
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                    onClick={handleUpgradePro}
                                    disabled={proLoading || !proCode.trim()}
                                >
                                    {proLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    Upgrade Now
                                </Button>
                            </CardFooter>
                        )}
                    </Card>

                    {/* Top-Up Credits */}
                    <Card className="bg-card border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Coins className="h-5 w-5 text-emerald-400" />
                                Top-Up Credits — $5
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                Add 1,000 credits to your balance instantly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-400" /> +1,000 Credits</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-400" /> No Expiration</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-emerald-400" /> Stack with any plan</li>
                            </ul>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={topUpCode}
                                    onChange={(e) => setTopUpCode(e.target.value)}
                                    placeholder="Enter top-up code"
                                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                variant="outline"
                                className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                onClick={handleTopUp}
                                disabled={topUpLoading || !topUpCode.trim()}
                            >
                                {topUpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Top-Up Now
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* Feature Cost Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground text-base">Feature Credit Costs</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Each AI feature consumes credits per use.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {FEATURE_COSTS.map((feature) => (
                            <div key={feature.name} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{feature.name}</p>
                                    <p className="text-xs text-muted-foreground">{feature.cost} credits</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
