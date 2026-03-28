import { Avatar } from "@/components/ui";
import type { ChatConversation } from "@/types";

interface ChatListProps {
    conversations: ChatConversation[];
    activeId?: string;
    onSelect?: (id: string) => void;
}

export function ChatList({ conversations, activeId, onSelect }: ChatListProps) {
    return (
        <div className="flex flex-col gap-1">
            {conversations.map((conv) => (
                <button
                    key={conv.id}
                    onClick={() => onSelect?.(conv.id)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${activeId === conv.id
                            ? "bg-primary-50 text-primary-700"
                            : "hover:bg-gray-50"
                        }`}
                >
                    <Avatar src={conv.avatarUrl} alt={conv.name} size={40} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                            {conv.name}
                        </p>
                        <p className="truncate text-xs text-gray-400">
                            {conv.lastMessage}
                        </p>
                    </div>
                </button>
            ))}
        </div>
    );
}
