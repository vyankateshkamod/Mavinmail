import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Calendar, Plus } from "lucide-react";

function PathsScreen() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-[#121212] text-white p-8 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Email Summary Scheduler</h1>
          <p className="text-sm text-gray-400 mt-1">
            Automate your inbox summaries and stay focused.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-[#31B8C6] text-black px-3 py-1.5 rounded-lg font-medium text-xs hover:bg-[#27a2ad] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden max-[500]:hidden min-[600px]:inline">Create Task</span>
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-1 flex-col items-center justify-center border border-[#262626] rounded-2xl p-10 bg-[#171717] shadow-lg">
        <div className="text-center">
          <h2 className="text-gray-300 text-base font-medium mb-2">
            No tasks yet
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Schedule your first automated summary or weekly digest.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#22d3ee] text-black px-4 py-2 rounded-xl hover:bg-[#1bbccf] transition-all text-sm font-medium"
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Example Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
        {[
          {
            title: "Daily Summary Report",
            time: "Every day at 8:00 AM",
            desc: "Receive a concise summary of yesterday’s important emails and meetings.",
          },
          {
            title: "Weekly Client Digest",
            time: "Every Monday at 9:00 AM",
            desc: "Get a detailed overview of client communications and open threads.",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            whileHover={{ y: -3 }}
            className="bg-[#171717] rounded-2xl p-5 border border-[#262626] shadow-sm hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-base mb-1">{card.title}</h3>
            <div className="flex items-center text-gray-400 text-xs mb-2">
              <Clock className="w-4 h-4 mr-1" /> {card.time}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{card.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Create Task Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#171717] text-white rounded-2xl p-6 w-[90%] md:w-[480px] border border-[#262626] shadow-lg"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Create New Task</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg hover:bg-[#262626] transition"
                >
                  <X className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Frequency Options */}
              <div className="flex flex-wrap gap-2 mb-4">
                {["Once", "Daily", "Weekly", "Monthly"].map((freq) => (
                  <button
                    key={freq}
                    className="px-3 py-1.5 bg-[#262626] rounded-lg text-xs font-medium text-gray-300 hover:bg-[#333] hover:text-white transition-all"
                  >
                    {freq}
                  </button>
                ))}
              </div>

              {/* Time Input */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">
                  Send Time
                </label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full bg-[#121212] p-2 rounded-lg outline-none border border-[#333] text-sm text-gray-200 focus:ring-1 focus:ring-[#22d3ee] transition"
                />
              </div>

              {/* Summary Type */}
              <div className="mb-4">
                <label className="block text-xs text-gray-400 mb-1">
                  Summary Type / Instructions
                </label>
                <textarea
                  placeholder="E.g. Summarize today’s unread emails and key client threads."
                  className="w-full bg-[#121212] p-3 rounded-lg outline-none border border-[#333] text-sm text-gray-200 resize-none h-24 focus:ring-1 focus:ring-[#22d3ee] transition"
                ></textarea>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-gray-500">2 daily tasks remaining</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-[#22d3ee] text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1bbccf] transition-all"
                >
                  Create Task
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PathsScreen;
