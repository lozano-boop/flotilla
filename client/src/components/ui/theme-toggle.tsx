import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, setTheme, type Theme } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const [theme, setLocalTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      setLocalTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setLocalTheme(next);
    setTheme(next);
  };

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={`Cambiar a tema ${isDark ? "claro" : "oscuro"}`}
      className="h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
