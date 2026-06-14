import { Menu, Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import clsx from "clsx";

export default function Navbar({ onMenuClick }) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const themeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-4 lg:px-6">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-[var(--color-surface-alt)]">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]"
          title={`Theme: ${theme}`}
        >
          {theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Monitor size={18} />}
        </button>
        <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-sm font-semibold">
          QA
        </div>
      </div>
    </header>
  );
}
