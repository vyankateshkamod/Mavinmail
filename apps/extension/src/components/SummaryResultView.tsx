// feauture 5 code

// Helper function to format summary text - removes markdown and formats nicely
const formatSummary = (text: string): string => {
  if (!text) return '';

  let formatted = text;

  // Remove markdown bold (**text** or __text__)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '$1');
  formatted = formatted.replace(/__(.*?)__/g, '$1');

  // Remove markdown italic (*text* or _text_) - but be careful not to remove bullet points
  // Only remove if it's not at the start of a line (avoid removing bullet markers)
  formatted = formatted.split('\n').map(line => {
    // Only process italic if line doesn't start with bullet marker
    if (!/^[-*•]\s/.test(line.trim())) {
      line = line.replace(/\*([^*\n]+)\*(?!\*)/g, '$1');
      line = line.replace(/_([^_\n]+)_(?!_)/g, '$1');
    }
    return line;
  }).join('\n');

  // Remove markdown headers (# Header)
  formatted = formatted.replace(/^#+\s+/gm, '');

  // Remove markdown links [text](url) -> text
  formatted = formatted.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // Remove markdown code blocks
  formatted = formatted.replace(/```[\s\S]*?```/g, '');
  formatted = formatted.replace(/`([^`]+)`/g, '$1');

  // Remove markdown horizontal rules
  formatted = formatted.replace(/^---+\s*$/gm, '');
  formatted = formatted.replace(/^___+\s*$/gm, '');

  // Clean up extra whitespace and newlines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  formatted = formatted.trim();

  return formatted;
};

// Helper function to parse and format content into structured display
const parseSummaryContent = (text: string) => {
  const formatted = formatSummary(text);

  // Split by newlines to detect bullet points or paragraphs
  const lines = formatted.split('\n').filter(line => line.trim().length > 0);

  const sections: Array<{ type: 'paragraph' | 'bullet'; content: string }> = [];

  lines.forEach(line => {
    const trimmed = line.trim();

    // Detect bullet points (-, *, •, or numbered lists)
    if (/^[-*•]\s+/.test(trimmed) || /^\d+[.)]\s+/.test(trimmed)) {
      // Remove bullet marker and clean up
      let content = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').trim();
      // Remove any remaining markdown artifacts
      content = content.replace(/\*\*/g, '').replace(/__/g, '');
      if (content.length > 0) {
        sections.push({ type: 'bullet', content });
      }
    } else if (trimmed.length > 0) {
      // Regular paragraph - clean up any markdown
      let content = trimmed.replace(/\*\*/g, '').replace(/__/g, '').trim();
      if (content.length > 0) {
        sections.push({ type: 'paragraph', content });
      }
    }
  });

  // If no sections found, return the formatted text as a single paragraph
  if (sections.length === 0 && formatted.length > 0) {
    sections.push({ type: 'paragraph', content: formatted });
  }

  return sections;
};

interface SummaryData {
  email_title: string;
  sender: string;
  summary: string;
  action_items: string[];
  important_details: string[];
  intent: string;
  sentiment: string;
}

interface SummaryResultViewProps {
  summary?: SummaryData | string; // Support both just in case
  error?: string;
  onClear?: () => void;
  onClose?: () => void;
}

export default function SummaryResultView({
  summary,
  error,
  onClear,
}: SummaryResultViewProps) {

  // Type guard or casting
  const data = typeof summary === 'string' ? null : (summary as SummaryData);
  const rawText = typeof summary === 'string' ? summary : null;

  return (
    <div className="relative p-4 sm:p-5 bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#262626] rounded-xl text-gray-900 dark:text-white mb-4 shadow-sm">
      <button
        onClick={onClear}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {error ? (
        <div className="space-y-2">
          <h3 className="font-semibold text-red-500 text-sm">Summarization Failed</h3>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Header: Title & Sender */}
          <div className="border-b border-gray-300 dark:border-[#262626] pb-3 pr-6">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight mb-1">
              {data.email_title || "Email Summary"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              From: <span className="text-gray-700 dark:text-gray-300">{data.sender || "Unknown"}</span>
            </p>
          </div>

          {/* Main Summary */}
          <div>
            {/* <h4 className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5">Summary</h4> */}
            <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed">
              {data.summary}
            </p>
          </div>

          {/* Important Details */}
          {data.important_details && data.important_details.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-2">Important Details</h4>
              <ul className="space-y-1.5">
                {data.important_details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-300">
                    <span className="text-[#22d3ee] mt-1.5 w-1 h-1 bg-[#22d3ee] rounded-full flex-shrink-0"></span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {data.action_items && data.action_items.length > 0 && (
            <div className="bg-gray-50 dark:bg-[#121212] rounded-lg p-3 border border-gray-300 dark:border-[#262626]">
              <h4 className="text-xs uppercase tracking-wider text-[#22d3ee] font-bold mb-2.5">Action Items</h4>
              <ul className="space-y-2">
                {data.action_items.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-900 dark:text-white font-medium">
                    <input type="checkbox" className="mt-1 rounded border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-[#262626] text-[#22d3ee] focus:ring-0 focus:ring-offset-0" readOnly />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer Tags: Intent & Sentiment */}
          <div className="flex flex-wrap gap-2 pt-1">
            {data.intent && (
              <span className={`px-2 py-1 rounded text-xs uppercase font-semibold border ${data.intent.toLowerCase() === 'urgent' ? 'text-orange-400 bg-orange-400/10 border-orange-400/20' :
                data.intent.toLowerCase() === 'request' ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' :
                  data.intent.toLowerCase() === 'meeting' ? 'text-purple-400 bg-purple-400/10 border-purple-400/20' :
                    data.intent.toLowerCase() === 'follow-up' ? 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' :
                      'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#262626] border-gray-300 dark:border-[#333]'
                }`}>
                {data.intent}
              </span>
            )}
            {data.sentiment && (
              <span className={`px-2 py-1 rounded text-[10px] uppercase font-semibold border ${data.sentiment.toLowerCase() === 'positive' ? 'bg-green-400/10 text-green-400 border-green-400/20' :
                data.sentiment.toLowerCase() === 'negative' ? 'bg-red-400/10 text-red-400 border-red-400/20' :
                  data.sentiment.toLowerCase() === 'urgent' ? 'bg-orange-400/10 text-orange-400 border-orange-400/20' :
                    'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-gray-400 border-gray-300 dark:border-[#333]'
                }`}>
                {data.sentiment}
              </span>
            )}
          </div>
        </div>
      ) : (
        // Fallback for string-only summaries (backward compatibility)
        <div className="space-y-3 pr-6">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#22d3ee] text-sm">Email Summary</h3>
          </div>
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {rawText}
          </p>
        </div>
      )}
    </div>
  );
}

