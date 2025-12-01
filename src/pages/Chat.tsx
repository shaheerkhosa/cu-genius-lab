import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { OllamaSettings, getOllamaUrl } from "@/components/OllamaSettings";
import { ChatHistory } from "@/components/ChatHistory";
import { ChatLanding } from "@/components/ChatLanding";
import { useConversations } from "@/hooks/useConversations";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;
  const hasProcessedInitial = useRef(false);

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(() => getOllamaUrl());

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    conversations,
    currentConversationId,
    messages,
    createConversation,
    addMessage,
    selectConversation,
    startNewChat,
    deleteConversation,
  } = useConversations(user?.id);

  // Auth check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setAuthLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/chat" } });
    }
  }, [authLoading, user, navigate]);

  // GSAP entrance animation
  useEffect(() => {
    if (!authLoading && user && headerRef.current && contentRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
      );
      
      tl.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.3"
      );
    }
  }, [authLoading, user, currentConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Animate new messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = document.querySelector(`[data-message-index="${messages.length - 1}"]`);
      if (lastMessage) {
        gsap.fromTo(
          lastMessage,
          { opacity: 0, x: messages[messages.length - 1].role === "user" ? 20 : -20 },
          { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
        );
      }
    }
  }, [messages.length]);

  // Handle initial message from landing page
  useEffect(() => {
    if (initialMessage && !hasProcessedInitial.current && user) {
      hasProcessedInitial.current = true;
      handleSendMessage(initialMessage);
    }
  }, [initialMessage, user]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isSending || !user) return;

    const currentUrl = getOllamaUrl();
    if (!currentUrl) {
      toast.error("Please configure your ngrok URL in settings first");
      return;
    }

    setIsSending(true);

    try {
      // Create conversation if needed
      let convId = currentConversationId;
      if (!convId) {
        convId = await createConversation();
        if (!convId) {
          throw new Error("Failed to create conversation");
        }
      }

      // Add user message
      await addMessage(convId, "user", messageContent);
      setInput("");

      // Call the edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ollama`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: messageContent }],
            ollamaUrl: currentUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response from Ollama");
      }

      const data = await response.json();
      console.log("Ollama response:", data);

      if (data.message?.content) {
        await addMessage(convId, "assistant", data.message.content);
      } else {
        throw new Error("No response content from Ollama");
      }
    } catch (error) {
      console.error("Error calling Ollama:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to connect to Ollama. Please check your settings."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = () => {
    handleSendMessage(input);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  // Show landing UI when no active conversation
  const showLanding = !currentConversationId && messages.length === 0;

  return (
    <Layout>
      <DecorativeBackground />
      
      <div 
        ref={containerRef}
        className="relative z-10 min-h-screen flex flex-col max-w-4xl mx-auto w-full p-8"
      >
        {/* Header */}
        <div ref={headerRef} className="mb-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">AI Chat Assistant</h1>
              <p className="text-muted-foreground mt-1">Powered by Ollama</p>
            </div>
            <ChatHistory
              conversations={conversations}
              currentConversationId={currentConversationId}
              onSelect={selectConversation}
              onNewChat={startNewChat}
              onDelete={deleteConversation}
            />
          </div>
          <div className="mt-4">
            <OllamaSettings onUrlChange={setOllamaUrl} />
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-1 flex flex-col min-h-0">
          {showLanding ? (
            <ChatLanding onSubmit={handleSendMessage} isLoading={isSending} />
          ) : (
            <>
              {/* Messages - scrollable area */}
              <div className="flex-1 overflow-y-auto pr-2 mb-6">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={message.id || index}
                      data-message-index={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <div className="bg-muted text-foreground rounded-2xl px-4 py-3">
                        <p className="text-sm text-muted-foreground">Thinking...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input - fixed at bottom */}
              <div className="flex-shrink-0 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !isSending && handleSend()}
                  placeholder={isSending ? "Waiting for response..." : "Type your question..."}
                  disabled={isSending}
                  className="flex-1 rounded-2xl bg-muted/30 border-2 border-muted focus:border-primary"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={isSending || !input.trim()}
                  className="rounded-2xl px-6 bg-primary hover:bg-primary/90"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
