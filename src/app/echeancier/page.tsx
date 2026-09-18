"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { CalendarClock, BellRing, Eye, Download, Mail } from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  MODALITE_LABEL, STATUT_PAIEMENT_LABEL, badgeForStatutPaiement,
  badgeForCourrierWorkflow, COURRIER_WORKFLOW_LABEL, effetLabel, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import { etatEcheanceV5, joursEcheance, badgeEcheance, libelleEcheance, echeanceASuivre } from "@/domain/pilotage";
import type { CourrierIrd } from "@/domain/types";
import Shell from "@/components/Shell";
import PilotageHeader from "@/components/pilotage/PilotageHeader";

type Onglet = "venir" | "echues";

export default function EcheancierPage() {
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const [onglet, setOnglet] = useState<Onglet>("venir");

  const nouveauCourrier = () => {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  };

  function exporterCSV() {
    const lignes = [
      ["Référence", "Produit", "Client/Tiré", "Montant", "Devise", "Statut", "Échéance"],
      ...courriers.filter(echeanceASuivre).map(c => [
        c.reference_courrier,
        PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"],
        c.client ?? "", String(c.montant ?? ""), c.devise ?? "",
        COURRIER_WORKFLOW_LABEL[c.statut_workflow],
        c.date_echeance ? new Date(c.date_echeance).toLocaleDateString("fr-FR") : "",
      ]),
    ];
    const csv = lignes.map(r => r.map(v => `"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `echeancier-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const aVenir = useMemo(
    () => courriers.filter(c => etatEcheanceV5(c) === "A_VENIR")
      .sort((a, b) => (a.date_echeance ?? "").localeCompare(b.date_echeance ?? "")),
    [courriers]
  );
  const echues = useMemo(
    () => courriers.filter(c => etatEcheanceV5(c) === "ECHUE")
      .sort((a, b) => (b.date_echeance ?? "").localeCompare(a.date_echeance ?? "")),
    [courriers]
  );
  const sortis = useMemo(
    () => courriers.filter(c => etatEcheanceV5(c) === "HORS_INDICATEUR"),
    [courriers]
  );

  const items = onglet === "venir" ? aVenir : echues;

  return (
    <Shell>
      <div className="space-y-4">
        <PilotageHeader
          actif="echeancier"
          fil="Échéancier"
          actions={
            <>
              <button className="btn-outline h-10 inline-flex items-center gap-2" onClick={exporterCSV}>
                <Download size={15} /> Exporter
              </button>
              <button className="btn-primary h-10 inline-flex items-center gap-2" onClick={nouveauCourrier}>
                <Mail size={16} /> Nouvelle centralisation
              </button>
            </>
          }
        />
        <div>
          <p className="text-subtitle">
            Échéances visibles : à venir ≤ 10 jours et échues &lt; 45 jours. Les échéances dépassées depuis ≥ 45 jours sortent de l'indicateur.
          </p>
        </div>

        {/* Onglets */}
        <div className="flex gap-2">
          <button
            onClick={() => setOnglet("venir")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium border transition",
              onglet === "venir" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            )}
          >
            À venir ≤ 10 jours ({aVenir.length})
          </button>
          <button
            onClick={() => setOnglet("echues")}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium border transition",
              onglet === "echues" ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            )}
          >
            Échues &lt; 45 jours ({echues.length})
          </button>
        </div>

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client / Tiré</th>
                <th>Effet</th>
                <th>Échéance</th>
                <th className="text-right">Montant</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <EcheanceRow key={c.id} c={c} onglet={onglet} onRelancer={() => applyAction(c.id, "RELANCER")} />
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">Aucune échéance sur cet onglet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Sortis de l'indicateur */}
        {sortis.length > 0 && (
          <div className="card p-4 bg-gray-50 border-gray-200">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Sortis de l'indicateur (≥ J+45) — à confirmer métier
            </div>
            <div className="space-y-1">
              {sortis.map(c => (
                <div key={c.id} className="text-xs text-gray-500">
                  {c.reference_courrier} échu depuis {joursEcheance(c)} jours : sorti de l'indicateur (≥ J+45).
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}

function EcheanceRow({ c, onglet, onRelancer }: { c: CourrierIrd; onglet: Onglet; onRelancer: () => void }) {
  const j = joursEcheance(c);
  const badge = badgeEcheance(c);
  const libelle = libelleEcheance(c);
  const effet = effetLabel(c);

  const badgeClass = j != null && j > 0 ? "badge-red" : j === 0 ? "badge-orange" : j != null && j >= -3 ? "badge-amber" : "badge-blue";

  return (
    <tr>
      <td className="whitespace-nowrap">
        <Link href={`/remises-doc/import/${c.id}`} className="font-medium hover:underline text-orange-500">
          {c.reference_courrier}
        </Link>
        {c.modalite && <div className="text-[10px] text-gray-400">{MODALITE_LABEL[c.modalite]}</div>}
      </td>
      <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
      <td className="whitespace-nowrap">
        {c.effet ? <span className={effet.badge}>{effet.label}</span> : <span className="text-gray-400 text-xs">{effet.label}</span>}
      </td>
      <td className="whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={badgeClass}>{badge}</span>
          <div>
            <div className="text-xs font-medium text-gray-900">
              {c.date_echeance ? new Date(c.date_echeance).toLocaleDateString("fr-FR") : "—"}
            </div>
            <div className="text-[10px] text-gray-500">{libelle}</div>
          </div>
        </div>
      </td>
      <td className="text-right whitespace-nowrap">
        {c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-gray-400">—</span>}
      </td>
      <td className="whitespace-nowrap">
        {c.statut_paiement
          ? <span className={badgeForStatutPaiement(c.statut_paiement)}>{STATUT_PAIEMENT_LABEL[c.statut_paiement]}</span>
          : <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>}
      </td>
      <td className="whitespace-nowrap">
        {onglet === "venir" ? (
          <button className="btn-outline text-xs h-8 px-3 inline-flex items-center gap-1" onClick={onRelancer}>
            <BellRing size={12} /> Relancer
          </button>
        ) : (
          <Link href={`/remises-doc/import/${c.id}`}>
            <button className="btn-ghost text-xs h-8 px-2 inline-flex items-center gap-1"><Eye size={12} /> Voir le dossier</button>
          </Link>
        )}
      </td>
    </tr>
  );
}
