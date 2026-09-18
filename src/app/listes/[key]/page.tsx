"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { ChevronLeft, ListChecks, History, Pencil, Eye, Undo2, BellRing, Download, Mail, Filter } from "lucide-react";
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
import Card from "@/components/ui/Card";
import PilotageHeader, { type PilotageTab } from "@/components/pilotage/PilotageHeader";
import { exporterCsvDossiers } from "@/lib/exportCsv";

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

function activeTabFor(key: string): PilotageTab | null {
  if (key === "toutes") return "a-traiter";
  if (key === "relances" || key === "relance-remise" || key === "relance-acceptation") return "relances";
  if (key === "alertes" || key === "ctn-non-recus" || key === "retour-docs") return "alertes";
  if (key === "en-cours") return "dossiers";
  if (key.startsWith("ech-")) return "echeancier";
  return null;
}

function ListePilotageInner() {
  const params = useParams<{ key: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const nouveauCourrier = () => {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  };

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

  const exporterCSV = () => exporterCsvDossiers(items, `liste-${key}`);

  return (
    <Shell>
      <div className="space-y-4">
        <PilotageHeader
          actif={activeTabFor(key)}
          fil={titre}
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

        <Card>
          <div className="p-5">
            {/* Header carte : titre + compteur + retour */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <ListChecks size={15} className="text-orange-500" /> {titre}
                <span className="badge-gray">{items.length} dossier{items.length > 1 ? "s" : ""}</span>
              </div>
              <Link href="/" className="btn-outline h-8 text-xs inline-flex items-center gap-1">
                <ChevronLeft size={12} /> Retour au pilotage
              </Link>
            </div>

            {/* Règle métier */}
            {regle && <p className="text-sm text-gray-600 mt-2">{regle}</p>}

            {/* Chips filtres actifs */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                <Filter size={11} /> Agence : Casablanca
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                <Filter size={11} /> Produit : {paramsObj.produit ? (PRODUIT_IRD_LABEL[paramsObj.produit as keyof typeof PRODUIT_IRD_LABEL] ?? paramsObj.produit) : "Tous les produits"}
              </span>
              {chips.filter(([k]) => k !== "produit").map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                  <Filter size={11} /> {PARAM_LABELS[k] ?? k} : {chipValue(k, v)}
                </span>
              ))}
              <Link href="/" className="text-xs text-orange-600 font-medium hover:underline">Modifier les filtres</Link>
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto mt-3">
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
                        {c.reference_interne && <div className="text-[11px] text-gray-500">Int. {c.reference_interne}</div>}
                      </td>
                      <td className="whitespace-nowrap"><span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span></td>
                      <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                      <td className="text-right whitespace-nowrap">
                        {c.montant ? (
                          <>
                            <div className="font-semibold text-gray-900">{c.montant.toLocaleString("fr-FR")}</div>
                            <div className="text-[11px] text-gray-500">{c.devise}</div>
                          </>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="text-xs text-gray-700 max-w-[260px]">
                        {contexteMetier(c) ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="whitespace-nowrap">
                        {(c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION") ? (
                          <>
                            <span className="badge-red">Retour à corriger</span>
                            {c.dernier_retour && (
                              <div className="text-[10px] text-red-600 mt-1">{MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}</div>
                            )}
                          </>
                        ) : retourDocumentsAFaire(c) ? (
                          <span className="badge-amber">Remise non effectuée</span>
                        ) : (
                          <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {actionFor(c)}
                          <Link href={`/remises-doc/import/${c.id}/historique`} className="relative group">
                            <button className="btn-ghost h-8 w-8 !p-0 grid place-items-center text-gray-500">
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

            {/* Pied */}
            <div className="flex justify-between text-[11px] text-gray-500 pt-3 border-t border-gray-100 mt-2">
              <span>Affichage de 1 à {items.length} sur {items.length} dossier{items.length > 1 ? "s" : ""}</span>
              <span>Arrêté au {new Date().toLocaleDateString("fr-FR")} {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
