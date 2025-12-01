import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  summary: string | null;
  message_count: number;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  // Fetch all conversations for user
  useEffect(() => {
    if (!userId) return;

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching conversations:", error);
        return;
      }
      setConversations(data || []);
    };

    fetchConversations();
  }, [userId]);

  // Fetch messages and summary when conversation changes
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      setCurrentSummary(null);
      setMessageCount(0);
      return;
    }

    const fetchConversationData = async () => {
      // Fetch conversation details for summary
      const { data: convData } = await supabase
        .from("conversations")
        .select("summary, message_count")
        .eq("id", currentConversationId)
        .single();

      if (convData) {
        setCurrentSummary(convData.summary);
        setMessageCount(convData.message_count);
      }

      // Fetch messages
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }
      setMessages(
        data?.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        })) || []
      );
    };

    fetchConversationData();
  }, [currentConversationId]);

  const createConversation = async (title: string = "New Chat"): Promise<string | null> => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("conversations")
      .insert({ user_id: userId, title })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
      return null;
    }

    setConversations((prev) => [data, ...prev]);
    setCurrentConversationId(data.id);
    setCurrentSummary(null);
    setMessageCount(0);
    return data.id;
  };

  const addMessage = async (
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ) => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();

    if (error) {
      console.error("Error adding message:", error);
      return null;
    }

    setMessages((prev) => [...prev, { id: data.id, role, content }]);

    // Update message count
    const newCount = messageCount + 1;
    setMessageCount(newCount);
    
    await supabase
      .from("conversations")
      .update({ message_count: newCount })
      .eq("id", conversationId);

    // Update conversation title based on first user message
    if (role === "user" && messages.length === 0) {
      const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
      await supabase
        .from("conversations")
        .update({ title })
        .eq("id", conversationId);
      
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title } : c))
      );
    }

    return data;
  };

  const updateSummary = async (conversationId: string, summary: string) => {
    const { error } = await supabase
      .from("conversations")
      .update({ summary })
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating summary:", error);
      return;
    }

    setCurrentSummary(summary);
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, summary } : c))
    );
  };

  const updateLastMessage = (content: string) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      if (newMessages.length > 0) {
        newMessages[newMessages.length - 1].content = content;
      }
      return newMessages;
    });
  };

  const selectConversation = (id: string | null) => {
    setCurrentConversationId(id);
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setCurrentSummary(null);
    setMessageCount(0);
  };

  const deleteConversation = async (id: string) => {
    const { error } = await supabase.from("conversations").delete().eq("id", id);

    if (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      startNewChat();
    }
  };

  // Check if we should generate a summary (every 4 messages)
  const shouldGenerateSummary = () => {
    return messageCount > 0 && messageCount % 4 === 0;
  };

  return {
    conversations,
    currentConversationId,
    messages,
    isLoading,
    setIsLoading,
    createConversation,
    addMessage,
    updateLastMessage,
    selectConversation,
    startNewChat,
    deleteConversation,
    setMessages,
    currentSummary,
    updateSummary,
    messageCount,
    shouldGenerateSummary,
  };
}
