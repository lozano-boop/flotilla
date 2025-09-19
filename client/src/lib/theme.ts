export type Theme = "light" | "dark";

const STORAGE_KEY = "flota_theme";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem(STORAGE_KEY);
  if (t === "light" || t === "dark") return t;
  return null;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function initTheme() {
  // Prefer stored theme; fallback to system preference; default light
  const stored = getStoredTheme();
  let theme: Theme = stored ?? "light";
  if (!stored && typeof window !== "undefined") {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? "dark" : "light";
  }
  applyTheme(theme);
}
