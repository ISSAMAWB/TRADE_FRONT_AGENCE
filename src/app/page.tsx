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
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";

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
    { label: "En préparation",    value: courriers.filter(c => c.statut_workflow === "EN_PREPARATION").length,                icon: Mail,          color: "text-gray-900 bg-orange-50" },
    { label: "OCR analysé",       value: courriers.filter(c => c.statut_ocr === "OCR_ANALYSE").length,                        icon: ScanLine,      color: "text-green-700 bg-green-50" },
    { label: "À valider agence",  value: courriers.filter(c => c.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE").length,   icon: AlertTriangle, color: "text-amber-700 bg-amber-50" },
    { label: "Envoyés CTN",       value: courriers.filter(c => c.statut_workflow === "ENVOYE_CTN").length,                     icon: Send,          color: "text-orange-700 bg-orange-100" },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-display">Tableau de bord</h1>
            <p className="text-subtitle">Remise Documentaire Import — Centralisation des courriers IRD</p>
          </div>
          <Button onClick={nouveauCourrier}>
            <Mail size={16} /> Nouveau courrier
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cardsKpi.map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label}>
                <div className="flex items-center gap-3">
                  <div className={clsx("h-12 w-12 rounded-lg grid place-items-center", k.color)}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold text-gray-900">{k.value}</div>
                    <div className="text-xs text-gray-600 mt-1">{k.label}</div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <div className="card-header flex items-center justify-between">
              <div className="text-title flex items-center gap-2">
                <Inbox size={18} className="text-orange-500" /> Derniers courriers
              </div>
              <Link href="/courriers" className="text-sm text-orange-600 font-medium hover:underline">Voir tout</Link>
            </div>
            <div className="table-container">
              <table className="table">
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
                          <Link href={`/courriers/${c.id}`} className="text-orange-600 font-medium hover:underline">
                            {c.reference_courrier}
                          </Link>
                        </td>
                        <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                        <td>{c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-gray-400">—</span>}</td>
                        <td>
                          {enCours ? (
                            <span className="badge-primary inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>
                          ) : (
                            <span className={badgeForOcrCourrier(c.statut_ocr)}>{OCR_COURRIER_LABEL[c.statut_ocr]}</span>
                          )}
                        </td>
                        <td><span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span></td>
                      </tr>
                    );
                  })}
                  {courriers.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-gray-400 py-8">Aucun courrier — démarrez avec « Nouveau courrier ».</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="text-title flex items-center gap-2 mb-3">
              <FileSpreadsheet size={18} className="text-gray-400" /> Gestion des opérations IRD
            </div>
            <p className="text-sm text-gray-600">
              Le module <b>Gestion des opérations IRD</b> n'est pas développé dans cette phase MVP.
              Périmètre actuel : centralisation des courriers IRD — validation agence avant envoi CTN devise.
            </p>
            <div className="mt-3 text-xs text-gray-400 italic">
              La création réelle du dossier IRD métier est gérée par le CTN devise (hors périmètre).
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
