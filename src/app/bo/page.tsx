"use client";

import Link from "next/link";
import { useState } from "react";
import { Inbox, UserPlus, Filter } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import {
  WORKFLOW_LABEL, COMPLETUDE_LABEL, badgeForWorkflow,
  badgeForCompletude, EVENT_LABEL, badgeForOcr, OCR_LABEL,
} from "@/domain/labels";
import type { StatutWorkflow } from "@/domain/types";

const GESTIONNAIRES = ["S. El Amrani", "Y. Bennani", "K. Tazi", "M. Lahlou"];

// BO ne voit que les dossiers transmis et au-delà
const BO_VISIBLE: StatutWorkflow[] = ["TRANSMIS_BO", "EN_TRAITEMENT_BO", "ENVOYE_TI_PLUS", "DOSSIER_CREE"];

export default function BoPage() {
  const dossiers = useTomStore(s => s.dossiers);
  const assign = useTomStore(s => s.assignGestionnaire);
  const acteur = useTomStore(s => s.acteurCourant);

  const [filter, setFilter] = useState<"TOUS" | StatutWorkflow>("TOUS");
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [gestionnaire, setGestionnaire] = useState(GESTIONNAIRES[0]);

  // BO ne voit le dossier qu'après fin OCR -> on filtre par BO_VISIBLE
  const visible = dossiers.filter(d => BO_VISIBLE.includes(d.statut_workflow));
  const items = filter === "TOUS" ? visible : visible.filter(d => d.statut_workflow === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Back Office IRD</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Inbox className="text-brand-500" size={20} /> File Back Office IRD
        </h1>
        <div className="text-xs text-ink-500">Rôle courant : <span className="font-semibold text-ink-700">{acteur}</span></div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-3">
          <Filter size={14} className="text-ink-500" />
          <select className="input h-9 w-56" value={filter} onChange={e => setFilter(e.target.value as any)}>
            <option value="TOUS">Tous les statuts visibles BO</option>
            {BO_VISIBLE.map(s => <option key={s} value={s}>{WORKFLOW_LABEL[s]}</option>)}
          </select>
          <div className="ml-auto text-xs text-ink-500">{items.length} dossier(s)</div>
        </div>

        <table className="tbl">
          <thead>
            <tr>
              <th>Référence</th><th>Événement</th><th>Client</th>
              <th>Montant</th><th>Agence</th><th>Gestionnaire</th>
              <th>OCR</th><th>Complétude</th><th>Statut</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(d => (
              <tr key={d.id}>
                <td>
                  <Link href={`/dossiers/${d.id}`} className="text-brand-600 font-medium hover:underline">
                    {d.reference_tom}
                  </Link>
                </td>
                <td>{EVENT_LABEL[d.type_evenement]}</td>
                <td>{d.client ?? "—"}</td>
                <td>{d.montant ? `${d.montant.toLocaleString("fr-FR")} ${d.devise ?? ""}` : "—"}</td>
                <td>{d.agence ?? "—"}</td>
                <td>{d.gestionnaire_bo ?? <span className="text-ink-300">Non affecté</span>}</td>
                <td><span className={badgeForOcr(d.statut_ocr)}>{OCR_LABEL[d.statut_ocr]}</span></td>
                <td><span className={badgeForCompletude(d.statut_completude)}>{COMPLETUDE_LABEL[d.statut_completude]}</span></td>
                <td><span className={badgeForWorkflow(d.statut_workflow)}>{WORKFLOW_LABEL[d.statut_workflow]}</span></td>
                <td className="text-right">
                  {!d.gestionnaire_bo && acteur === "RESPONSABLE_BO" && (
                    <button className="btn-outline text-xs" onClick={() => setAssignFor(d.id)}>
                      <UserPlus size={12} /> Affecter
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={10} className="text-center text-ink-500 py-8">Aucun dossier dans la file BO.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* affectation modal */}
      {assignFor && (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50" onClick={() => setAssignFor(null)}>
          <div className="card p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="font-semibold mb-3">Affecter un gestionnaire BO</div>
            <select className="input mb-4" value={gestionnaire} onChange={e => setGestionnaire(e.target.value)}>
              {GESTIONNAIRES.map(g => <option key={g}>{g}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setAssignFor(null)}>Annuler</button>
              <button
                className="btn-primary"
                onClick={() => { assign(assignFor, gestionnaire); setAssignFor(null); }}
              >Affecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
