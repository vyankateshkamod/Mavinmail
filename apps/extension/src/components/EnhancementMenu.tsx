import { useState, useRef, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";

import Tooltip from "./Tooltip";

interface EnhancementMenuProps {
    onEnhance: (type: 'formal' | 'concise' | 'casual' | 'clarity' | 'more') => void;
    isLoading?: boolean;
}

const EnhancementMenu = ({ onEnhance, isLoading }: EnhancementMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleOptionClick = (type: 'formal' | 'concise' | 'casual' | 'clarity' | 'more') => {
        onEnhance(type);
        setIsOpen(false);
    };

    const options: { label: string; value: 'formal' | 'concise' | 'casual' | 'clarity' }[] = [
        { label: "Formal", value: "formal" },
        { label: "Concise", value: "concise" },
        { label: "Casual", value: "casual" },
        { label: "Clarity", value: "clarity" },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <Tooltip content="Enhance Text">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    disabled={isLoading}
                    className={`flex items-center gap-1 p-1.5 rounded-lg transition-colors ${isOpen
                        ? "bg-gray-200 dark:bg-[#262626] text-[#22d3ee]"
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#262626]"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                    <Sparkles className={`w-4 h-4 ${isLoading ? "animate-pulse" : ""}`} />
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
            </Tooltip>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-32 sm:w-40 bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#262626] rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleOptionClick(option.value)}
                                className="w-full text-left px-3 py-2 text-[11px] sm:text-xs text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-[#262626] dark:hover:text-white rounded-md transition-colors flex items-center gap-2"
                            >
                                {option.label}
                            </button>
                        ))}
                        <div className="h-px bg-gray-200 dark:bg-[#262626] my-1" />
                        {/* Extended functionality can go here, kept 'more' as a catch-all or placeholder for now if needed, currently not in the list but part of the type signature in ChatScreen */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancementMenu;
