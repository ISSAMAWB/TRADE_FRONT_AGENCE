"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft, ScanLine, Send, FileText, Plus, Trash2,
  CheckCircle2, AlertTriangle, Loader2, Save, Hourglass, RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  WORKFLOW_LABEL, OCR_LABEL, COMPLETUDE_LABEL, DOC_LABEL,
  badgeForWorkflow, badgeForOcr, badgeForCompletude,
} from "@/domain/labels";
import type { TypeDocument, StatutOcrDoc } from "@/domain/types";

const DOC_TYPES: TypeDocument[] = [
  "LETTRE_ACCOMPAGNEMENT", "FACTURE", "BL", "CERTIFICAT_ORIGINE", "TRAITE", "AUTRE",
];

export default function SessionDepouillement({ id }: { id: string }) {
  const router = useRouter();

  const dossier = useTomStore(s => s.dossiers.find(d => d.id === id));
  const courrier = useTomStore(s => s.courriers.find(c => c.id === dossier?.courrierId));
  const addDocuments = useTomStore(s => s.addDocuments);
  const removeDocument = useTomStore(s => s.removeDocument);
  const lancerOcr = useTomStore(s => s.lancerOcr);
  const updateDossier = useTomStore(s => s.updateDossier);
  const apply = useTomStore(s => s.applyTransition);

  const [docType, setDocType] = useState<TypeDocument>("FACTURE");
  const [docName, setDocName] = useState("");
  const [ocrModalOpen, setOcrModalOpen] = useState(false);

  if (!dossier) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Session introuvable. <Link href="/agence" className="text-brand-600">Retour aux sessions</Link>
      </div>
    );
  }

  /* ------ derived state ------ */
  const ocrEnCours    = dossier.statut_ocr === "EN_COURS";
  const hasOcrResult  = !!dossier.ocr_dossier; // a déjà eu un retour OCR au moins une fois
  const isLocked      = dossier.statut_workflow === "TRANSMIS_BO";
  const docsNonLances = dossier.documents.some(d => d.statut_ocr === "NON_LANCE");
  const peutTransmettre = dossier.statut_workflow === "PRET_A_TRANSMETTRE";
  const peutMarquerPret = dossier.statut_workflow === "A_CONTROLER";

  function addDoc() {
    if (!docName.trim()) return;
    addDocuments(dossier!.id, [{ type_document: docType, filename: docName.trim() }]);
    setDocName("");
  }

  function handleLancerOcr() {
    lancerOcr(dossier!.id);
    setOcrModalOpen(true); // popup confirmation traitement asynchrone
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/agence" className="hover:text-brand-600">Dépouillement agence</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{dossier.reference_tom}</span>
      </div>

      {/* ============== En-tête ============== */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/agence" className="text-xs text-ink-500 hover:text-brand-600 inline-flex items-center gap-1">
              <ChevronLeft size={12} /> Sessions
            </Link>
            <h1 className="text-xl font-semibold mt-1">Session {dossier.reference_tom}</h1>
            <div className="text-sm text-ink-500">
              Courrier {courrier?.type_courrier} • {courrier?.reference_transporteur ?? "—"}
              {courrier?.entite_expediteur && <> • {courrier.entite_expediteur}</>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={badgeForWorkflow(dossier.statut_workflow)}>{WORKFLOW_LABEL[dossier.statut_workflow]}</span>
            <span className={badgeForOcr(dossier.statut_ocr)}>OCR · {OCR_LABEL[dossier.statut_ocr]}</span>
            {hasOcrResult && (
              <span className={badgeForCompletude(dossier.statut_completude)}>{COMPLETUDE_LABEL[dossier.statut_completude]}</span>
            )}
            <span className="text-[11px] text-ink-500 inline-flex items-center gap-1">
              <Save size={11} /> Sauvegarde implicite
            </span>
          </div>
        </div>

        {isLocked && (
          <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-100 text-sm text-green-900">
            Session transmise au Back Office — verrouillée.
          </div>
        )}
      </div>

      {/* ============================================
          ETAPE 1 — Scan documents (toujours visible)
      ============================================ */}
      <section className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-brand-600 font-semibold">Étape 1</div>
            <div className="font-semibold text-sm">Scan des documents</div>
          </div>
          <button
            className="btn-primary"
            onClick={handleLancerOcr}
            disabled={isLocked || !docsNonLances || ocrEnCours || dossier.documents.length === 0}
            title={
              dossier.documents.length === 0 ? "Ajoutez d'abord au moins un document" :
              !docsNonLances ? "Tous les documents ont déjà été analysés" : ""
            }
          >
            {ocrEnCours ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
            {ocrEnCours
              ? "OCR en cours…"
              : (hasOcrResult ? "Relancer l'OCR" : "Lancer OCR")}
          </button>
        </div>

        {!isLocked && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <div className="label">Type de document</div>
              <select className="input" value={docType} onChange={e => setDocType(e.target.value as TypeDocument)}>
                {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
              </select>
            </div>
            <div>
              <div className="label">Nom du fichier scanné</div>
              <input className="input" value={docName} onChange={e => setDocName(e.target.value)}
                     placeholder="ex: INV_005.pdf" onKeyDown={e => e.key === "Enter" && addDoc()} />
            </div>
            <button className="btn-outline h-10" onClick={addDoc} disabled={!docName.trim()}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
        )}

        <ul className="mt-4 divide-y divide-ink-100 border border-ink-100 rounded-md">
          {dossier.documents.map(d => (
            <li key={d.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3 text-sm min-w-0">
                <FileText size={16} className="text-brand-500 shrink-0" />
                <span className="font-medium truncate">{d.filename}</span>
                <span className="badge-gray">{DOC_LABEL[d.type_document]}</span>
                <DocOcrBadge s={d.statut_ocr} />
              </div>
              {!isLocked && (
                <button className="btn-ghost text-ink-500" onClick={() => removeDocument(dossier.id, d.id)} title="Supprimer">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
          {dossier.documents.length === 0 && (
            <li className="px-3 py-6 text-center text-ink-500 text-xs">Aucun document scanné</li>
          )}
        </ul>

        <p className="text-[11px] text-ink-500 mt-3">
          Sauvegarde implicite — vous pouvez ajouter / retirer des documents et lancer l'OCR à tout moment.
        </p>
      </section>

      {/* =====================================================
          ZONE 2 — Etat conditionnel : attente vs résultat OCR
      ===================================================== */}

      {/* (a) En attente : avant tout OCR → invite */}
      {!ocrEnCours && !hasOcrResult && (
        <section className="card p-8 text-center">
          <ScanLine className="mx-auto text-ink-300 mb-3" size={36} />
          <div className="font-semibold text-sm text-ink-700">En attente de lancement OCR</div>
          <p className="text-xs text-ink-500 mt-2 max-w-md mx-auto">
            Ajoutez les documents scannés puis cliquez sur <b>Lancer OCR</b> pour démarrer l'analyse documentaire.
            Les résultats d'extraction et le contrôle documentaire s'afficheront ici une fois le traitement terminé.
          </p>
        </section>
      )}

      {/* (b) OCR en cours et aucun résultat précédent → bandeau d'attente only (PAS de bloc vide) */}
      {ocrEnCours && !hasOcrResult && (
        <section className="card p-10 text-center">
          <div className="inline-flex items-center gap-3 text-brand-700 font-semibold">
            <Hourglass className="animate-pulse" size={20} />
            Analyse OCR en cours…
          </div>
          <p className="text-sm text-ink-500 mt-3 max-w-xl mx-auto">
            Les résultats seront disponibles automatiquement après traitement.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
              Traitement asynchrone
            </span>
            <span>•</span>
            <span>Rafraîchissement automatique</span>
          </div>
          <button
            className="btn-outline mt-6"
            onClick={() => router.push("/agence")}
          >
            Retour à mes sessions
          </button>
        </section>
      )}

      {/* (c) OCR terminé (ou relancé avec résultats antérieurs) → afficher les blocs résultat */}
      {hasOcrResult && (
        <>
          {/* indicateur de relance OCR */}
          {ocrEnCours && (
            <div className="card p-4 flex items-center gap-3 bg-blue-50 border-blue-100 text-sm">
              <Loader2 className="animate-spin text-blue-600" size={16} />
              <div>
                <div className="font-semibold text-blue-900">Nouvelle analyse OCR en cours</div>
                <div className="text-xs text-blue-800">
                  Les champs ci-dessous reflètent le dernier résultat ; ils seront enrichis automatiquement.
                </div>
              </div>
            </div>
          )}

          {/* BLOC 2 — Résultat OCR */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-brand-600 font-semibold">Étape 2</div>
                <div className="font-semibold text-sm">Résultat OCR — extraction</div>
              </div>
              <div className="text-xs text-ink-500">
                Documents : <b>{dossier.documents.filter(d => d.statut_ocr === "TERMINE").length}</b> / {dossier.documents.length} analysés
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <Field label="Produit détecté">
                <input className="input bg-ink-50" value={dossier.produit} readOnly />
              </Field>
              <EditField label="Client" value={dossier.client ?? ""}
                onChange={v => updateDossier(dossier.id, { client: v })} disabled={isLocked} />
              <EditField label="Montant" type="number" value={dossier.montant?.toString() ?? ""}
                onChange={v => updateDossier(dossier.id, { montant: parseFloat(v) || undefined })} disabled={isLocked} />
              <EditField label="Devise" value={dossier.devise ?? ""}
                onChange={v => updateDossier(dossier.id, { devise: v })} disabled={isLocked} />
              <EditField label="Référence dossier (interne)" value={dossier.reference_interne ?? ""}
                onChange={v => updateDossier(dossier.id, { reference_interne: v })} disabled={isLocked} />
              <EditField label="Référence externe" value={dossier.reference_externe ?? ""}
                onChange={v => updateDossier(dossier.id, { reference_externe: v })} disabled={isLocked} />
            </div>
          </section>

          {/* BLOC 3 — Contrôle documentaire */}
          <section className="card p-5">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-brand-600 font-semibold">Étape 3</div>
              <div className="font-semibold text-sm">Contrôle documentaire (non bloquant)</div>
            </div>
            <div className="flex items-center gap-3 mt-3 mb-3 text-sm">
              <div><span className="text-ink-500">Documents attendus :</span> <b>{dossier.controle_doc.reduce((s, l) => s + l.nombre_attendu, 0)}</b></div>
              <div><span className="text-ink-500">Détectés :</span> <b>{dossier.controle_doc.reduce((s, l) => s + l.nombre_detecte, 0)}</b></div>
              <div><span className="text-ink-500">Score :</span> <b>{dossier.score_completude ?? 0}%</b></div>
              {dossier.statut_completude === "COMPLET"
                ? <span className="badge-green"><CheckCircle2 size={12} className="mr-1" />Complet</span>
                : <span className="badge-red"><AlertTriangle size={12} className="mr-1" />Avec écart</span>}
            </div>
            <table className="tbl">
              <thead><tr><th>Type</th><th>Attendu</th><th>Détecté</th><th>Écart</th></tr></thead>
              <tbody>
                {dossier.controle_doc.map(l => {
                  const ecart = l.nombre_detecte - l.nombre_attendu;
                  return (
                    <tr key={l.type_document}>
                      <td>{DOC_LABEL[l.type_document]}</td>
                      <td>{l.nombre_attendu}</td>
                      <td>{l.nombre_detecte}</td>
                      <td>
                        {ecart === 0
                          ? <span className="badge-green">OK</span>
                          : ecart < 0
                            ? <span className="badge-red">{ecart} manquant{ecart < -1 ? "s" : ""}</span>
                            : <span className="badge-amber">+{ecart} en trop</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {docsNonLances && !ocrEnCours && (
              <div className="mt-3 text-xs text-ink-500 inline-flex items-center gap-2">
                <RefreshCw size={12} /> Nouveaux documents en attente — relancez l'OCR pour les analyser.
              </div>
            )}
          </section>

          {/* BLOC 4 — Validation transmission */}
          <section className="card p-5">
            <div className="text-[10px] uppercase tracking-wider text-brand-600 font-semibold">Étape 4</div>
            <div className="font-semibold text-sm">Validation transmission</div>
            <div className="flex items-center justify-between flex-wrap gap-3 mt-3">
              <p className="text-sm text-ink-500 max-w-2xl">
                La transmission verrouille la session, crée le dossier dans la file Back Office et met à jour le statut
                à <b>TRANSMIS_BO</b>.
              </p>
              <div className="flex items-center gap-2">
                {dossier.statut_workflow === "PRET_A_TRANSMETTRE" && (
                  <button className="btn-outline" onClick={() => apply(dossier.id, "Revenir au contrôle")}>
                    Revenir au contrôle
                  </button>
                )}
                {peutMarquerPret && (
                  <button className="btn-outline" onClick={() => apply(dossier.id, "Marquer prêt à transmettre")}>
                    Marquer prêt à transmettre
                  </button>
                )}
                <button
                  className={clsx("btn-primary", !peutTransmettre && "opacity-50 cursor-not-allowed")}
                  onClick={() => peutTransmettre && apply(dossier.id, "Transmettre au Back Office")}
                  disabled={!peutTransmettre}
                  title={!peutTransmettre ? "La session doit être marquée prête à transmettre" : ""}
                >
                  <Send size={14} /> Transmettre au Back Office
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* ============================================
          Popup confirmation lancement OCR asynchrone
      ============================================ */}
      {ocrModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setOcrModalOpen(false)}>
          <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-9 w-9 rounded-md bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                <ScanLine size={18} />
              </div>
              <div>
                <div className="font-semibold text-base">Traitement OCR lancé</div>
                <div className="text-xs text-ink-500 mt-0.5">Les documents ont bien été transmis au moteur OCR.</div>
              </div>
            </div>
            <div className="text-sm text-ink-700 space-y-2 mt-4">
              <p>L'analyse documentaire est en cours de traitement. Les informations détectées seront disponibles après traitement.</p>
              <p className="text-ink-500">Vous pouvez :</p>
              <ul className="list-disc list-inside text-ink-500 text-sm space-y-0.5">
                <li>quitter cette session,</li>
                <li>poursuivre plus tard,</li>
                <li>revenir consulter et compléter les résultats OCR.</li>
              </ul>
              <p className="text-[11px] text-ink-400 italic">Le traitement peut prendre quelques minutes.</p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-outline" onClick={() => setOcrModalOpen(false)}>Rester sur cette page</button>
              <button className="btn-primary" onClick={() => { setOcrModalOpen(false); router.push("/agence"); }}>
                Retour à mes sessions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function DocOcrBadge({ s }: { s: StatutOcrDoc }) {
  if (s === "NON_LANCE")  return <span className="badge-gray">OCR à lancer</span>;
  if (s === "EN_COURS")   return <span className="badge-blue inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>;
  if (s === "TERMINE")    return <span className="badge-green">OCR ok</span>;
  return <span className="badge-red">OCR échec</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="label">{label}</div>{children}</div>;
}
function EditField({
  label, value, onChange, type = "text", disabled,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <div className="label">{label}</div>
      <input
        className={clsx("input", disabled && "bg-ink-50")}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}
