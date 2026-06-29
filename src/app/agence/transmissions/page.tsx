"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import { WORKFLOW_LABEL, EVENT_LABEL, badgeForWorkflow } from "@/domain/labels";
import type { StatutWorkflow } from "@/domain/types";

const TRANSMITTED: StatutWorkflow[] = ["TRANSMIS_BO", "EN_TRAITEMENT_BO", "ENVOYE_TI_PLUS", "DOSSIER_CREE"];

export default function MesTransmissions() {
  const dossiers = useTomStore(s => s.dossiers).filter(d => TRANSMITTED.includes(d.statut_workflow));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span><span className="text-ink-700 font-medium">Mes transmissions</span>
      </div>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Send className="text-brand-500" size={20} /> Mes transmissions
      </h1>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Référence</th><th>Événement</th><th>Client</th>
              <th>Montant</th><th>Statut workflow</th><th>TI+</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map(d => (
              <tr key={d.id}>
                <td>
                  <Link href={`/dossiers/${d.id}`} className="text-brand-600 font-medium hover:underline">
                    {d.reference_tom}
                  </Link>
                </td>
                <td>{EVENT_LABEL[d.type_evenement]}</td>
                <td>{d.client ?? "—"}</td>
                <td>{d.montant ? `${d.montant.toLocaleString("fr-FR")} ${d.devise ?? ""}` : "—"}</td>
                <td><span className={badgeForWorkflow(d.statut_workflow)}>{WORKFLOW_LABEL[d.statut_workflow]}</span></td>
                <td className="text-xs">{d.reference_tiplus ?? <span className="text-ink-300">—</span>}</td>
              </tr>
            ))}
            {dossiers.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink-500 py-8">Aucune transmission pour le moment.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
