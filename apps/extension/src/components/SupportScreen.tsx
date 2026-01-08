

import { useState } from "react";

export default function SupportScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);

  const faqs = [
    {
      question: "How does On-Demand Thread Summarization work?",
      answer:
        "A 'Summarize' button appears on any email thread with more than 3 replies. Clicking it instantly generates a concise summary with key points and actions.",
    },
    {
      question: "What does the AI-Powered Writing Assistant do?",
      answer:
        "It improves tone, clarity, and structure. You can ask it to make your email more formal, concise, or professional.",
    },
    {
      question: "What is the Daily Digest feature?",
      answer:
        "It gives you a summary of important emails from the previous day, with highlights of urgent replies or key updates.",
    },
    {
      question: "How does Automated Triage & Labeling work?",
      answer:
        "It automatically categorizes emails into Focus, Review, or Archive, helping you maintain a clean, prioritized inbox.",
    },
    {
      question: "What is Agentic Search (Ask Your Inbox)?",
      answer:
        "You can search your entire inbox using natural language queries, like 'Find invoice from Figma last month'.",
    },
    {
      question: "Can I connect multiple Gmail accounts?",
      answer:
        "Yes. You can integrate multiple accounts and view them under a unified inbox.",
    },
    {
      question: "What are Custom User Instructions & Triggers?",
      answer:
        "You can automate tasks like sending daily summaries or auto-labeling invoices using a simple if-this-then-that rule builder.",
    },
    {
      question: "What is Smart Reply?",
      answer:
        "It suggests short, context-aware replies to emails, such as 'Thanks, I’ll look into it' or 'Got it, will respond by EOD'.",
    },
  ];

  return (
    <div className="flex h-screen bg-[#121212] text-white overflow-hidden">
      {/* Scrollable content area only */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-semibold mb-4">Support</h1>
          <p className="text-sm text-gray-400 mb-6">
            Find answers to common questions or create a support ticket below.
          </p>

          {/* FAQ Section */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-[#171717] rounded-xl border border-[#262626]"
              >
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex justify-between items-center p-4 text-left text-sm font-medium text-gray-200 hover:text-white"
                >
                  <span>{faq.question}</span>
                  <span className="text-gray-400">
                    {openIndex === index ? "−" : "+"}
                  </span>
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-400 text-sm">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact and Ticket Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Still need help? Contact us or create a support ticket below.
            </p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => (window.location.href = "mailto:support@meeco.ai")}
                className="px-4 py-2 bg-[#22d3ee] text-sm rounded-lg hover:bg-[#1bbccf] transition text-[#121212] font-semibold"
              >
                Contact Us
              </button>
              <button
                onClick={() => setShowTicketForm(true)}
                className="px-4 py-2 bg-[#171717] border border-[#22d3ee]/30 text-sm rounded-lg hover:bg-[#22d3ee]/10 text-[#22d3ee] transition"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal for Create Ticket */}
      {showTicketForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#171717] rounded-2xl p-6 w-full max-w-md border border-[#262626]">
            <h2 className="text-lg font-semibold mb-2">Create Support Ticket</h2>
            <p className="text-sm text-gray-400 mb-4">
              Describe your issue below and our team will get back to you soon.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Ticket submitted successfully!");
                setShowTicketForm(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm text-gray-300">Issue Title</label>
                <input
                  type="text"
                  required
                  placeholder="Enter a short title"
                  className="w-full mt-1 p-2 text-sm rounded-md bg-[#121212] border border-[#333] text-gray-200 outline-none focus:border-[#22d3ee]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue"
                  className="w-full mt-1 p-2 text-sm rounded-md bg-[#121212] border border-[#333] text-gray-200 outline-none resize-none focus:border-[#22d3ee]"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="px-4 py-2 text-sm bg-[#262626] rounded-lg hover:bg-[#333] text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-[#22d3ee] rounded-lg hover:bg-[#1bbccf] text-[#121212] font-semibold"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
