import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Plus, Trash2, CheckCircle, FileText, ChevronRight, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import api, { deleteActivity } from "../services/api";
import { useAuth } from "../hooks/useAuth";

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

function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState({
    type: "morning-briefing",
    frequency: "daily",
    time: "08:00",
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [selectedBriefing, setSelectedBriefing] = useState<Activity | null>(null);

  const { token } = useAuth();

  useEffect(() => {
    if (token) {
      fetchTasks();
      fetchActivities();
    }
  }, [token]);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      console.error("Failed to fetch tasks", err);
      setError("Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      // Fetch more history to populate the list (limit 50)
      const res = await api.get("/dashboard/activity?limit=50");
      setActivities(res.data.activity || []);
    } catch (err) {
      console.error("Failed to fetch activities", err);
    }
  };

  const handleCreateTask = async () => {
    try {
      await api.post("/tasks", newTask);
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await api.delete(`/tasks/${id}`);
    } catch (err) {
      console.error("Failed to delete task", err);
      fetchTasks();
    }
  };

  const handleDeleteActivity = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("Delete this briefing report?")) return;

    setActivities(prev => prev.filter(a => a.id !== id));
    try {
      await deleteActivity(id);
    } catch (err) {
      console.error("Failed to delete activity", err);
      fetchActivities(); // Revert on failure
    }
  };

  const getActivitiesForTask = (taskType: string) => {
    const actionType = taskType === 'morning-briefing' ? 'digest' : taskType;
    return activities.filter(a => a.action === actionType);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white p-8 overflow-y-auto w-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#22d3ee]">Tasks & Schedules</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your automated email briefings.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-[#22d3ee] text-black px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#1bbccf] transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-8 h-8 border-2 border-[#22d3ee] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500 font-medium">Fetching your schedules...</div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4 text-center px-6">
          <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-2">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-red-400 font-medium">Connection Failed</h3>
          <p className="text-gray-500 text-sm mb-4">
            Could not retrieve your tasks. The backend server might be offline or unreachable.
          </p>
          <button
            onClick={() => { setError(null); fetchTasks(); fetchActivities(); }}
            className="px-4 py-2 bg-[#22d3ee]/10 text-[#22d3ee] rounded-lg hover:bg-[#22d3ee]/20 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center border border-gray-300 dark:border-[#262626] rounded-2xl p-10 bg-white/50 dark:bg-[#171717]/50 backdrop-blur-sm shadow-xl">
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 bg-gray-100 dark:bg-[#262626] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-gray-900 dark:text-gray-200 text-lg font-semibold mb-2">
              No active tasks
            </h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Schedule your Morning Briefing to save hours every week.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#22d3ee] text-black px-6 py-2.5 rounded-xl hover:bg-[#1bbccf] transition-all text-sm font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              Get Started
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-20">
          {tasks.map((task) => {
            const taskActivities = getActivitiesForTask(task.type);
            const isExpanded = expandedTaskId === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                className="bg-white dark:bg-[#171717] rounded-3xl p-6 border border-gray-300 dark:border-[#262626] shadow-lg hover:border-[#22d3ee]/30 dark:hover:border-[#22d3ee]/30 transition-all group overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1 capitalize text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      {task.type.replace("-", " ")}
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest ${task.status === 'active' ? 'bg-green-500/10 text-green-500 dark:text-green-400 border border-green-500/20' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300 dark:border-gray-700'}`}>
                        {task.status}
                      </span>
                    </h3>

                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-xs mt-2">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#22d3ee]" />
                        <span>{task.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                        <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                        <span>{task.frequency}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                      className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626] rounded-xl transition-all"
                      title={isExpanded ? "Collapse History" : "Show History"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* History Section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6 pt-4 border-t border-gray-300 dark:border-[#262626]">
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Briefing History</h4>

                        {taskActivities.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No briefings generated yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {taskActivities.map((activity) => (
                              <div
                                key={activity.id}
                                onClick={() => setSelectedBriefing(activity)}
                                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#262626] hover:bg-gray-100 dark:hover:bg-[#262626] hover:border-[#22d3ee]/30 cursor-pointer group/item transition-all"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#262626] flex items-center justify-center flex-shrink-0 text-[#22d3ee]">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate pr-2">
                                      {new Date(activity.timestamp).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </p>
                                    <p className="text-[10px] text-gray-500 truncate">
                                      {activity.metadata?.emailCount ? `${activity.metadata.emailCount} emails processed` : activity.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => handleDeleteActivity(e, activity.id)}
                                    className="p-1.5 text-gray-600 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    title="Delete this record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <ChevronRight className="w-4 h-4 text-gray-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedBriefing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedBriefing(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-[#121212] w-full max-w-2xl max-h-[85vh] rounded-2xl border border-gray-300 dark:border-[#333] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-[#262626] bg-gray-50 dark:bg-[#171717]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#22d3ee]/10 rounded-lg">
                    <FileText className="w-5 h-5 text-[#22d3ee]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily Briefing</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(selectedBriefing.timestamp).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBriefing(null)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-[#262626] rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                <div className="prose dark:prose-invert prose-sm max-w-none font-sans leading-relaxed whitespace-pre-wrap text-gray-800 dark:text-gray-300">
                  {(selectedBriefing.metadata?.summary || selectedBriefing.description || '').replace(/\*\*/g, '').replace(/__/, '')}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-gray-900/40 dark:bg-black/70 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-[#171717] text-gray-900 dark:text-white rounded-2xl p-6 w-[90%] md:w-[480px] border border-gray-300 dark:border-[#262626] shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Schedule New Task</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-[#262626] transition"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Task Type */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Task Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#121212] p-2 rounded-lg outline-none border border-gray-300 dark:border-[#333] text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-[#22d3ee] transition"
                >
                  <option value="morning-briefing">Morning Briefing</option>
                  <option value="check-reply">Check Reply (Follow-up)</option>
                </select>
              </div>

              {/* Frequency */}
              <div className="mb-4">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Frequency</label>
                <div className="flex gap-2">
                  {["daily", "once", "weekly"].map((freq) => (
                    <button
                      key={freq}
                      onClick={() => setNewTask({ ...newTask, frequency: freq })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${newTask.frequency === freq
                        ? "bg-[#22d3ee] text-black"
                        : "bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333]"
                        }`}
                    >
                      {freq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div className="mb-6">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {newTask.frequency === 'daily' ? 'Time of Day' : 'Date & Time'}
                </label>
                <input
                  type={newTask.frequency === 'daily' ? "time" : "datetime-local"}
                  value={newTask.time}
                  onChange={(e) => setNewTask({ ...newTask, time: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#121212] p-2 rounded-lg outline-none border border-gray-300 dark:border-[#333] text-sm text-gray-900 dark:text-gray-200 focus:ring-1 focus:ring-[#22d3ee] transition"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleCreateTask}
                  className="bg-[#22d3ee] text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1bbccf] transition-all w-full"
                >
                  Create Schedule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TasksScreen;
