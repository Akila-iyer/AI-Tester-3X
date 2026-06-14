import { createContext, useContext, useEffect, useState } from "react";
import clsx from "clsx";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem("vut-theme") || "system");

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem("vut-theme", t);
  };

  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", isDark);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
