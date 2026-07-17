"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Mail, FileSpreadsheet, FolderOpen, Clock, Bell, Settings, Lock,
  FolderOpen as FolderOpenIcon, ArrowRight, ArrowLeft, DollarSign, BarChart3,
  FileText, ChevronRight, ChevronDown
} from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import type { EquipeActeur } from "@/domain/types";
import CompactSidebar from "@/components/ui/CompactSidebar";
import FilterToggleButton from "@/components/ui/FilterToggleButton";

type NavItem = { 
  href: string; 
  label: string; 
  icon: ReactNode; 
  disabled?: boolean;
  isSubItem?: boolean;
  children?: NavItem[];
};
type NavGroup = { title?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/", label: "Tableau de bord", icon: <LayoutDashboard size={18} /> }],
  },
  {
    title: "ESPACE DE CONSULTATION",
    items: [
      { href: "/consultation/dossiers",  label: "Tous les dossiers",    icon: <FolderOpen size={18} /> },
      { href: "/consultation/evenements", label: "Événements récents", icon: <Clock size={18} /> },
    ],
  },
  {
    title: "PRODUITS DOCUMENTAIRES",
    items: [
      { 
        href: "#", 
        label: "Crédits documentaires", 
        icon: <FileText size={18} />,
        children: [
          { href: "/credits-doc/import", label: "Import", icon: <ArrowRight size={14} />, isSubItem: true },
          { href: "/credits-doc/export", label: "Export", icon: <ArrowLeft size={14} />, isSubItem: true },
        ]
      },
      { 
        href: "#", 
        label: "Remises documentaires", 
        icon: <FileSpreadsheet size={18} />,
        children: [
          { href: "/remises-doc/import", label: "Import", icon: <ArrowRight size={14} />, isSubItem: true },
          { href: "/remises-doc/export", label: "Export", icon: <ArrowLeft size={14} />, isSubItem: true },
          { href: "/courriers", label: "Centralisation des courriers", icon: <Mail size={14} />, isSubItem: true },
        ]
      },
      { 
        href: "#", 
        label: "Financements", 
        icon: <DollarSign size={18} />,
        children: [
          { href: "/financements/refinancement-import", label: "Refinancement import", icon: <ArrowRight size={14} />, isSubItem: true },
          { href: "/financements/prefinancement-export", label: "Préfinancement export", icon: <ArrowLeft size={14} />, isSubItem: true },
        ]
      },
    ],
  },
  {
    title: "SUIVI ET PILOTAGE",
    items: [
      { href: "/consultation/alertes", label: "Alertes et échéances", icon: <Bell size={18} /> },
      { href: "/reporting", label: "Reporting", icon: <BarChart3 size={18} />, disabled: true },
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

interface ShellProps {
  children: ReactNode;
  showFilterButton?: boolean;
  onFilterToggle?: () => void;
  isFilterOpen?: boolean;
}

export default function Shell({ children, showFilterButton = false, onFilterToggle, isFilterOpen = false }: ShellProps) {
  const pathname = usePathname();
  const acteur = useTomStore(s => s.acteurCourant);
  const reset = useTomStore(s => s.resetSeed);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Compact Sidebar */}
      <CompactSidebar 
        groups={NAV_GROUPS} 
        onReset={reset} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative w-full">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un dossier, client, référence..."
                className="input-lg pl-12 w-full"
              />
            </div>
          </div>

          {showFilterButton && onFilterToggle && (
            <FilterToggleButton isOpen={isFilterOpen} onClick={onFilterToggle} className="flex-shrink-0" />
          )}

          <button className="btn-ghost text-white hover:bg-slate-700 h-10 w-10 rounded-lg">
            <Bell size={20} />
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-semibold">
              {ACTEURS.find(a => a.value === acteur)?.label?.charAt(0) || "A"}
            </div>
            <div className="text-sm leading-tight">
              <div className="font-semibold text-white">{ACTEURS.find(a => a.value === acteur)?.label}</div>
              <div className="text-xs text-slate-400">Agence Casablanca</div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
