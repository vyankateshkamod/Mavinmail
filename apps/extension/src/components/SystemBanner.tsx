import React, { useEffect, useState } from 'react';
import { getPublicSystemStatus } from '../services/api';
import { AlertCircle, Terminal } from 'lucide-react';

interface SystemStatus {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    announcement: string;
    announcementActive: boolean;
}

interface SystemBannerProps {
    status?: SystemStatus | null;
    hideMaintenance?: boolean;
}

const SystemBanner: React.FC<SystemBannerProps> = ({ status: propStatus, hideMaintenance = false }) => {
    const [localStatus, setLocalStatus] = useState<SystemStatus | null>(null);

    // Use prop status if provided, otherwise fetch locally (fallback)
    const status = propStatus || localStatus;

    // Fetch periodically only if prop is NOT provided
    useEffect(() => {
        if (propStatus) return;

        const fetchStatus = async () => {
            const data = await getPublicSystemStatus();
            setLocalStatus(data);
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, [propStatus]);

    if (!status) return null;

    // Priority 1: Maintenance Mode (Urgent - Red Card)
    if (status.maintenanceMode && !hideMaintenance) {
        return (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-900/40 dark:bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                <div className="w-full max-w-[320px] bg-white dark:bg-[#1C1E26] border border-red-500/20 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                    {/* Decorative header gradient */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                            <AlertCircle className="w-6 h-6" />
                        </div>

                        <h3 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">System Maintenance</h3>

                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                            {status.maintenanceMessage || "We're currently performing scheduled maintenance. Please check back shortly."}
                        </p>

                        {/* No dismiss button for maintenance - it blocks interaction */}
                    </div>
                </div>
            </div>
        );
    }

    // Priority 2: Global Announcement (Clean & Beautiful - Cyan Card)
    if (status.announcementActive && status.announcement) {
        // Local state for dismissal if using prop
        const [dismissed, setDismissed] = useState(false);
        if (dismissed) return null;

        return (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-[2px] p-6 animate-in fade-in duration-300">
                <div className="w-full max-w-[300px] bg-white dark:bg-[#181A20] border border-gray-300 dark:border-white/5 rounded-2xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">

                    <button
                        onClick={() => setDismissed(true)}
                        className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>

                    <div className="p-6 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-[#22d3ee]/10 rounded-full flex items-center justify-center mb-4 text-[#22d3ee]">
                            <Terminal className="w-5 h-5" />
                        </div>

                        <h3 className="text-gray-900 dark:text-white font-medium text-base mb-2">Update</h3>

                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-light">
                            {status.announcement}
                        </p>

                        <button
                            onClick={() => setDismissed(true)}
                            className="mt-6 w-full py-2 bg-[#22d3ee] hover:bg-[#22d3ee]/90 text-black text-sm font-semibold rounded-lg transition-all active:scale-[0.98]"
                        >
                            Okay, got it
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default SystemBanner;
