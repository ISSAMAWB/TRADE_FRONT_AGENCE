"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Plus, Inbox } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import type { TypeCourrier, TypeEvenement, StatutWorkflow } from "@/domain/types";
import { WORKFLOW_LABEL, EVENT_LABEL, badgeForWorkflow } from "@/domain/labels";

// Agence voit ses sessions jusqu'à la transmission BO incluse
const AGENCE_VISIBLE: StatutWorkflow[] = [
  "EN_PREPARATION", "OCR_EN_COURS", "A_CONTROLER", "PRET_A_TRANSMETTRE", "TRANSMIS_BO",
];

const COURRIER_TYPES: TypeCourrier[] = ["DHL", "UPS", "FEDEX", "ARAMEX", "AMANA", "INTERNE"];
const EVT_TYPES: TypeEvenement[] = ["ENTREE_IRD", "PAIEMENT", "ACCEPTATION", "ACCEPTATION_AVEC_AVAL", "RETOUR_DOCUMENTS", "ENVOI_EFFETS"];

export default function AgenceHome() {
  const dossiers = useTomStore(s => s.dossiers);
  const courriers = useTomStore(s => s.courriers);
  const createCourrier = useTomStore(s => s.createCourrier);
  const createDossier = useTomStore(s => s.createDossier);

  const [open, setOpen] = useState(false);
  const [refTransporteur, setRefTransporteur] = useState("");
  const [typeCourrier, setTypeCourrier] = useState<TypeCourrier>("DHL");
  const [numeroLot, setNumeroLot] = useState("");
  const [entiteExpediteur, setEntiteExpediteur] = useState("");
  const [evt, setEvt] = useState<TypeEvenement>("ENTREE_IRD");

  const sessions = dossiers.filter(d => AGENCE_VISIBLE.includes(d.statut_workflow));

  function startSession() {
    const c = createCourrier({
      reference_transporteur: refTransporteur || undefined,
      type_courrier: typeCourrier,
      numero_lot: numeroLot || undefined,
      entite_expediteur: entiteExpediteur || undefined,
    });
    const d = createDossier(c.id, evt);
    // redirect to session detail
    window.location.href = `/agence/${d.id}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span><span className="text-ink-700 font-medium">Dépouillement agence</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="text-brand-500" size={20} /> Sessions de dépouillement
        </h1>
        <button className="btn-primary" onClick={() => setOpen(o => !o)}>
          <Plus size={16} /> Nouvelle session
        </button>
      </div>

      {open && (
        <section className="card p-5">
          <div className="section-title">Ouvrir une session de dépouillement</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="label">Référence transporteur</div>
              <input className="input" value={refTransporteur} onChange={e => setRefTransporteur(e.target.value)} placeholder="Auto si vide" />
            </div>
            <div>
              <div className="label">Type de courrier</div>
              <select className="input" value={typeCourrier} onChange={e => setTypeCourrier(e.target.value as TypeCourrier)}>
                {COURRIER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Numéro de lot</div>
              <input className="input" value={numeroLot} onChange={e => setNumeroLot(e.target.value)} placeholder="LOT-2026-XXX" />
            </div>
            <div className="md:col-span-2">
              <div className="label">Entité expéditeur</div>
              <input className="input" value={entiteExpediteur} onChange={e => setEntiteExpediteur(e.target.value)} placeholder="Banque étrangère, exportateur..." />
            </div>
            <div>
              <div className="label">Type d'événement</div>
              <select className="input" value={evt} onChange={e => setEvt(e.target.value as TypeEvenement)}>
                {EVT_TYPES.map(t => <option key={t} value={t}>{EVENT_LABEL[t]}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setOpen(false)}>Annuler</button>
            <button className="btn-primary" onClick={startSession}>Ouvrir la session</button>
          </div>
          <p className="text-xs text-ink-500 mt-3">
            La session reste ouverte tant qu'elle n'est pas transmise. Vous pourrez ajouter / retirer des documents et lancer l'OCR à tout moment.
          </p>
        </section>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
          <Inbox size={14} className="text-brand-500" />
          <div className="font-semibold text-sm">Sessions ouvertes</div>
          <div className="ml-auto text-xs text-ink-500">{sessions.length} session(s)</div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Référence</th><th>Événement</th><th>Courrier</th>
              <th>Documents</th><th>Statut</th><th>Mise à jour</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(d => {
              const c = courriers.find(x => x.id === d.courrierId);
              return (
                <tr key={d.id}>
                  <td>
                    <Link href={`/agence/${d.id}`} className="text-brand-600 font-medium hover:underline">
                      {d.reference_tom}
                    </Link>
                  </td>
                  <td>{EVENT_LABEL[d.type_evenement]}</td>
                  <td className="text-xs">{c?.type_courrier} • {c?.reference_transporteur ?? "—"}</td>
                  <td>{d.documents.length}</td>
                  <td><span className={badgeForWorkflow(d.statut_workflow)}>{WORKFLOW_LABEL[d.statut_workflow]}</span></td>
                  <td className="text-xs text-ink-500">{new Date(d.updated_at).toLocaleString("fr-FR")}</td>
                </tr>
              );
            })}
            {sessions.length === 0 && (
              <tr><td colSpan={6} className="text-center text-ink-500 py-8">Aucune session ouverte. Cliquez sur « Nouvelle session ».</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
