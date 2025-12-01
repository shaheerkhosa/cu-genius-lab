import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { OllamaSettings, getOllamaUrl } from "@/components/OllamaSettings";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const location = useLocation();
  const initialMessage = (location.state as { initialMessage?: string })?.initialMessage;
  const hasProcessedInitial = useRef(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm CUIntelligence, your academic assistant powered by Ollama. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState(() => getOllamaUrl());
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle initial message from landing page
  useEffect(() => {
    if (initialMessage && !hasProcessedInitial.current) {
      hasProcessedInitial.current = true;
      setPendingMessage(initialMessage);
    }
  }, [initialMessage]);

  // Process pending message (from landing page)
  useEffect(() => {
    if (pendingMessage && !isLoading) {
      handleSend(pendingMessage);
      setPendingMessage(null);
    }
  }, [pendingMessage]);

  const handleSend = async (messageOverride?: string) => {
    const messageToSend = messageOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    // Get fresh URL from localStorage in case it was just updated
    const currentUrl = getOllamaUrl();
    if (!currentUrl) {
      toast.error("Please configure your ngrok URL in settings first");
      return;
    }

    const userMessage: Message = { role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the edge function with the ngrok URL
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ollama`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            ollamaUrl: currentUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Ollama');
      }

      const data = await response.json();
      console.log('Ollama response:', data);

      if (data.message?.content) {
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: data.message.content 
        }]);
      } else {
        throw new Error('No response content from Ollama');
      }
    } catch (error) {
      console.error('Error calling Ollama:', error);
      toast.error(error instanceof Error ? error.message : "Failed to connect to Ollama. Please check your settings.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="relative h-screen flex flex-col">
        <DecorativeBackground />
        
        <div className="relative z-10 flex-1 flex flex-col max-w-4xl mx-auto w-full p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">AI Chat Assistant</h1>
                <p className="text-muted-foreground mt-1">Powered by Ollama</p>
              </div>
            </div>
            <div className="mt-4">
              <OllamaSettings onUrlChange={setOllamaUrl} />
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
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
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="mt-6 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isLoading && handleSend()}
              placeholder={isLoading ? "Waiting for response..." : "Type your question..."}
              disabled={isLoading}
              className="flex-1 rounded-2xl bg-muted/30 border-2 border-muted focus:border-primary"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading}
              className="rounded-2xl px-6 bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
