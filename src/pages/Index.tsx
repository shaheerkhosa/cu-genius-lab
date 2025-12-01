import { useState } from "react";
import { Layout } from "@/components/Layout";
import { DecorativeBackground } from "@/components/DecorativeBackground";
import { Button } from "@/components/ui/button";
import { MessageSquare, PenTool, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const handleSubmit = (message: string) => {
    if (message.trim()) {
      navigate("/chat", { state: { initialMessage: message.trim() } });
    }
  };

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

  return (
    <Layout>
      <div className="relative min-h-screen flex flex-col items-center justify-center p-8">
        <DecorativeBackground />
        
        <div className="relative z-10 w-full max-w-5xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <p className="text-lg text-muted-foreground">Welcome To</p>
            <h1 className="text-6xl font-bold text-primary">CUIntelligence</h1>
          </div>

          {/* Prompt Sections */}
          <div className="grid md:grid-cols-2 gap-8 mt-16">
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
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-normal"
                    onClick={() => handleSubmit(prompt)}
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
                    className="w-full justify-start text-left h-auto py-4 px-6 rounded-2xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground font-normal"
                    onClick={() => handleSubmit(prompt)}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="mt-12">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(query); }} className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type something"
                  className="w-full px-6 py-4 pl-14 rounded-3xl bg-muted/30 border-2 border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground transition-all"
                />
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <Button
                type="submit"
                disabled={!query.trim()}
                className="rounded-3xl px-6 h-auto bg-primary hover:bg-primary/90"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
