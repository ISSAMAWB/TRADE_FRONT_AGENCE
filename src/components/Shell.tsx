"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Mail, Inbox, FolderOpen, FileSpreadsheet,
  Settings, ChevronDown, Bell, Search, CircleUser, Lock,
  FolderOpen as FolderOpenIcon, Clock,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import type { EquipeActeur } from "@/domain/types";

type NavItem = { href: string; label: string; icon: any; disabled?: boolean };
type NavGroup = { title?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    title: "Remise Documentaire Import",
    items: [
      { href: "/courriers",  label: "Centralisation des courriers IRD", icon: Mail },
      { href: "/operations", label: "Gestion des opérations IRD",        icon: FileSpreadsheet, disabled: true },
    ],
  },
  {
    title: "Consultation",
    items: [
      { href: "/consultation/dossiers",  label: "Dossiers Trade",       icon: FolderOpenIcon },
      { href: "/consultation/evenements", label: "Événements récents",  icon: Clock },
      { href: "/consultation/alertes",    label: "Alertes & échéances", icon: Bell },
    ],
  },
];

const ACTEURS: { value: EquipeActeur; label: string }[] = [
  { value: "AGENCE",              label: "Agent agence" },
  { value: "RESPONSABLE_AGENCE",  label: "Responsable agence" },
  { value: "CTN_DEVISE",          label: "CTN devise" },
  { value: "RESPONSABLE_BO",      label: "Responsable BO" },
  { value: "BO_IRD",              label: "Gestionnaire BO" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const acteur = useTomStore(s => s.acteurCourant);
  const setActeur = useTomStore(s => s.setActeur);
  const reset = useTomStore(s => s.resetSeed);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ background: "#1E2128" }}>
        <div className="h-14 px-4 flex items-center gap-2 border-b" style={{ borderColor: "#2C2F36" }}>
          <div className="h-8 w-8 rounded-md text-white grid place-items-center font-bold" style={{ background: "#E8722A" }}>T</div>
          <div>
            <div className="text-sm font-semibold leading-none text-white">Trade Portal</div>
            <div className="text-[11px]" style={{ color: "#A0A5B0" }}>Orchestration Trade</div>
          </div>
        </div>

        <nav className="flex-1 px-2 py-2 overflow-auto">
          {NAV_GROUPS.map((g, gi) => (
            <div key={gi} className="mb-2">
              {g.title && (
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider" style={{ color: "#A0A5B0" }}>{g.title}</div>
              )}
              {g.items.map(n => {
                const active = pathname === n.href || (n.href !== "/" && pathname?.startsWith(n.href));
                const Icon = n.icon;
                if (n.disabled) {
                  return (
                    <div
                      key={n.href}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 cursor-not-allowed"
                      style={{ color: "#6B707A" }}
                      title="Hors périmètre MVP actuel"
                    >
                      <Icon size={16} />
                      <span className="flex-1">{n.label}</span>
                      <Lock size={11} />
                    </div>
                  );
                }
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={clsx(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition",
                      active
                        ? "font-semibold border-l-2"
                        : "hover:bg-white/5"
                    )}
                    style={active ? { color: "#E8722A", borderColor: "#E8722A", background: "rgba(232,114,42,0.10)" } : { color: "#A0A5B0" }}
                  >
                    <Icon size={16} />
                    <span>{n.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t text-[11px]" style={{ borderColor: "#2C2F36", color: "#A0A5B0" }}>
          <button onClick={reset} className="flex items-center gap-2 hover:text-white transition">
            <Settings size={14} /> Réinitialiser démo
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-ink-100 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
              <input
                placeholder="Rechercher un dossier, client, référence..."
                className="input pl-8 h-9"
              />
            </div>
          </div>

          <button className="btn-ghost h-9">
            <Bell size={16} />
          </button>
          <div className="flex items-center gap-2">
            <CircleUser size={26} className="text-ink-500" />
            <div className="text-xs leading-tight">
              <div className="font-semibold">{ACTEURS.find(a => a.value === acteur)?.label}</div>
              <div className="text-ink-500">Agence Casablanca</div>
            </div>
            <ChevronDown size={14} className="text-ink-500" />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6" style={{ background: "#F5F5F5" }}>{children}</main>
      </div>
    </div>
  );
}
