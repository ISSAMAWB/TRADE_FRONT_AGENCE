"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, History } from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import Shell from "@/components/Shell";
import type { HistoriqueEvent } from "@/domain/types";

export default function CentralisationHistorique() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const courrier = useTomStore(s => s.courriersIrd.find(c => c.id === id));

  if (!courrier) {
    return (
      <Shell>
        <div className="card p-10 text-center text-ink-500">
          Centralisation introuvable. <Link href="/remises-doc/import" className="text-brand-600">Retour à la liste</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-ink-500">
          <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
          <span>/</span>
          <Link href="/remises-doc/import" className="hover:text-brand-600">Centralisation REMDOC Import</Link>
          <span>/</span>
          <Link href={`/remises-doc/import/${courrier.id}`} className="hover:text-brand-600">{courrier.reference_courrier}</Link>
          <span>/</span>
          <span className="text-ink-700 font-medium">Historique</span>
        </div>

        {/* En-tête */}
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href={`/remises-doc/import/${courrier.id}`} className="text-xs text-ink-500 hover:text-brand-600 inline-flex items-center gap-1">
                <ChevronLeft size={12} /> {courrier.reference_courrier}
              </Link>
              <h1 className="text-xl font-semibold mt-1 flex items-center gap-2">
                <History size={20} className="text-orange-500" /> Historique de la centralisation
              </h1>
              <div className="text-sm text-ink-500 mt-1">
                <span className="font-medium">{courrier.reference_courrier}</span>
                {" · "}<span className="badge-produit">{PRODUIT_IRD_LABEL[courrier.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span>
                {" · "}Client : {courrier.client ?? "—"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Statut actuel :</span>
              <span className={badgeForCourrierWorkflow(courrier.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[courrier.statut_workflow]}</span>
            </div>
          </div>
        </div>

        {/* Timeline verticale */}
        <div className="card p-5">
          <div className="relative pl-7">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />
            {courrier.historique.map((ev, idx) => (
              <TimelineItem key={ev.id} ev={ev} isLast={idx === courrier.historique.length - 1} />
            ))}
            {courrier.historique.length === 0 && (
              <div className="text-sm text-gray-400 py-4">Aucun événement enregistré.</div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function acteurLabel(acteur: string): string | null {
  switch (acteur) {
    case "AGENCE": return "Saisie Agence";
    case "RESPONSABLE_AGENCE": return "Responsable Agence";
    case "CTN_DEVISE": return "CTN Devise";
    case "SYSTEM": return null; // événement système, pas d'auteur affiché
    default: return acteur;
  }
}

function TimelineItem({ ev, isLast }: { ev: HistoriqueEvent; isLast: boolean }) {
  const isRetour = ev.type === "RETOUR_AGENCE" || ev.type === "RETOUR_CTN";
  const isCorrection = ev.type === "CORRECTION";
  const isValidation = ev.type === "VALIDATION_AGENCE" || ev.type === "VALIDATION_CTN";
  const isTransmission = ev.type === "TRANSMISSION_CTN";
  const isCreation = ev.type === "CREATION";

  const dotColor = isRetour ? "bg-red-500" :
    isValidation ? "bg-green-500" :
    isTransmission ? "bg-blue-500" :
    isCorrection ? "bg-amber-500" :
    isCreation ? "bg-blue-500" :
    "bg-orange-500"; // SOUMISSION, BROUILLON, autres

  const acteur = acteurLabel(ev.acteur);

  return (
    <div className={clsx("relative", !isLast && "pb-7")}>
      <div className={clsx("absolute left-[-21px] top-1 w-3 h-3 rounded-full ring-2 ring-white", dotColor)} />
      <div className="text-xs text-gray-400">
        {new Date(ev.date).toLocaleDateString("fr-FR")} — {new Date(ev.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div className={clsx("text-sm font-semibold mt-0.5", isRetour ? "text-red-800" : "text-gray-900")}>
        {ev.message}
      </div>
      {acteur && (
        <div className="text-xs text-gray-500 mt-0.5">Par : {acteur}</div>
      )}
      {(isRetour || ev.motif) && (
        <div className="mt-2 p-3 rounded-md bg-red-50 border border-red-100 text-sm max-w-lg">
          {ev.motif && (
            <div><span className="text-gray-500 font-medium text-xs">Motif :</span> <span className="font-semibold text-red-900">{ev.motif}</span></div>
          )}
          {ev.commentaire && (
            <div className="mt-1"><span className="text-gray-500 font-medium text-xs">Commentaire :</span> <span className="text-red-800">{ev.commentaire}</span></div>
          )}
        </div>
      )}
    </div>
  );
}
