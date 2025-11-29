import { useState, useEffect } from "react";
import { Settings, ChevronDown, ChevronUp, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

export const STORAGE_KEY = "ollama_ngrok_url";

export const getOllamaUrl = () => localStorage.getItem(STORAGE_KEY) || "";

interface OllamaSettingsProps {
  onUrlChange?: (url: string) => void;
}

export const OllamaSettings = ({ onUrlChange }: OllamaSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [savedUrl, setSavedUrl] = useState("");

  useEffect(() => {
    const stored = getOllamaUrl();
    setInputUrl(stored);
    setSavedUrl(stored);
  }, []);

  const handleSave = () => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a valid ngrok URL");
      return;
    }
    const trimmed = inputUrl.trim();
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSavedUrl(trimmed);
    onUrlChange?.(trimmed);
    toast.success("Ollama URL saved!");
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          <span>Ollama Settings</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 p-4 rounded-xl bg-muted/30 border border-border">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="ngrok-url" className="text-sm font-medium">
              Ngrok URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="ngrok-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://xxxx-xx-xx-xx-xx.ngrok-free.app"
                className="flex-1"
              />
              <Button onClick={handleSave} size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter your ngrok forwarding URL (e.g., https://abc123.ngrok-free.app)
            </p>
          </div>
          {savedUrl && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ Currently using: {savedUrl}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
