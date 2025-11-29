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

const STORAGE_KEY = "ollama_ngrok_url";

export const useOllamaUrl = () => {
  const [url, setUrl] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "";
  });

  const saveUrl = (newUrl: string) => {
    localStorage.setItem(STORAGE_KEY, newUrl);
    setUrl(newUrl);
  };

  return { url, saveUrl };
};

export const OllamaSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const { url, saveUrl } = useOllamaUrl();

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleSave = () => {
    if (!inputUrl.trim()) {
      toast.error("Please enter a valid ngrok URL");
      return;
    }
    saveUrl(inputUrl.trim());
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
          {url && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ Currently using: {url}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
