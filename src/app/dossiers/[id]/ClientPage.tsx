"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronLeft, Send, ScanLine, FileText, ClipboardList, Truck, History,
  CheckCircle2, AlertTriangle, MapPin, Clock, X, Plus,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  WORKFLOW_LABEL, COMPLETUDE_LABEL, OCR_LABEL, PHYSIQUE_LABEL, TACHE_LABEL, EVENT_LABEL, DOC_LABEL,
  badgeForWorkflow, badgeForCompletude, badgeForOcr,
} from "@/domain/labels";
import { getAllowedTransitions } from "@/domain/workflow";
import type { StatutPhysique } from "@/domain/types";

const PHYS_OPTIONS: StatutPhysique[] = [
  "DOCS_RECUS_AGENCE", "DOCS_EN_TRANSFERT", "DOCS_RECUS_BO",
  "DOCS_EN_AGENCE", "DOCS_REMIS_CLIENT", "DOCS_RETOUR_BO", "DOCS_ARCHIVES",
];

export default function DossierDetail({ id }: { id: string }) {

  const dossier = useTomStore(s => s.dossiers.find(d => d.id === id));
  const courrier = useTomStore(s => s.courriers.find(c => c.id === dossier?.courrierId));
  const acteur = useTomStore(s => s.acteurCourant);
  const apply = useTomStore(s => s.applyTransition);
  const envoyerTiPlus = useTomStore(s => s.envoyerTiPlus);
  const updateDossier = useTomStore(s => s.updateDossier);
  const completeTache = useTomStore(s => s.completeTache);
  const addTracking = useTomStore(s => s.addTracking);
  const lancerOcr = useTomStore(s => s.lancerOcr);

  const [tab, setTab] = useState<"apercu" | "ocr" | "docs" | "taches" | "tracking" | "historique">("apercu");
  const [trkStatus, setTrkStatus] = useState<StatutPhysique>("DOCS_EN_AGENCE");
  const [trkComment, setTrkComment] = useState("");

  if (!dossier) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Dossier introuvable. <Link href="/dossiers" className="text-brand-600">Retour</Link>
      </div>
    );
  }

  const transitions = getAllowedTransitions(dossier.type_evenement, dossier.statut_workflow, acteur);
  const tachesOuvertes = dossier.taches.filter(t => t.statut !== "TERMINEE" && t.statut !== "ANNULEE");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/dossiers" className="hover:text-brand-600">Dossiers</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{dossier.reference_tom}</span>
      </div>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/dossiers" className="text-xs text-ink-500 hover:text-brand-600 inline-flex items-center gap-1">
              <ChevronLeft size={12} /> Retour à la liste
            </Link>
            <h1 className="text-xl font-semibold mt-1">{dossier.reference_tom}</h1>
            <div className="text-sm text-ink-500">
              {EVENT_LABEL[dossier.type_evenement]} • {dossier.produit} • {dossier.agence}
              {dossier.reference_tiplus && (
                <span className="ml-2 badge-blue">TI+ {dossier.reference_tiplus}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={badgeForWorkflow(dossier.statut_workflow)}>{WORKFLOW_LABEL[dossier.statut_workflow]}</span>
            <span className={badgeForOcr(dossier.statut_ocr)}>OCR · {OCR_LABEL[dossier.statut_ocr]}</span>
            <span className={badgeForCompletude(dossier.statut_completude)}>{COMPLETUDE_LABEL[dossier.statut_completude]}</span>
            <span className="badge-orange"><MapPin size={11} className="mr-1" />{PHYSIQUE_LABEL[dossier.statut_physique]}</span>
          </div>
        </div>

        {/* Transitions workflow */}
        {transitions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-ink-100">
            <div className="text-[11px] text-ink-500 uppercase tracking-wider mb-2">Actions workflow disponibles ({acteur})</div>
            <div className="flex flex-wrap gap-2">
              {transitions.map(t => {
                const isTiPlus = t.action === "Envoyer vers TI+";
                return (
                  <button
                    key={t.action}
                    className={clsx(t.to === "REJETE" ? "btn-outline text-red-600 border-red-200" : "btn-primary")}
                    onClick={() => isTiPlus ? envoyerTiPlus(dossier.id) : apply(dossier.id, t.action)}
                  >
                    {isTiPlus && <Send size={14} />}
                    {t.action}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {dossier.statut_workflow === "EN_PREPARATION" && (
          <div className="mt-4 pt-4 border-t border-ink-100">
            <button className="btn-primary" onClick={() => lancerOcr(dossier.id)}>
              <ScanLine size={14} /> Lancer OCR
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-ink-100 flex overflow-x-auto">
          {[
            { k: "apercu", label: "Aperçu" },
            { k: "ocr", label: "OCR & contrôle doc" },
            { k: "docs", label: `Documents (${dossier.documents.length})` },
            { k: "taches", label: `Tâches (${tachesOuvertes.length})` },
            { k: "tracking", label: "Tracking physique" },
            { k: "historique", label: "Historique" },
          ].map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition",
                tab === t.k
                  ? "border-brand-500 text-brand-700"
                  : "border-transparent text-ink-500 hover:text-ink-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "apercu" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section>
                <div className="section-title">Courrier</div>
                <Grid items={[
                  ["Référence", courrier?.reference_courrier],
                  ["Transporteur", courrier?.reference_transporteur],
                  ["Type", courrier?.type_courrier],
                  ["Numéro lot", courrier?.numero_lot],
                  ["Expéditeur", courrier?.entite_expediteur],
                  ["Date réception", courrier ? new Date(courrier.date_reception).toLocaleDateString("fr-FR") : "—"],
                ]} />
              </section>
              <section>
                <div className="section-title">Dossier</div>
                <Grid items={[
                  ["Référence dossier", dossier.reference_tom],
                  ["Référence TI+", dossier.reference_tiplus ?? "—"],
                  ["Produit", dossier.produit],
                  ["Événement", EVENT_LABEL[dossier.type_evenement]],
                  ["Client", dossier.client],
                  ["Montant", dossier.montant ? `${dossier.montant.toLocaleString("fr-FR")} ${dossier.devise ?? ""}` : "—"],
                  ["Référence interne", dossier.reference_interne],
                  ["Référence externe", dossier.reference_externe],
                  ["Gestionnaire BO", dossier.gestionnaire_bo],
                ]} />
              </section>
            </div>
          )}

          {tab === "ocr" && (
            <div className="space-y-6">
              <section>
                <div className="section-title">OCR — données extraites</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Edit label="Client" v={dossier.client ?? ""} on={v => updateDossier(dossier.id, { client: v })} />
                  <Edit label="Montant" v={dossier.montant?.toString() ?? ""} type="number" on={v => updateDossier(dossier.id, { montant: parseFloat(v) || undefined })} />
                  <Edit label="Devise" v={dossier.devise ?? ""} on={v => updateDossier(dossier.id, { devise: v })} />
                  <Edit label="Référence interne" v={dossier.reference_interne ?? ""} on={v => updateDossier(dossier.id, { reference_interne: v })} />
                  <Edit label="Référence externe" v={dossier.reference_externe ?? ""} on={v => updateDossier(dossier.id, { reference_externe: v })} />
                </div>
              </section>
              <section>
                <div className="section-title">Contrôle documentaire (non bloquant)</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-sm"><span className="text-ink-500">Score complétude :</span> <b>{dossier.score_completude ?? 0}%</b></div>
                  {dossier.statut_completude === "COMPLET"
                    ? <span className="badge-green"><CheckCircle2 size={12} className="mr-1" />Complet</span>
                    : <span className="badge-red"><AlertTriangle size={12} className="mr-1" />Avec écart</span>}
                </div>
                <table className="tbl">
                  <thead><tr><th>Type</th><th>Attendu</th><th>Détecté</th><th>Écart</th></tr></thead>
                  <tbody>
                    {dossier.controle_doc.map(l => {
                      const e = l.nombre_detecte - l.nombre_attendu;
                      return (
                        <tr key={l.type_document}>
                          <td>{DOC_LABEL[l.type_document]}</td>
                          <td>{l.nombre_attendu}</td>
                          <td>{l.nombre_detecte}</td>
                          <td>{e === 0 ? <span className="badge-green">OK</span> : e < 0 ? <span className="badge-red">{e}</span> : <span className="badge-amber">+{e}</span>}</td>
                        </tr>
                      );
                    })}
                    {dossier.controle_doc.length === 0 && <tr><td colSpan={4} className="text-center text-ink-500 py-3">Aucun contrôle (OCR non terminé)</td></tr>}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {tab === "docs" && (
            <section>
              <div className="section-title flex items-center gap-2"><FileText size={14} /> Documents GED</div>
              <table className="tbl">
                <thead><tr><th>Fichier</th><th>Type</th><th>Date</th></tr></thead>
                <tbody>
                  {dossier.documents.map(d => (
                    <tr key={d.id}>
                      <td className="font-medium">{d.filename}</td>
                      <td><span className="badge-gray">{DOC_LABEL[d.type_document]}</span></td>
                      <td className="text-xs text-ink-500">{new Date(d.uploadedAt).toLocaleString("fr-FR")}</td>
                    </tr>
                  ))}
                  {dossier.documents.length === 0 && <tr><td colSpan={3} className="text-center text-ink-500 py-4">Aucun document</td></tr>}
                </tbody>
              </table>
            </section>
          )}

          {tab === "taches" && (
            <section>
              <div className="section-title flex items-center gap-2"><ClipboardList size={14} /> Tâches du workflow</div>
              <table className="tbl">
                <thead><tr><th>Type</th><th>Équipe</th><th>Acteur</th><th>Statut</th><th>Créée</th><th></th></tr></thead>
                <tbody>
                  {dossier.taches.map(t => (
                    <tr key={t.id}>
                      <td>{TACHE_LABEL[t.type_tache]}</td>
                      <td>{t.equipe}</td>
                      <td>{t.acteur ?? "—"}</td>
                      <td>
                        {t.statut === "A_FAIRE" && <span className="badge-amber">À faire</span>}
                        {t.statut === "EN_COURS" && <span className="badge-blue">En cours</span>}
                        {t.statut === "TERMINEE" && <span className="badge-green">Terminée</span>}
                        {t.statut === "ANNULEE" && <span className="badge-gray">Annulée</span>}
                      </td>
                      <td className="text-xs">{new Date(t.date_creation).toLocaleString("fr-FR")}</td>
                      <td className="text-right">
                        {t.statut === "A_FAIRE" && (
                          <button className="btn-outline text-xs" onClick={() => completeTache(dossier.id, t.id, acteur)}>
                            <CheckCircle2 size={12} /> Terminer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {dossier.taches.length === 0 && <tr><td colSpan={6} className="text-center text-ink-500 py-4">Aucune tâche</td></tr>}
                </tbody>
              </table>
            </section>
          )}

          {tab === "tracking" && (
            <section className="space-y-4">
              <div className="section-title flex items-center gap-2"><Truck size={14} /> Tracking documents physiques</div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <div className="label">Nouveau statut physique</div>
                  <select className="input" value={trkStatus} onChange={e => setTrkStatus(e.target.value as StatutPhysique)}>
                    {PHYS_OPTIONS.map(s => <option key={s} value={s}>{PHYSIQUE_LABEL[s]}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                  <div className="label">Commentaire</div>
                  <input className="input" value={trkComment} onChange={e => setTrkComment(e.target.value)} placeholder="optionnel" />
                </div>
                <button className="btn-primary h-10" onClick={() => { addTracking(dossier.id, trkStatus, trkComment || undefined); setTrkComment(""); }}>
                  <Plus size={14} /> Ajouter
                </button>
              </div>

              <ol className="relative border-l-2 border-ink-100 ml-2 mt-4 space-y-4">
                {[...dossier.tracking].reverse().map(t => (
                  <li key={t.id} className="ml-4">
                    <span className="absolute -left-[7px] mt-1 h-3 w-3 rounded-full bg-brand-500 border-2 border-white" />
                    <div className="text-sm font-medium">{PHYSIQUE_LABEL[t.statut_physique]}</div>
                    <div className="text-xs text-ink-500">{new Date(t.date).toLocaleString("fr-FR")} {t.commentaire ? `• ${t.commentaire}` : ""}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {tab === "historique" && (
            <section>
              <div className="section-title flex items-center gap-2"><History size={14} /> Historique du dossier</div>
              <ul className="divide-y divide-ink-100">
                {[...dossier.historique].reverse().map(h => (
                  <li key={h.id} className="py-3 flex items-start gap-3">
                    <Clock size={14} className="mt-0.5 text-ink-500" />
                    <div>
                      <div className="text-sm">{h.message}</div>
                      <div className="text-[11px] text-ink-500">{new Date(h.date).toLocaleString("fr-FR")} • {h.acteur} • {h.type}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Grid({ items }: { items: [string, any][] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(([k, v]) => (
        <div key={k}>
          <div className="label">{k}</div>
          <div className="text-sm font-medium text-ink-700">{v || <span className="text-ink-300">—</span>}</div>
        </div>
      ))}
    </div>
  );
}
function Edit({ label, v, on, type = "text" }: { label: string; v: string; on: (v: string) => void; type?: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <input className="input" type={type} value={v} onChange={e => on(e.target.value)} />
    </div>
  );
}
