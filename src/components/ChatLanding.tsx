import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { MessageSquare, PenTool, Send } from "lucide-react";

interface ChatLandingProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const explainPrompts = [
  "What is a sparrow",
  "How to code easy",
  "When to use hooks",
];

const writePrompts = [
  "Essay on sparrows",
  "Edit my code please",
  "Documentation on hooks",
];

export function ChatLanding({ onSubmit, isLoading }: ChatLandingProps) {
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const promptsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && headerRef.current && promptsRef.current && inputRef.current) {
      const tl = gsap.timeline();
      
      tl.fromTo(
        headerRef.current,
        { opacity: 0, y: -30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      );
      
      tl.fromTo(
        promptsRef.current.children,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.3"
      );
      
      tl.fromTo(
        inputRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
        "-=0.2"
      );
    }
  }, []);

  const handleSubmit = (message: string) => {
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
    }
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-4xl space-y-12">
        {/* Header */}
        <div ref={headerRef} className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Welcome To</p>
          <h1 className="text-5xl font-bold text-primary">CUIntelligence</h1>
        </div>

        {/* Prompt Sections */}
        <div ref={promptsRef} className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Explain Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <MessageSquare className="h-6 w-6 text-foreground" />
              <h2 className="text-lg font-medium text-foreground">Explain</h2>
            </div>
            <div className="space-y-3">
              {explainPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-normal transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => handleSubmit(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Write & Edit Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <PenTool className="h-6 w-6 text-foreground" />
              <h2 className="text-lg font-medium text-foreground">Write & edit</h2>
            </div>
            <div className="space-y-3">
              {writePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="secondary"
                  className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-normal transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => handleSubmit(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div ref={inputRef} className="mt-12">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query);
              setQuery("");
            }}
            className="relative flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type something"
                disabled={isLoading}
                className="w-full px-6 py-4 pl-14 rounded-3xl bg-muted/30 border-2 border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all"
              />
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="rounded-3xl px-6 h-auto bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
