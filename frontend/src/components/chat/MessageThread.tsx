"use client";

import { useState, type FormEvent } from "react";
import type { Message } from "@/types";

interface MessageThreadProps {
    messages?: Message[];
    onSend?: (content: string) => void;
}

export function MessageThread({ messages = [], onSend }: MessageThreadProps) {
    const [input, setInput] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (input.trim() && onSend) {
            onSend(input.trim());
            setInput("");
        }
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${msg.isMine
                                ? "ml-auto bg-primary-600 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                    >
                        {msg.content}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message…"
                        className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
