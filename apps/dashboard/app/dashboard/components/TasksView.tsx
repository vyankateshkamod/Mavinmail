"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Clock, Calendar, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getTasks, createTask, cancelTask } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Task {
    id: number;
    type: string;
    frequency: string;
    time: string;
    status: string;
}

export function TasksView() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);

    // New Task State
    const [type, setType] = useState("morning-briefing");
    const [frequency, setFrequency] = useState("daily");
    const [time, setTime] = useState("08:00");

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setIsLoading(true);
        const data = await getTasks();
        setTasks(data);
        setIsLoading(false);
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

    const handleDelete = async (id: number) => {
        try {
            await cancelTask(id);
            loadTasks();
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-3 text-center py-10 text-muted-foreground">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <Card className="col-span-3 border-dashed">
                        <CardHeader className="text-center">
                            <CardTitle className="text-muted-foreground">No tasks scheduled yet</CardTitle>
                            <CardDescription>Create your first task to get started.</CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    tasks.map((task) => (
                        <Card key={task.id} className="relative group hover:shadow-md transition-all">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(task.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 capitalize">
                                    {task.type.replace("-", " ")}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> {task.time} ({task.frequency})
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider", task.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground')}>
                                        {task.status}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
