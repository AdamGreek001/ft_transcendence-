"use client";

import { useState, useRef, useEffect } from "react";

const emojis = [
    "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
    "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
    "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
    "🤪", "😌", "😑", "😐", "😏", "😒", "🙁", "😬",
    "🤗", "🤔", "🤭", "🤫", "🤥", "😌", "😔", "😪",
    "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
    "🎉", "🎊", "🎁", "🎈", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞",
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏",
    "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎",
    "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
    "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
    "🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🥞", "🧆",
    "🌮", "🌯", "🥙", "🧆", "🍗", "🍖", "🌭", "🍝",
    "🍜", "☕", "🍵", "🥤", "🍶", "🍺", "🍻", "🥂",
    "✈️", "🚀", "🚁", "🚂", "🚃", "🚄", "🚅", "🚆",
];

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
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

    const handleEmojiClick = (emoji: string) => {
        onEmojiSelect(emoji);
        setIsOpen(false);
    };

    return (
        <div ref={pickerRef} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-full transition"
                title="Add emoji"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm3.5-9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-7 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm3.5 6c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 bg-[#1a1a1f] border border-gray-800/50 rounded-xl shadow-xl z-50">
                    <div className="grid grid-cols-8 gap-1 p-3 w-80 max-h-60 overflow-y-auto">
                        {emojis.map((emoji, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleEmojiClick(emoji)}
                                className="p-2 text-xl hover:bg-gray-800/50 rounded transition"
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
