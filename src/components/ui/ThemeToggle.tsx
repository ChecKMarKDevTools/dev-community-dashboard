"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";
const CYCLE: Theme[] = ["light", "dark", "system"];

function applyTheme(theme: Theme): void {
  const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

type ThemeToggleProps = Readonly<{ className?: string }>;

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "system") return stored;
  } catch {
    /* SSR or restricted localStorage — fall back to light */
  }
  return "light";
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  /* Apply theme class on mount and when theme changes */
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  /* Listen for system-level preference changes while in "system" mode */
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme:dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const cycle = () => {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length];
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  };

  const Icon = theme === "dark" ? Moon : theme === "system" ? Monitor : Sun;
  const label =
    theme === "dark"
      ? "Dark mode"
      : theme === "system"
        ? "System theme"
        : "Light mode";

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      className={cn(
        "text-text-muted hover:text-text-primary rounded-lg p-2 transition-colors",
        className,
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
