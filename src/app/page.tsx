"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  badgeForOcrCourrier, OCR_COURRIER_LABEL,
} from "@/domain/labels";
import { Mail, Inbox, AlertTriangle, Send, FileSpreadsheet, Loader2, ScanLine } from "lucide-react";
import clsx from "clsx";
import type { CourrierIrd } from "@/domain/types";

function isOcrEnCours(c: CourrierIrd): boolean {
  return c.documents.some(d => d.statut_ocr === "EN_COURS");
}

export default function Dashboard() {
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const nouveauCourrier = () => {
    const c = createCourrierIrd();
    router.push(`/courriers/${c.id}`);
  };

  const cardsKpi = [
    { label: "En préparation",    value: courriers.filter(c => c.statut_workflow === "EN_PREPARATION").length,                icon: Mail,          color: "text-ink-700 bg-ink-50" },
    { label: "OCR analysé",       value: courriers.filter(c => c.statut_ocr === "OCR_ANALYSE").length,                        icon: ScanLine,      color: "text-green-700 bg-green-50" },
    { label: "À valider agence",  value: courriers.filter(c => c.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE").length,   icon: AlertTriangle, color: "text-amber-700 bg-amber-50" },
    { label: "Envoyés CTN",       value: courriers.filter(c => c.statut_workflow === "ENVOYE_CTN").length,                     icon: Send,          color: "text-brand-700 bg-brand-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tableau de bord</h1>
          <p className="text-sm text-ink-500">Remise Documentaire Import — Centralisation des courriers IRD</p>
        </div>
        <button className="btn-primary" onClick={nouveauCourrier}>
          <Mail size={16} /> Nouveau courrier
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cardsKpi.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4">
              <div className={clsx("h-9 w-9 rounded-md grid place-items-center mb-3", k.color)}>
                <Icon size={18} />
              </div>
              <div className="text-2xl font-semibold">{k.value}</div>
              <div className="text-xs text-ink-500 mt-1">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="px-4 py-3 border-b border-ink-100 flex items-center justify-between">
            <div className="font-semibold text-sm flex items-center gap-2">
              <Inbox size={16} className="text-brand-500" /> Derniers courriers
            </div>
            <Link href="/courriers" className="text-xs text-brand-600 font-medium hover:underline">Voir tout</Link>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Référence</th><th>Client</th><th>Montant</th>
                <th>OCR</th><th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {courriers.slice(0, 8).map(c => {
                const enCours = isOcrEnCours(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/courriers/${c.id}`} className="text-brand-600 font-medium hover:underline">
                        {c.reference_courrier}
                      </Link>
                    </td>
                    <td>{c.client ?? <span className="text-ink-300">—</span>}</td>
                    <td>{c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-ink-300">—</span>}</td>
                    <td>
                      {enCours ? (
                        <span className="badge-blue inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>
                      ) : (
                        <span className={badgeForOcrCourrier(c.statut_ocr)}>{OCR_COURRIER_LABEL[c.statut_ocr]}</span>
                      )}
                    </td>
                    <td><span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span></td>
                  </tr>
                );
              })}
              {courriers.length === 0 && (
                <tr><td colSpan={5} className="text-center text-ink-500 py-8">Aucun courrier — démarrez avec « Nouveau courrier ».</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <div className="font-semibold text-sm flex items-center gap-2 mb-3">
            <FileSpreadsheet size={16} className="text-ink-300" /> Gestion des opérations IRD
          </div>
          <p className="text-xs text-ink-500">
            Le module <b>Gestion des opérations IRD</b> n'est pas développé dans cette phase MVP.
            Périmètre actuel : centralisation des courriers IRD — validation agence avant envoi CTN devise.
          </p>
          <div className="mt-3 text-[11px] text-ink-400 italic">
            La création réelle du dossier IRD métier est gérée par le CTN devise (hors périmètre).
          </div>
        </div>
      </div>
    </div>
  );
}
