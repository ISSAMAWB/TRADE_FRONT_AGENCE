"use client";

import Link from "next/link";
import { useTomStore } from "@/store/useTomStore";
import { FolderOpen } from "lucide-react";
import {
  WORKFLOW_LABEL, COMPLETUDE_LABEL, EVENT_LABEL,
  badgeForWorkflow, badgeForCompletude, badgeForOcr, OCR_LABEL,
} from "@/domain/labels";

export default function DossiersPage() {
  const dossiers = useTomStore(s => s.dossiers);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Dossiers</span>
      </div>
      <h1 className="text-xl font-semibold flex items-center gap-2">
        <FolderOpen className="text-brand-500" size={20} /> Tous les dossiers
      </h1>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Référence</th><th>TI+</th><th>Produit</th><th>Événement</th>
              <th>Client</th><th>Montant</th><th>OCR</th><th>Complétude</th><th>Statut</th>
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
                <td className="text-xs">{d.reference_tiplus ?? <span className="text-ink-300">—</span>}</td>
                <td>{d.produit}</td>
                <td>{EVENT_LABEL[d.type_evenement]}</td>
                <td>{d.client ?? "—"}</td>
                <td>{d.montant ? `${d.montant.toLocaleString("fr-FR")} ${d.devise ?? ""}` : "—"}</td>
                <td><span className={badgeForOcr(d.statut_ocr)}>{OCR_LABEL[d.statut_ocr]}</span></td>
                <td><span className={badgeForCompletude(d.statut_completude)}>{COMPLETUDE_LABEL[d.statut_completude]}</span></td>
                <td><span className={badgeForWorkflow(d.statut_workflow)}>{WORKFLOW_LABEL[d.statut_workflow]}</span></td>
              </tr>
            ))}
            {dossiers.length === 0 && (
              <tr><td colSpan={9} className="text-center text-ink-500 py-8">Aucun dossier.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
