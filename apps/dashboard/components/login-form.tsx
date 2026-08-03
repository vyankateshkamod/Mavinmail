"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (res?.error) {
                if (res.error === "Configuration") {
                    setError("Invalid email or password");
                } else if (res.code === "RateLimited" || res.error === "RateLimited") {
                    setError("Too many login attempts. Please try again after 15 minutes.");
                } else {
                    setError("Invalid email or password");
                }
            } else {
                router.push("/dashboard")
            }
        } catch (err) {
            setError("An unexpected error occurred")
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
                    {error && <p className="text-red-400 text-[13px]">{error}</p>}
                    <Button type="submit" className="w-full h-10 bg-foreground dark:bg-white text-background dark:text-[#0C0C0C] font-medium hover:bg-zinc-200 rounded-md mt-2">
                        Sign in
                    </Button>
                </div>
                <div className="mt-6 text-center text-[13px] text-muted-foreground dark:text-zinc-500">
                    Don&apos;t have an account?{" "}
                    <a href="/signup" className="text-foreground dark:text-white hover:text-[#24D3EE] transition-colors">
                        Sign up
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
