import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { History, Plus, Trash2 } from "lucide-react";
import { Conversation } from "@/hooks/useConversations";

interface ChatHistoryProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

export function ChatHistory({
  conversations,
  currentConversationId,
  onSelect,
  onNewChat,
  onDelete,
}: ChatHistoryProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Recent Chats
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-background border border-border shadow-lg z-50"
      >
        <DropdownMenuItem onClick={onNewChat} className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          New Chat
        </DropdownMenuItem>
        
        {conversations.length > 0 && <DropdownMenuSeparator />}
        
        {conversations.length === 0 ? (
          <div className="px-2 py-4 text-sm text-muted-foreground text-center">
            No chat history yet
          </div>
        ) : (
          conversations.slice(0, 10).map((conv) => (
            <DropdownMenuItem
              key={conv.id}
              className={`flex items-center justify-between gap-2 cursor-pointer ${
                currentConversationId === conv.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelect(conv.id)}
            >
              <span className="truncate flex-1 text-sm">{conv.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
