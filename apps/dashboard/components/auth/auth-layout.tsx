import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import mavinlogo from '@/public/mavinlogo.png'
import mavinlogodark from '@/public/mavin-logo-dark.png'

interface AuthLayoutProps {
    children: React.ReactNode
    heading: string
    subheading: string
    quote?: string
}

export function AuthLayout({ children, heading, subheading, quote }: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-background dark:bg-[#0C0C0C] text-foreground dark:text-white font-sans">
            <div className="flex min-h-screen max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
                {/* Left Side: Brand panel */}
                <div className="hidden lg:flex w-1/2 flex-col justify-between py-12 pr-16">
                    {/* Top Brand */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <Image src={mavinlogo} alt="MavinMail" className="w-7 h-7 rounded-md hidden dark:block" width={28} height={28} />
                        <Image src={mavinlogodark} alt="MavinMail" className="h-7 w-auto object-contain block dark:hidden" width={120} height={28} />
                        <span className="text-[15px] font-semibold text-foreground dark:text-white tracking-[-0.02em]">
                            MavinMail
                        </span>
                    </Link>

                    {/* Center content */}
                    <div className="max-w-sm">
                        <blockquote className="text-[28px] font-semibold leading-tight text-foreground dark:text-white tracking-[-0.02em]">
                            {quote || "Your inbox, intelligently handled."}
                        </blockquote>
                        <p className="mt-4 text-[15px] text-muted-foreground dark:text-zinc-500 leading-relaxed">
                            MavinMail reads, summarizes, and drafts replies so you can focus on what matters.
                        </p>
                    </div>

                    {/* Bottom */}
                    <p className="text-[12px] text-zinc-700">
                        &copy; 2026 MavinMail. All rights reserved.
                    </p>
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px bg-white/[0.06] my-12" />

                {/* Right Side: Form Container */}
                <div className="w-full lg:w-1/2 flex flex-col items-center justify-center py-12 lg:pl-16">
                    {/* Mobile Brand */}
                    <div className="lg:hidden self-start flex items-center gap-2.5 mb-12">
                        <Link href="/" className="flex items-center gap-2.5">
                            <Image src={mavinlogo} alt="MavinMail" className="w-7 h-7 rounded-md hidden dark:block" width={28} height={28} />
                            <Image src={mavinlogodark} alt="MavinMail" className="h-7 w-auto object-contain block dark:hidden" width={120} height={28} />
                            <span className="text-[15px] font-semibold text-foreground dark:text-white hidden dark:block">MavinMail</span>
                        </Link>
                    </div>

                    <div className="w-full max-w-[380px] space-y-8">
                        <div className="space-y-2">
                            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-foreground dark:text-white">
                                {heading}
                            </h1>
                            <p className="text-[14px] text-muted-foreground dark:text-zinc-500">
                                {subheading}
                            </p>
                        </div>

                        {/* Form content */}
                        <div className="space-y-6">
                            {children}
                        </div>

                        <p className="text-[12px] text-muted-foreground dark:text-zinc-600 text-center">
                            Your data stays private. Always.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
