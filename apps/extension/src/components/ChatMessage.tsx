import SummaryResultView from './SummaryResultView';
import DailyDigestView from './DailyDigestView';

// This defines what a 'message' object looks like
export interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  type?: 'text' | 'summary' | 'digest';
  data?: any; // For summary object
  error?: string;
  isLoading?: boolean;
}

// Simple markdown-like parser for AI responses
const formatAIResponse = (text: string) => {
  // Split into lines for processing
  const lines = text.split('\n');

  return lines.map((line, index) => {
    // Check for section headers with emojis (📌, 📧, 📋, ⚡)
    if (/^[📌📧📋⚡🔍💡✅❌⚠️]/.test(line.trim())) {
      return (
        <div key={index} className="mt-3 mb-1.5 first:mt-0">
          <span className="text-[#22d3ee] font-semibold">{line}</span>
        </div>
      );
    }

    // Check for bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      const content = line.trim().replace(/^[•-]\s*/, '');
      return (
        <div key={index} className="flex items-start gap-2 ml-2 my-0.5">
          <span className="text-[#22d3ee] mt-0.5">•</span>
          <span>{formatInlineStyles(content)}</span>
        </div>
      );
    }

    // Empty lines become spacing
    if (line.trim() === '') {
      return <div key={index} className="h-2" />;
    }

    // Regular text with inline formatting
    return <div key={index} className="my-0.5">{formatInlineStyles(line)}</div>;
  });
};

// Handle **bold** text
const formatInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <span key={index} className="font-semibold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export const ChatMessage = ({ message, onRemove }: { message: Message; onRemove?: () => void }) => {
  const isUser = message.sender === 'user';

  if (message.type === 'digest') {
    return (
      <div className={`flex w-full items-start`}>
        <div className="w-full">
          {message.isLoading ? (
            <div className="bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 p-4 rounded-2xl border border-gray-300 dark:border-white/5 text-sm animate-pulse shadow-sm">
              Generating digest...
            </div>
          ) : (
            <DailyDigestView data={message.data} onClose={onRemove} />
          )}
        </div>
      </div>
    );
  }

  if (message.type === 'summary') {
    return (
      <div className={`flex w-full items-start`}>
        <div className="w-full">
          {message.isLoading ? (
            <div className="bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 p-4 rounded-2xl border border-gray-300 dark:border-white/5 text-sm animate-pulse shadow-sm">
              Summarizing email...
            </div>
          ) : (
            <SummaryResultView
              summary={message.data}
              error={message.error}
              onClear={onRemove}
            />
          )}
        </div>
      </div>
    );
  }

  // Fallback for regular text messages
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[85%] px-4 py-2.5 text-sm lg:text-base shadow-sm ${
          isUser 
            ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-white font-medium rounded-2xl rounded-tr-sm' 
            : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-white/5 rounded-2xl rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.text}</p>
        ) : (
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {formatAIResponse(message.text)}
          </div>
        )}
      </div>
    </div>
  );
};