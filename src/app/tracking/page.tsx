"use client";

import Link from "next/link";
import { Truck } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import { PHYSIQUE_LABEL, EVENT_LABEL } from "@/domain/labels";

export default function TrackingPage() {
  const dossiers = useTomStore(s => s.dossiers);

  // group by statut_physique
  const groups = dossiers.reduce<Record<string, typeof dossiers>>((acc, d) => {
    (acc[d.statut_physique] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span><span className="text-ink-700 font-medium">Tracking physique</span>
      </div>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Truck className="text-brand-500" size={20} /> Tracking documents physiques
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.entries(groups) as [string, typeof dossiers][]).map(([statut, list]) => (
          <div key={statut} className="card">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <div className="font-semibold text-sm">{PHYSIQUE_LABEL[statut as keyof typeof PHYSIQUE_LABEL]}</div>
              <span className="badge-orange">{list.length}</span>
            </div>
            <ul className="divide-y divide-ink-100">
              {list.map(d => (
                <li key={d.id} className="px-4 py-3 text-sm">
                  <Link href={`/dossiers/${d.id}`} className="text-brand-600 font-medium hover:underline">
                    {d.reference_tom}
                  </Link>
                  <div className="text-xs text-ink-500">
                    {EVENT_LABEL[d.type_evenement]} • {d.client ?? "—"}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {dossiers.length === 0 && (
          <div className="card p-10 text-center text-ink-500 md:col-span-3">Aucun dossier à suivre.</div>
        )}
      </div>
    </div>
  );
}
