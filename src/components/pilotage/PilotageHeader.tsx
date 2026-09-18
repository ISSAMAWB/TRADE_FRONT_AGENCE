"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard, ListChecks, CalendarClock, BellRing, AlertTriangle, Inbox,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import { estATraiter, estARelancer, echeanceASuivre, nbAlertes } from "@/domain/pilotage";

export type PilotageTab = "pilotage" | "a-traiter" | "echeancier" | "relances" | "alertes" | "dossiers";

export default function PilotageHeader({ actif, fil, actions }: {
  actif: PilotageTab | null;
  fil: string;
  actions?: ReactNode;
}) {
  const courriers = useTomStore(s => s.courriersIrd);

  const nbATraiter = courriers.filter(estATraiter).length;
  const nbEcheances = courriers.filter(echeanceASuivre).length;
  const nbARelancer = courriers.filter(estARelancer).length;
  const nbAlertesTotal = nbAlertes(courriers);
  const nbDossiers = courriers.length;

  const tabs: { key: PilotageTab; label: string; href: string; icon: typeof LayoutDashboard; count?: number }[] = [
    { key: "pilotage", label: "Pilotage", href: "/", icon: LayoutDashboard },
    { key: "a-traiter", label: "À traiter", href: "/listes/toutes", icon: ListChecks, count: nbATraiter },
    { key: "echeancier", label: "Échéancier", href: "/echeancier", icon: CalendarClock, count: nbEcheances },
    { key: "relances", label: "Relances", href: "/listes/relances", icon: BellRing, count: nbARelancer },
    { key: "alertes", label: "Alertes", href: "/listes/alertes", icon: AlertTriangle, count: nbAlertesTotal },
    { key: "dossiers", label: "Dossiers", href: "/listes/en-cours", icon: Inbox, count: nbDossiers },
  ];

  const arrete = new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div>
      {/* Fil d'Ariane */}
      <div className="text-xs text-gray-500 mb-2">
        <Link href="/" className="hover:text-orange-600">Accueil</Link>
        <span className="mx-1">/</span>
        <Link href="/" className="hover:text-orange-600">Pilotage agence</Link>
        <span className="mx-1">/</span>
        <span className="font-medium text-gray-900">{fil}</span>
      </div>

      {/* Barre d'onglets */}
      <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = actif === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap -mb-px border-b-2 transition",
                isActive
                  ? "text-orange-600 border-orange-500 font-semibold"
                  : "text-gray-500 border-transparent hover:text-gray-800"
              )}
            >
              <Icon size={14} />
              {t.label}
              {t.count != null && (
                <span className="bg-gray-100 text-gray-600 text-[11px] rounded px-1.5">
                  {t.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Ligne titre */}
      <div className="flex items-start justify-between flex-wrap gap-3 mt-4">
        <div>
          <h1 className="text-display">Pilotage agence Casablanca</h1>
          <p className="text-subtitle">
            Arrêté au {arrete} · {nbDossiers} dossiers en cours · {nbATraiter} actions à traiter · {nbEcheances} échéances à suivre
          </p>
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}
