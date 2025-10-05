import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm CUIntelligence, your academic assistant powered by Ollama. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Ollama configuration
  const [ollamaUrl, setOllamaUrl] = useState(localStorage.getItem('ollamaUrl') || 'http://192.168.1.100:11434');
  const [ollamaModel, setOllamaModel] = useState(localStorage.getItem('ollamaModel') || 'llama2');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const saveSettings = () => {
    localStorage.setItem('ollamaUrl', ollamaUrl);
    localStorage.setItem('ollamaModel', ollamaModel);
    setShowSettings(false);
    toast.success("Settings saved!");
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the edge function
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
            ollamaUrl: ollamaUrl,
            model: ollamaModel,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from Ollama');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      // Add empty assistant message to start streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              const data = JSON.parse(line);
              
              if (data.message?.content) {
                assistantMessage += data.message.content;
                
                // Update the last message
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = {
                    role: "assistant",
                    content: assistantMessage,
                  };
                  return newMessages;
                });
              }

              if (data.done) {
                break;
              }
            } catch (e) {
              // Ignore JSON parse errors for incomplete chunks
              console.log('Parse error (expected during streaming):', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error calling Ollama:', error);
      toast.error(error instanceof Error ? error.message : "Failed to connect to Ollama. Please check your settings.");
      
      // Remove the empty assistant message if there was an error
      setMessages((prev) => prev.slice(0, -1));
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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">AI Chat Assistant</h1>
              <p className="text-muted-foreground mt-1">Powered by Ollama</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSettings(!showSettings)}
              className="rounded-xl"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Settings Card */}
          {showSettings && (
            <Card className="mb-4 border-2 border-border">
              <CardHeader>
                <CardTitle>Ollama Settings</CardTitle>
                <CardDescription>Configure your Ollama server connection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="ollamaUrl">Ollama Server URL</Label>
                  <Input
                    id="ollamaUrl"
                    type="text"
                    placeholder="http://192.168.1.100:11434"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., http://192.168.1.100:11434 or http://your-domain.com:11434
                  </p>
                </div>
                <div>
                  <Label htmlFor="ollamaModel">Model Name</Label>
                  <Input
                    id="ollamaModel"
                    type="text"
                    placeholder="llama2"
                    value={ollamaModel}
                    onChange={(e) => setOllamaModel(e.target.value)}
                    className="rounded-xl mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    e.g., llama2, mistral, codellama, etc.
                  </p>
                </div>
                <Button onClick={saveSettings} className="rounded-xl w-full">
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          )}

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
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-accent-foreground" />
                    </div>
                  )}
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
              onClick={handleSend}
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
