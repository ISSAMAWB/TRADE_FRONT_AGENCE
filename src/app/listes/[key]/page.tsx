"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { ChevronLeft, ListChecks, History, Pencil, Eye, Undo2, BellRing } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow, PRODUIT_IRD_LABEL,
  MOTIF_RETOUR_CENTRALISATION_LABEL, MODALITE_LABEL, STATUT_PAIEMENT_LABEL,
} from "@/domain/labels";
import {
  LISTES, filtrerDossiers, contexteMetier,
  retourDocumentsAFaire, remiseARelancer, acceptationARelancer,
} from "@/domain/pilotage";
import type { CourrierIrd } from "@/domain/types";
import Shell from "@/components/Shell";

export default function ListePilotagePage() {
  return (
    <Suspense fallback={<Shell><div className="text-sm text-gray-400 p-6">Chargement…</div></Shell>}>
      <ListePilotageInner />
    </Suspense>
  );
}

const PARAM_LABELS: Record<string, string> = {
  q: "Recherche", ref: "Référence", ref_interne: "Réf. interne", ref_externe: "Réf. externe",
  client: "Client", statut: "Statut", devise: "Devise", montant_min: "Montant ≥",
  montant_max: "Montant ≤", date_debut: "Réception ≥", date_fin: "Réception ≤",
  agence: "Agence", type_retour: "Type de retour", modalite: "Modalité",
  statut_paiement: "Paiement", etat_echeance: "Échéance", echeance_du: "Échéance ≥",
  echeance_au: "Échéance ≤", derniere_action: "Dernière action ≥",
};

function chipValue(key: string, v: string): string {
  if (key === "statut") return v.split(",").map(s => COURRIER_WORKFLOW_LABEL[s as keyof typeof COURRIER_WORKFLOW_LABEL] ?? s).join(", ");
  if (key === "type_retour") return v === "RETOUR_CTN" ? "Retour CTN" : "Retour Agence";
  if (key === "modalite") return MODALITE_LABEL[v as keyof typeof MODALITE_LABEL] ?? v;
  if (key === "statut_paiement") return STATUT_PAIEMENT_LABEL[v as keyof typeof STATUT_PAIEMENT_LABEL] ?? v;
  if (key === "etat_echeance") return v === "ECHUE" ? "Échue" : v === "A_VENIR" ? "À venir" : v;
  return v;
}

function ListePilotageInner() {
  const params = useParams<{ key: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);

  const key = params?.key ?? "en-cours";
  const isRecherche = key === "recherche";
  const def = LISTES[key];

  const paramsObj = useMemo(() => {
    const o: Record<string, string> = {};
    sp.forEach((v, k) => { o[k] = v; });
    return o;
  }, [sp]);

  const items = useMemo(() => {
    let base = courriers;
    if (!isRecherche && def) base = base.filter(def.filter);
    return filtrerDossiers(base, paramsObj);
  }, [courriers, def, isRecherche, paramsObj]);

  const titre = isRecherche ? "Résultats de recherche" : def?.titre ?? "Liste";
  const regle = isRecherche
    ? "Recherche sur la référence centralisation, les références interne/externe et le client / tiré."
    : def?.regle ?? "";

  const chips = Object.entries(paramsObj).filter(([, v]) => v);

  function handleCorriger(c: CourrierIrd) {
    if (c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN") {
      applyAction(c.id, "CORRIGER");
    }
    router.push(`/remises-doc/import/${c.id}`);
  }

  function actionFor(c: CourrierIrd) {
    if (c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION") {
      return (
        <button className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1" onClick={() => handleCorriger(c)}>
          <Pencil size={12} /> Corriger
        </button>
      );
    }
    if (retourDocumentsAFaire(c)) {
      return (
        <button
          className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1"
          onClick={() => applyAction(c.id, "RETOURNER_DOCUMENTS")}
        >
          <Undo2 size={12} /> Retourner les documents
        </button>
      );
    }
    if (remiseARelancer(c) || acceptationARelancer(c)) {
      return (
        <button
          className="btn-outline text-xs h-8 px-3 inline-flex items-center gap-1"
          onClick={() => applyAction(c.id, "RELANCER")}
        >
          <BellRing size={12} /> Relancer
        </button>
      );
    }
    return (
      <Link href={`/remises-doc/import/${c.id}`}>
        <button className="btn-ghost text-xs h-8 px-2 inline-flex items-center gap-1"><Eye size={12} /> Voir le dossier</button>
      </Link>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        {/* Retour + titre + règle */}
        <div>
          <Link href="/" className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1">
            <ChevronLeft size={12} /> Retour au pilotage
          </Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-display flex items-center gap-2">
              <ListChecks className="text-orange-500" size={22} /> {titre}
            </h1>
            <span className="badge-gray text-sm">{items.length} dossier{items.length > 1 ? "s" : ""}</span>
          </div>
          {regle && <p className="text-subtitle mt-1">{regle}</p>}
        </div>

        {/* Chips filtres actifs */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map(([k, v]) => (
              <span key={k} className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-medium">
                {PARAM_LABELS[k] ?? k} : {chipValue(k, v)}
              </span>
            ))}
            <Link href="/" className="text-xs text-orange-600 font-medium hover:underline">Modifier les filtres</Link>
          </div>
        )}

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Produit</th>
                <th>Client / Tiré</th>
                <th className="text-right">Montant</th>
                <th>Contexte métier</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td className="whitespace-nowrap">
                    <Link href={`/remises-doc/import/${c.id}`} className="font-medium hover:underline text-orange-500">
                      {c.reference_courrier}
                    </Link>
                    {c.reference_interne && <div className="text-[10px] text-gray-400">{c.reference_interne}</div>}
                  </td>
                  <td className="whitespace-nowrap"><span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span></td>
                  <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                  <td className="text-right whitespace-nowrap">
                    {c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="text-xs text-gray-600 max-w-[260px]">
                    {contexteMetier(c) ?? <span className="text-gray-400">—</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                    {(c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION") && c.dernier_retour && (
                      <div className="text-[10px] text-red-600 mt-1">{MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {actionFor(c)}
                      <Link href={`/remises-doc/import/${c.id}/historique`} className="relative group">
                        <button className="btn-ghost h-8 w-8 !p-0 grid place-items-center text-ink-500">
                          <History size={15} />
                        </button>
                        <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1 z-20 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg">
                          Consulter l'historique
                        </span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">
                    Aucun dossier ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
