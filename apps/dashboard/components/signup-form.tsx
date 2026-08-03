"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

const SIGNUP_API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "")

export function SignupForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        try {
            // 1. Register with backend
            const res = await fetch(`${SIGNUP_API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Signup failed")
            }

            // 2. Auto-login on success
            const loginRes = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (loginRes?.error) {
                if (loginRes.error === "Configuration") {
                    setError("Signup successful, but auto-login failed. Please log in manually.");
                } else {
                    setError(loginRes.code || loginRes.error || "Signup successful, but login failed.");
                }
            } else {
                router.push("/dashboard")
            }

        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-5">
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-[13px] text-muted-foreground dark:text-zinc-400">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-10 bg-muted dark:bg-[#161616] border-border dark:border-white/[0.06] text-foreground dark:text-white placeholder:text-muted-foreground dark:text-zinc-600 rounded-md focus-visible:ring-[#24D3EE]/30 focus-visible:border-[#24D3EE]/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password" className="text-[13px] text-muted-foreground dark:text-zinc-400">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-10 bg-muted dark:bg-[#161616] border-border dark:border-white/[0.06] text-foreground dark:text-white placeholder:text-muted-foreground dark:text-zinc-600 rounded-md focus-visible:ring-[#24D3EE]/30 focus-visible:border-[#24D3EE]/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirmPassword" className="text-[13px] text-muted-foreground dark:text-zinc-400">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-10 bg-muted dark:bg-[#161616] border-border dark:border-white/[0.06] text-foreground dark:text-white placeholder:text-muted-foreground dark:text-zinc-600 rounded-md focus-visible:ring-[#24D3EE]/30 focus-visible:border-[#24D3EE]/50"
                        />
                    </div>
                    {error && <p className="text-red-400 text-[13px]">{error}</p>}
                    <Button type="submit" className="w-full h-10 bg-foreground dark:bg-white text-background dark:text-[#0C0C0C] font-medium hover:bg-zinc-200 rounded-md mt-2">
                        Create account
                    </Button>
                </div>
                <div className="mt-6 text-center text-[13px] text-muted-foreground dark:text-zinc-500">
                    Already have an account?{" "}
                    <a href="/login" className="text-foreground dark:text-white hover:text-[#24D3EE] transition-colors">
                        Sign in
                    </a>
                </div>
            </form>
            <div className="text-center text-[11px] text-zinc-700">
                By continuing, you agree to our <a href="#" className="text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:text-white transition-colors">Terms</a>{" "}
                and <a href="#" className="text-muted-foreground dark:text-zinc-500 hover:text-foreground dark:text-white transition-colors">Privacy Policy</a>.
            </div>
        </div>
    )
}
