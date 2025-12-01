import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  collapsed?: boolean;
}

export function ThemeToggle({ collapsed = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <Button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="outline"
      className={`w-full rounded-xl bg-muted hover:bg-muted-foreground/20 border-2 border-border text-foreground hover:text-foreground h-12 transition-colors ${
        collapsed ? "px-0 justify-center" : ""
      }`}
    >
      {isDark ? (
        <Sun className={`h-4 w-4 shrink-0 ${!collapsed ? "mr-2" : ""}`} />
      ) : (
        <Moon className={`h-4 w-4 shrink-0 ${!collapsed ? "mr-2" : ""}`} />
      )}
      {!collapsed && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </Button>
  );
}
