import { useState } from 'react';

interface OnboardingScreenProps {
    login: (credentials: { email: string; password: string }) => Promise<void>;
    isMaintenanceMode?: boolean;
    maintenanceMessage?: string;
}

import { AlertCircle } from 'lucide-react'; // Ensure icon is imported

export default function OnboardingScreen({ login, isMaintenanceMode = false, maintenanceMessage }: OnboardingScreenProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading || isMaintenanceMode) return; // Prevent submit in maintenance

        setError('');
        setLoading(true);

        try {
            await login({ email, password });
            // App.tsx will handle the state change based on token presence
        } catch (err: any) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-white dark:bg-[#0A0A0A] text-gray-900 dark:text-white overflow-hidden relative selection:bg-[#22d3ee] selection:text-black font-sans">

            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#22d3ee]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#3b82f6]/5 blur-[120px] rounded-full pointer-events-none" />

            {/* Main Content Container */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 w-full max-w-sm mx-auto">

                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="h-16 mb-6 rounded-2xl bg-white dark:bg-gradient-to-tr dark:from-[#171717] dark:to-[#262626] border border-transparent dark:border-[#333] flex items-center justify-center shadow-2xl shadow-black/5 dark:shadow-black/50 overflow-hidden p-0 dark:p-1 dark:w-16">
                        <img src="/mavinlogo.png" alt="Mavin Logo" className="w-full h-full object-cover hidden dark:block" />
                        <img src="/mavin-logo-dark.png" alt="Mavin Logo" className="h-full w-auto object-contain block dark:hidden" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent mb-2">
                        Welcome to Mavin
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-[260px]">
                        Your intelligent email assistant. <br /> Sign in to start your productive day.
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

                    {isMaintenanceMode && (
                        <div className="w-full mb-2 bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-3 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-300">
                            <AlertCircle className="w-5 h-5 text-[#ef4444] shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <h3 className="text-[#ef4444] font-medium text-sm mb-0.5">System Maintenance</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
                                    {maintenanceMessage || "We're currently performing scheduled maintenance. Check back soon."}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <input
                                id="email"
                                type="email"
                                placeholder="Email address"
                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-all group-hover:border-gray-300 dark:group-hover:border-[#333] ${isMaintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isMaintenanceMode}
                                autoComplete="email"
                            />
                        </div>

                        <div className="relative group">
                            <input
                                id="password"
                                type="password"
                                placeholder="Password"
                                className={`w-full px-4 py-3 bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#262626] rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-[#22d3ee] focus:ring-1 focus:ring-[#22d3ee] transition-all group-hover:border-gray-300 dark:group-hover:border-[#333] ${isMaintenanceMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isMaintenanceMode}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || isMaintenanceMode}
                        className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all transform active:scale-[0.98]
              ${(loading || isMaintenanceMode)
                                ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-[#333]'
                                : 'bg-[#22d3ee] text-black hover:bg-[#1bbccf] hover:shadow-[0_0_20px_-5px_#22d3ee]'
                            }
            `}
                    >
                        {loading ? 'Signing in...' : isMaintenanceMode ? 'System Maintenance' : 'Sign In'}
                    </button>
                </form>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500">
                        Don't have an account?{' '}
                        <a
                            href="#"
                            className="text-gray-600 dark:text-gray-400 hover:text-[#22d3ee] dark:hover:text-[#22d3ee] transition-colors underline decoration-dotted decoration-gray-400 dark:decoration-gray-600 hover:decoration-[#22d3ee] dark:hover:decoration-[#22d3ee]"
                            onClick={(e) => {
                                e.preventDefault();
                                // Handle signup click or link to website
                                window.open('https://mavin.mail/signup', '_blank');
                            }}
                        >
                            Get started
                        </a>
                    </p>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-4 w-full text-center">
                <p className="text-[10px] text-gray-600 font-medium tracking-wider uppercase opacity-50">Powered by Mavin AI</p>
            </div>
        </div>
    );
}
