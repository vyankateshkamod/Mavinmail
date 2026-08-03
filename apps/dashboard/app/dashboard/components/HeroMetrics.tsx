'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Mail,
    FileText,
    Search,
    Clock,
    Edit3,
    MessageSquare,
    Sparkles,
    Link2
} from 'lucide-react';
import type { DashboardStats } from '@/lib/types';
import { formatTimeSaved } from '@/lib/hooks/useDashboard';
import { cn } from '@/lib/utils';

interface HeroMetricsProps {
    stats: DashboardStats | null;
    isLoading: boolean;
}

interface MetricCardData {
    key: keyof DashboardStats | 'timeSaved';
    title: string;
    icon: React.ElementType;
    format?: (value: number) => string;
}

const METRIC_CARDS: MetricCardData[] = [
    {
        key: 'totalEmails',
        title: 'Total Emails',
        icon: Mail,
    },
    {
        key: 'emailsToday',
        title: "Today's Emails",
        icon: FileText,
    },
    {
        key: 'questionsAnswered',
        title: 'RAG Queries',
        icon: Search,
    },
    {
        key: 'timeSaved',
        title: 'Time Saved',
        icon: Clock,
        format: formatTimeSaved,
    },
    {
        key: 'draftsGenerated',
        title: 'Drafts Generated',
        icon: Edit3,
    },
    {
        key: 'threadsSummarized',
        title: 'Summaries',
        icon: MessageSquare,
    },
    {
        key: 'textEnhancements',
        title: 'Text Enhanced',
        icon: Sparkles,
    },
    {
        key: 'connectedAccounts',
        title: 'Connected Accounts',
        icon: Link2,
    },
];

function SkeletonCard() {
    return (
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/[0.06] rounded-lg p-5 animate-pulse">
            <div className="flex items-center justify-between mb-4">
                <div className="h-3 w-20 bg-muted dark:bg-[#1a1a1a] rounded" />
                <div className="h-4 w-4 bg-muted dark:bg-[#1a1a1a] rounded" />
            </div>
            <div className="h-7 w-14 bg-muted dark:bg-[#1a1a1a] rounded" />
        </div>
    );
}

function MetricCard({
    metric,
    value,
    isLoading
}: {
    metric: MetricCardData;
    value: number;
    isLoading: boolean;
}) {
    const Icon = metric.icon;
    const displayValue = metric.format ? metric.format(value) : value.toLocaleString();

    if (isLoading) {
        return <SkeletonCard />;
    }

    return (
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/[0.06] rounded-lg p-5 hover:border-muted-foreground dark:hover:border-white/[0.1] transition-colors group">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[12px] font-medium text-muted-foreground dark:text-zinc-500 tracking-wide">
                    {metric.title}
                </p>
                <Icon className="h-4 w-4 text-muted-foreground dark:text-zinc-600 group-hover:text-primary dark:group-hover:text-[#24D3EE] transition-colors" />
            </div>
            <p className="text-[24px] font-bold text-foreground dark:text-white tracking-[-0.02em]">
                {displayValue}
            </p>
        </div>
    );
}

export function HeroMetrics({ stats, isLoading }: HeroMetricsProps) {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {METRIC_CARDS.map((metric) => {
                let value = 0;
                if (stats) {
                    if (metric.key === 'timeSaved') {
                        value = stats.timeSavedMinutes;
                    } else {
                        value = stats[metric.key] as number;
                    }
                }

                return (
                    <MetricCard
                        key={metric.key}
                        metric={metric}
                        value={value}
                        isLoading={isLoading}
                    />
                );
            })}
        </div>
    );
}
