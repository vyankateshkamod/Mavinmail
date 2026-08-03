"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Calendar, CheckCircle, FileText, ChevronDown, ChevronRight, X, ChevronUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTasks, createTask, cancelTask, getActivityFeed, deleteActivity } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
    id: number;
    type: string;
    frequency: string;
    time: string;
    status: string;
}

interface Activity {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    success: boolean;
    metadata?: any;
}

export function TasksView() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);

    // Activity / History State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [selectedBriefing, setSelectedBriefing] = useState<Activity | null>(null);

    // New Task State
    const [type, setType] = useState("morning-briefing");
    const [frequency, setFrequency] = useState("daily");
    const [time, setTime] = useState("08:00");

    // UI State
    const [openTaskIds, setOpenTaskIds] = useState<number[]>([]);

    useEffect(() => {
        loadTasks();
        loadActivities();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        const data = await getTasks();
        setTasks(data);
        setIsLoading(false);
    };

    const loadActivities = async () => {
        try {
            const data = await getActivityFeed(50);
            setActivities(data);
        } catch (error) {
            console.error("Failed to load activities", error);
        }
    };

    const handleCreate = async () => {
        try {
            await createTask({ type, frequency, time });
            setShowDialog(false);
            loadTasks();
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Delete this schedule?")) return;
        try {
            await cancelTask(id);
            loadTasks();
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const handleDeleteActivity = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("Delete this briefing report?")) return;

        setActivities(prev => prev.filter(a => a.id !== id));
        try {
            await deleteActivity(id);
        } catch (error) {
            console.error("Failed to delete activity", error);
            loadActivities(); // Revert
        }
    };

    const toggleTask = (id: number) => {
        setOpenTaskIds(prev =>
            prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
        );
    };

    const getActivitiesForTask = (taskType: string) => {
        const actionType = taskType === 'morning-briefing' ? 'digest' : taskType;
        return activities.filter(a => a.action === actionType);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tasks & Schedules</h2>
                    <p className="text-muted-foreground">Manage your automated email briefings and reminders.</p>
                </div>

                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#22d3ee] text-black hover:bg-[#1bbccf]">
                            <Plus className="mr-2 h-4 w-4" /> New Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Schedule New Task</DialogTitle>
                            <DialogDescription>
                                Automate your email workflow with a new recurring task.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">Type</Label>
                                <div className="col-span-3">
                                    <select
                                        id="type"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="morning-briefing">Morning Briefing</option>
                                        <option value="check-reply">Check Reply (Follow-up)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="freq" className="text-right">Frequency</Label>
                                <div className="col-span-3">
                                    <select
                                        id="freq"
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="once">Once</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="time" className="text-right">Time</Label>
                                <Input
                                    id="time"
                                    type={frequency === 'daily' ? "time" : "datetime-local"}
                                    value={time}
                                    onChange={(e) => setTime(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate}>Create Schedule</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {isLoading ? (
                    <div className="text-center py-20 text-muted-foreground">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-10">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="p-4 rounded-full bg-muted mb-4">
                                <Clock className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No tasks scheduled</h3>
                            <p className="text-muted-foreground max-w-sm mt-2 mb-6">Create your first task to automate your daily email briefings.</p>
                            <Button onClick={() => setShowDialog(true)}>Get Started</Button>
                        </div>
                    </div>
                ) : (
                    tasks.map((task) => {
                        const taskActivities = getActivitiesForTask(task.type);
                        const isOpen = openTaskIds.includes(task.id);

                        return (
                            <Collapsible
                                key={task.id}
                                open={isOpen}
                                onOpenChange={() => toggleTask(task.id)}
                                className="group/task bg-card border rounded-lg overflow-hidden hover:border-primary/20 transition-all"
                            >
                                <div
                                    className="flex items-center justify-between p-4 cursor-pointer"
                                    onClick={() => toggleTask(task.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <RefreshCw className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-sm capitalize flex items-center gap-2">
                                                {task.type.replace("-", " ")}
                                                <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider border", task.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-muted text-muted-foreground border-transparent')}>
                                                    {task.status}
                                                </span>
                                            </h3>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {task.time}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                <span className="capitalize">{task.frequency}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block mr-4">
                                            <p className="text-xs font-medium">{taskActivities.length} Reports</p>
                                            <p className="text-[10px] text-muted-foreground">Latest: {taskActivities[0] ? new Date(taskActivities[0].timestamp).toLocaleDateString() : 'None'}</p>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
                                            onClick={(e) => handleDelete(e, task.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>

                                        <CollapsibleTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
                                        <div className="py-3 flex items-center justify-between">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Briefing History</p>
                                        </div>

                                        {taskActivities.length === 0 ? (
                                            <div className="flex py-6 justify-center items-center text-xs text-muted-foreground italic border-2 border-dashed rounded-lg">
                                                No history available yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-2 pl-4 border-l-2 border-border ml-5">
                                                {taskActivities.map((activity) => (
                                                    <div
                                                        key={activity.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors cursor-pointer group/item text-sm"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedBriefing(activity); }}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <FileText className="h-4 w-4 text-primary opacity-70" />
                                                            <div className="min-w-0 flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {new Date(activity.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                                <span className="text-muted-foreground truncate opacity-70">
                                                                    — {activity.metadata?.emailCount ? `${activity.metadata.emailCount} emails processed` : activity.description}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover/item:opacity-100 hover:text-red-500 transition-all"
                                                                onClick={(e) => handleDeleteActivity(e, activity.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-50" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        );
                    })
                )}
            </div>

            {/* Briefing Detail Dialog */}
            <Dialog open={!!selectedBriefing} onOpenChange={(open) => !open && setSelectedBriefing(null)}>
                <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-0 p-0 overflow-hidden">
                    <DialogHeader className="px-6 py-4 border-b bg-muted/40 shrink-0">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle>Daily Briefing Report</DialogTitle>
                                <DialogDescription>
                                    {selectedBriefing && new Date(selectedBriefing.timestamp).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                            {(selectedBriefing?.metadata?.summary || selectedBriefing?.description || '').replace(/\*\*/g, '').replace(/__/, '')}
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-muted/40 shrink-0">
                        <Button variant="outline" onClick={() => setSelectedBriefing(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
