"use client";

import Link from "next/link";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import { EVENT_LABEL } from "@/domain/labels";

export default function NotificationsBO() {
  const dossiers = useTomStore(s => s.dossiers);

  // Notifications synthétiques dérivées de l'historique
  const notifs = dossiers.flatMap(d =>
    d.historique
      .filter(h => h.type === "WORKFLOW" || h.type === "AFFECTATION")
      .filter(h => h.message.includes("DOSSIER_CREE") || h.message.includes("AFFECTATION") || h.message.includes("REJETE"))
      .map(h => ({ dossierId: d.id, ref: d.reference_tom, evt: d.type_evenement, ...h }))
  ).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span><span className="text-ink-700 font-medium">Notifications BO</span>
      </div>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <BellRing className="text-brand-500" size={20} /> Notifications du Back Office
      </h1>

      <div className="card">
        <ul className="divide-y divide-ink-100">
          {notifs.map(n => (
            <li key={n.id} className="px-4 py-3 flex items-start gap-3 text-sm">
              <CheckCircle2 size={14} className="text-brand-500 mt-0.5" />
              <div className="flex-1">
                <Link href={`/dossiers/${n.dossierId}`} className="text-brand-600 font-medium hover:underline">
                  {n.ref}
                </Link>
                <span className="text-ink-500"> · {EVENT_LABEL[n.evt]}</span>
                <div className="text-xs text-ink-700 mt-0.5">{n.message}</div>
                <div className="text-[11px] text-ink-500 mt-0.5">{new Date(n.date).toLocaleString("fr-FR")} • {n.acteur}</div>
              </div>
            </li>
          ))}
          {notifs.length === 0 && (
            <li className="px-4 py-10 text-center text-ink-500 text-sm">Aucune notification BO pour le moment.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
