'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getDashboardStats,
    getActivityFeed,
    getUsageTrends,
    getUserProfile,
    getConnectedAccounts,
} from '@/lib/api';
import type {
    DashboardStats,
    ActivityItem,
    UsageTrend,
} from '@/lib/types';

/**
 * Dashboard data state
 */
interface DashboardData {
    stats: DashboardStats | null;
    activities: ActivityItem[];
    trends: UsageTrend[];
    userEmail: string;
    userName: string;
}

/**
 * Dashboard hook return type
 */
interface UseDashboardReturn {
    data: DashboardData;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    lastUpdated: Date | null;
}

/**
 * Custom hook for fetching and managing dashboard data
 * Handles loading states, errors, and provides refresh capability
 */
// Module-level cache to persist data across tab switches
let cachedData: DashboardData | null = null;
let cachedLastUpdated: Date | null = null;

/**
 * Custom hook for fetching and managing dashboard data
 * Handles loading states, errors, and provides refresh capability
 */
export function useDashboard(): UseDashboardReturn {
    // Initialize state from cache if available
    const [data, setData] = useState<DashboardData>(cachedData || {
        stats: null,
        activities: [],
        trends: [],
        userEmail: '',
        userName: 'User',
    });
    // If we have cached data, we're not loading initially
    const [isLoading, setIsLoading] = useState(!cachedData);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(cachedLastUpdated);

    const fetchData = useCallback(async (force = false) => {
        // If we have clean cached data and aren't forcing a refresh, do nothing
        if (cachedData && !force) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch all data in parallel for better performance
            const [stats, activities, trends, profile, accounts] = await Promise.all([
                getDashboardStats(),
                getActivityFeed(10),
                getUsageTrends(7),
                getUserProfile(),
                getConnectedAccounts(),
            ]);

            const newData = {
                stats: {
                    ...stats,
                    connectedAccounts: accounts.length,
                },
                activities,
                trends,
                userEmail: profile.email,
                userName: (profile.firstName && profile.lastName)
                    ? `${profile.firstName} ${profile.lastName}`
                    : (profile.firstName || profile.email.split('@')[0] || 'User'),
            };

            // Update state and cache
            setData(newData);
            cachedData = newData;

            const newDate = new Date();
            setLastUpdated(newDate);
            cachedLastUpdated = newDate;

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load dashboard data';
            setError(message);
            console.error('Dashboard data fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch data on mount only if no cache
    useEffect(() => {
        // Pass false to use cache if available
        fetchData(false);
    }, [fetchData]);

    // Manual refresh function that forces an update
    const handleRefresh = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    return {
        data,
        isLoading,
        error,
        refresh: handleRefresh,
        lastUpdated,
    };
}

/**
 * Format minutes into human-readable time string
 */
export function formatTimeSaved(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format relative timestamp (e.g., "2h ago", "1d ago")
 */
export function formatRelativeTime(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
