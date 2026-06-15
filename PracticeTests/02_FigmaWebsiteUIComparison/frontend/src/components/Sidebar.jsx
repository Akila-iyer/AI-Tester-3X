import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, PlusCircle, History, Settings, X } from "lucide-react";
import clsx from "clsx";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/new", icon: PlusCircle, label: "New Comparison" },
  { to: "/history", icon: History, label: "History" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={onClose} />}
      <aside className={clsx(
        "fixed top-0 left-0 z-30 h-full w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text)]">Visual UI Test</h1>
            <p className="text-xs text-[var(--color-text-secondary)]">Platform v1.0</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded-lg hover:bg-[var(--color-surface-alt)]">
            <X size={20} />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
