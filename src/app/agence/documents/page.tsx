"use client";

import Link from "next/link";
import { FileBox } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import { PHYSIQUE_LABEL, EVENT_LABEL } from "@/domain/labels";

const AGENCY_PHYS = ["DOCS_RECUS_AGENCE", "DOCS_EN_AGENCE", "DOCS_EN_TRANSFERT", "DOCS_REMIS_CLIENT"] as const;

export default function DocumentsPhysiques() {
  const dossiers = useTomStore(s => s.dossiers);
  const groups = AGENCY_PHYS.map(p => ({
    statut: p, items: dossiers.filter(d => d.statut_physique === p),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span><span className="text-ink-700 font-medium">Documents physiques</span>
      </div>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <FileBox className="text-brand-500" size={20} /> Documents physiques en agence
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(g => (
          <div key={g.statut} className="card">
            <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
              <div className="font-semibold text-sm">{PHYSIQUE_LABEL[g.statut]}</div>
              <span className="badge-orange">{g.items.length}</span>
            </div>
            <ul className="divide-y divide-ink-100">
              {g.items.map(d => (
                <li key={d.id} className="px-4 py-3 text-sm">
                  <Link href={`/agence/${d.id}`} className="text-brand-600 font-medium hover:underline">
                    {d.reference_tom}
                  </Link>
                  <div className="text-xs text-ink-500">{EVENT_LABEL[d.type_evenement]} • {d.client ?? "—"}</div>
                </li>
              ))}
              {g.items.length === 0 && (
                <li className="px-4 py-6 text-center text-ink-500 text-xs">Aucun</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
