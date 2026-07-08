"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  ChevronLeft, ScanLine, Send, FileText, Plus, Trash2,
  CheckCircle2, AlertTriangle, Loader2, Save, Hourglass, RefreshCw,
  RotateCcw, Check, Search,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore, REFERENTIEL_CLIENTS } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, COMPLETUDE_LABEL, DOC_LABEL,
  badgeForCourrierWorkflow, badgeForOcrCourrier, OCR_COURRIER_LABEL, badgeForCompletude,
  TRANSPORTEUR_LABEL, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import type {
  TypeDocument, StatutOcrDoc, StatutCourrierWorkflow, StatutOcrCourrier,
} from "@/domain/types";

export default function CourrierDetail({ id }: { id: string }) {
  const router = useRouter();

  const courrier = useTomStore(s => s.courriersIrd.find(c => c.id === id));
  const addDocs   = useTomStore(s => s.addDocumentsCourrierIrd);
  const removeDoc = useTomStore(s => s.removeDocumentCourrierIrd);
  const lancerOcr = useTomStore(s => s.lancerOcrCourrierIrd);
  const updateCi  = useTomStore(s => s.updateCourrierIrd);
  const apply     = useTomStore(s => s.applyCourrierIrdAction);
  const acteur    = useTomStore(s => s.acteurCourant);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [ocrModalOpen, setOcrModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [commentaireRetour, setCommentaireRetour] = useState("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  if (!courrier) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Courrier introuvable. <Link href="/courriers" className="text-brand-600">Retour à la liste</Link>
      </div>
    );
  }

  /* ---- derived ---- */
  const ocrEnCours    = courrier.documents.some(d => d.statut_ocr === "EN_COURS");
  const hasOcrResult  = courrier.statut_ocr === "OCR_ANALYSE";
  const docsNonLances = courrier.documents.some(d => d.statut_ocr === "NON_LANCE");
  const isEditable    = courrier.statut_workflow === "EN_PREPARATION" && acteur === "AGENCE";
  const isLocked      = courrier.statut_workflow === "ENVOYE_CTN";
  const ocrFields     = new Set(courrier.ocr_fields ?? []);

  /** Update a field and remove it from ocr_fields if it was OCR-enriched */
  function updateField(field: string, patch: Partial<import("@/domain/types").CourrierIrd>) {
    const newOcrFields = (courrier!.ocr_fields ?? []).filter(f => f !== field);
    updateCi(courrier!.id, { ...patch, ocr_fields: newOcrFields });
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const docs = Array.from(files).map(f => {
      const lower = f.name.toLowerCase();
      const inferred: TypeDocument =
        lower.includes("facture") || lower.includes("invoice") ? "FACTURE" :
        lower.includes("bl") || lower.includes("lading")      ? "BL" :
        lower.includes("certif")                              ? "CERTIFICAT_ORIGINE" :
        lower.includes("traite")                              ? "TRAITE" :
        lower.includes("effet")                               ? "EFFET" :
        lower.includes("dhl")                                 ? "DHL" :
        lower.includes("lac") || lower.includes("lettre")     ? "LETTRE_ACCOMPAGNEMENT" :
        "AUTRE";
      return { type_document: inferred, filename: f.name };
    });
    addDocs(courrier!.id, docs);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleLancerOcr() {
    lancerOcr(courrier!.id);
    setOcrModalOpen(true);
  }

  function handleSelectClient(c: { id: string; nom: string; agence_rattachement: string }) {
    const newOcrFields = (courrier!.ocr_fields ?? []).filter(f => f !== "client");
    updateCi(courrier!.id, {
      client: c.nom,
      client_referentiel_id: c.id,
      client_referentiel_nom: c.nom,
      client_referentiel_agence: c.agence_rattachement,
      ocr_fields: newOcrFields,
    });
    setClientSearchOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/courriers" className="hover:text-brand-600">Centralisation des courriers IRD</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{courrier.reference_courrier}</span>
      </div>

      {/* ====== TIMELINE HORIZONTALE DE TRAITEMENT ====== */}
      <WorkflowTimeline statut={courrier.statut_workflow} ocrStatut={courrier.statut_ocr} ocrEnCours={ocrEnCours} />

      {/* ============== En-tête ============== */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/courriers" className="text-xs text-ink-500 hover:text-brand-600 inline-flex items-center gap-1">
              <ChevronLeft size={12} /> Centralisation
            </Link>
            <h1 className="text-xl font-semibold mt-1">{courrier.reference_courrier}</h1>
            <div className="text-sm text-ink-500">
              {TRANSPORTEUR_LABEL[courrier.type_transporteur]} · {courrier.reference_transporteur ?? "—"}
              {" · "}Reçu le {new Date(courrier.date_reception).toLocaleDateString("fr-FR")}
              {" · "}{courrier.agence_reception} · TEAM_IRD
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={badgeForCourrierWorkflow(courrier.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[courrier.statut_workflow]}</span>
            <OcrCourrierBadge statut={courrier.statut_ocr} enCours={ocrEnCours} />
            {hasOcrResult && (
              <span className={badgeForCompletude(courrier.statut_completude)}>{COMPLETUDE_LABEL[courrier.statut_completude]}</span>
            )}
          </div>
        </div>

        {/* Bandeau retourné pour correction */}
        {courrier.commentaire_retour_validation && courrier.statut_workflow === "EN_PREPARATION" && (
          <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-100 text-sm">
            <div className="font-semibold text-amber-900 inline-flex items-center gap-2">
              <RotateCcw size={14} /> Retourné pour correction par le responsable agence
            </div>
            <div className="text-amber-800 text-xs mt-1">
              Commentaire : <b>{courrier.commentaire_retour_validation}</b>
            </div>
          </div>
        )}

        {/* Bandeau verrouillé */}
        {isLocked && (
          <div className="mt-4 p-3 rounded-md bg-green-50 border border-green-100 text-sm text-green-900">
            <div className="font-semibold inline-flex items-center gap-2">
              <CheckCircle2 size={14} /> Courrier validé et envoyé au CTN devise
            </div>
            {courrier.responsable_validation && (
              <div className="text-xs text-green-800 mt-1">
                Validé par {courrier.responsable_validation}
                {courrier.date_validation_agence && ` le ${new Date(courrier.date_validation_agence).toLocaleString("fr-FR")}`}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== Bandeau OCR (asynchrone, non bloquant) ===== */}
      {ocrEnCours && (
        <div className="card p-4 flex items-center gap-3 bg-blue-50 border-blue-100 text-sm">
          <Hourglass className="animate-pulse text-blue-600" size={18} />
          <div className="flex-1">
            <div className="font-semibold text-blue-900">Analyse OCR en cours…</div>
            <div className="text-xs text-blue-800">
              Vous pouvez continuer la saisie manuellement. Les champs seront enrichis automatiquement à la fin du traitement —
              les valeurs que vous saisissez ne seront pas écrasées.
            </div>
          </div>
        </div>
      )}

      {/* ===== Documents scannés ===== */}
      <section className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold text-sm">Documents scannés</div>
          {isEditable && (
            <button
              className="btn-primary"
              onClick={handleLancerOcr}
              disabled={!docsNonLances || ocrEnCours || courrier.documents.length === 0}
              title={
                courrier.documents.length === 0 ? "Ajoutez d'abord au moins un document" :
                !docsNonLances ? "Tous les documents ont déjà été analysés" : ""
              }
            >
              {ocrEnCours ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
              {ocrEnCours ? "OCR en cours…" : (hasOcrResult ? "Relancer l'OCR" : "Lancer OCR")}
            </button>
          )}
        </div>

        {isEditable && (
          <div
            className="mt-4 border-2 border-dashed border-ink-200 rounded-md p-6 text-center hover:border-brand-400 hover:bg-brand-50/40 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,image/*"
              onChange={e => handleFiles(e.target.files)}
            />
            <Plus className="mx-auto text-ink-400 mb-2" size={22} />
            <div className="text-sm font-medium text-ink-700">Glissez-déposez vos scans ici</div>
            <div className="text-xs text-ink-500 mt-1">
              PDF ou images, multi-pages, sans catégorisation obligatoire
            </div>
            <div className="text-[11px] text-brand-600 mt-2 font-medium">
              ou cliquer pour sélectionner des fichiers
            </div>
          </div>
        )}

        <ul className="mt-4 divide-y divide-ink-100 border border-ink-100 rounded-md">
          {courrier.documents.map(d => (
            <li key={d.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-3 text-sm min-w-0">
                <FileText size={16} className="text-brand-500 shrink-0" />
                <span className="font-medium truncate">{d.filename}</span>
                <span className="badge-gray">{DOC_LABEL[d.type_document]}</span>
                <DocOcrBadge s={d.statut_ocr} />
              </div>
              {isEditable && (
                <button className="btn-ghost text-ink-500" onClick={() => removeDoc(courrier.id, d.id)} title="Supprimer">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
          {courrier.documents.length === 0 && (
            <li className="px-3 py-6 text-center text-ink-500 text-xs">Aucun document scanné</li>
          )}
        </ul>
      </section>

      {/* ===== Informations courrier IRD ===== */}
      <section className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold text-sm">Informations courrier IRD</div>
            <div className="text-xs text-ink-500 mt-0.5">
              Saisie manuelle ou enrichissement OCR — vous gardez toujours la main finale.
              {ocrFields.size > 0 && <> · <span className="text-green-600 font-medium">Les champs avec un contour vert proviennent de l'OCR.</span></>}
            </div>
          </div>
          {hasOcrResult && (
            <div className="text-xs text-ink-500">
              Documents analysés : <b>{courrier.documents.filter(d => d.statut_ocr === "TERMINE").length}</b> / {courrier.documents.length}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          <OcrField label="Produit" isOcr={ocrFields.has("produit")}>
            <select
              className={clsx("input", !isEditable && "bg-ink-50", ocrFields.has("produit") && "border-green-400 bg-green-50/30")}
              value={courrier.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"}
              onChange={e => updateField("produit", { produit: e.target.value as any })}
              disabled={!isEditable}
            >
              <option value="REMISE_DOCUMENTAIRE_IMPORT">{PRODUIT_IRD_LABEL.REMISE_DOCUMENTAIRE_IMPORT}</option>
            </select>
          </OcrField>

          {/* Client field with loupe for référentiel search */}
          <OcrField label="Client" isOcr={ocrFields.has("client")}>
            <div className="flex gap-1">
              <input
                className={clsx("input flex-1", !isEditable && "bg-ink-50", ocrFields.has("client") && "border-green-400 bg-green-50/30")}
                value={courrier.client ?? ""}
                onChange={e => updateField("client", { client: e.target.value || undefined, client_referentiel_id: undefined, client_referentiel_nom: undefined, client_referentiel_agence: undefined })}
                disabled={!isEditable}
                placeholder="Saisie manuelle ou OCR"
              />
              {isEditable && (
                <button
                  className="btn-outline h-9 w-9 shrink-0 !p-0 grid place-items-center"
                  onClick={() => setClientSearchOpen(true)}
                  title="Rechercher dans le référentiel client"
                >
                  <Search size={14} />
                </button>
              )}
            </div>
            {courrier.client_referentiel_id && (
              <div className="text-[10px] text-green-700 mt-1 flex items-center gap-1">
                <CheckCircle2 size={10} /> Client validé référentiel · {courrier.client_referentiel_agence}
              </div>
            )}
          </OcrField>

          <OcrEditField label="Montant" type="number" value={courrier.montant?.toString() ?? ""}
            onChange={v => updateField("montant", { montant: v === "" ? undefined : parseFloat(v) })} disabled={!isEditable}
            placeholder="0.00" isOcr={ocrFields.has("montant")} />
          <OcrEditField label="Devise" value={courrier.devise ?? ""}
            onChange={v => updateField("devise", { devise: v || undefined })} disabled={!isEditable}
            placeholder="EUR / USD / MAD" isOcr={ocrFields.has("devise")} />
          <OcrEditField label="Référence interne" value={courrier.reference_interne ?? ""}
            onChange={v => updateField("reference_interne", { reference_interne: v || undefined })} disabled={!isEditable}
            isOcr={ocrFields.has("reference_interne")} />
          <OcrEditField label="Référence externe" value={courrier.reference_externe ?? ""}
            onChange={v => updateField("reference_externe", { reference_externe: v || undefined })} disabled={!isEditable}
            isOcr={ocrFields.has("reference_externe")} />
        </div>
      </section>

      {/* ===== Complétude documentaire ===== */}
      <ControleDocSection courrier={courrier} updateCi={updateCi}
        editable={isEditable} ocrEnCours={ocrEnCours} docsNonLances={docsNonLances} />

      {/* ===== ACTIONS ===== */}
      <section className="card p-5">
        <div className="font-semibold text-sm mb-3">Actions</div>
        <div className="flex flex-wrap items-center gap-2">
          {courrier.statut_workflow === "EN_PREPARATION" && acteur === "AGENCE" && (
            <>
              <button className="btn-outline">
                <Save size={14} /> Enregistrer
              </button>
              <button className="btn-primary" onClick={() => apply(courrier.id, "VALIDER_CREATION")}>
                <CheckCircle2 size={14} /> Valider création
              </button>
              <span className="text-xs text-ink-500 ml-2">Mode hybride — saisie manuelle et / ou OCR, puis validation.</span>
            </>
          )}
          {courrier.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" && acteur === "RESPONSABLE_AGENCE" && (
            <>
              <button className="btn-outline" onClick={() => setReturnModalOpen(true)}>
                <RotateCcw size={14} /> Retourner pour correction
              </button>
              <button className="btn-primary" onClick={() => apply(courrier.id, "VALIDER_ET_ENVOYER")}>
                <Send size={14} /> Valider et envoyer
              </button>
            </>
          )}
          {courrier.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" && acteur === "AGENCE" && (
            <span className="text-xs text-ink-500">En attente de validation par le responsable agence.</span>
          )}
          {courrier.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" && acteur !== "RESPONSABLE_AGENCE" && acteur !== "AGENCE" && (
            <span className="text-xs text-ink-500">Basculez sur le rôle <b>Responsable agence</b> pour valider.</span>
          )}
          {isLocked && (
            <span className="text-xs text-green-700">Courrier envoyé au CTN devise — verrouillé.</span>
          )}
        </div>
      </section>

      {/* ============== Modal popup OCR lancé ============== */}
      {ocrModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setOcrModalOpen(false)}>
          <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-3">
              <div className="h-9 w-9 rounded-md bg-brand-50 text-brand-600 grid place-items-center shrink-0">
                <ScanLine size={18} />
              </div>
              <div>
                <div className="font-semibold text-base">OCR lancé</div>
                <div className="text-xs text-ink-500 mt-0.5">Les documents ont été transmis au moteur OCR.</div>
              </div>
            </div>
            <div className="text-sm text-ink-700 space-y-2 mt-4">
              <p>L'analyse documentaire est en cours de traitement.</p>
              <p>
                Vous pouvez poursuivre la préparation du courrier ou revenir ultérieurement
                consulter les résultats OCR.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-outline" onClick={() => setOcrModalOpen(false)}>Rester sur écran</button>
              <button className="btn-primary" onClick={() => { setOcrModalOpen(false); router.push("/courriers"); }}>
                Retour liste courriers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== Modal retour pour correction ============== */}
      {returnModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setReturnModalOpen(false)}>
          <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="font-semibold text-base mb-2">Retourner pour correction</div>
            <p className="text-xs text-ink-500 mb-4">Le courrier sera renvoyé à l'agent pour complétion.</p>
            <Field label="Commentaire">
              <textarea
                className="input min-h-[80px]"
                value={commentaireRetour}
                onChange={e => setCommentaireRetour(e.target.value)}
                placeholder="Précisions à destination de l'agent…"
              />
            </Field>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-outline" onClick={() => setReturnModalOpen(false)}>Annuler</button>
              <button
                className="btn-primary"
                onClick={() => {
                  apply(courrier.id, "RETOURNER_CORRECTION", { commentaire: commentaireRetour });
                  setReturnModalOpen(false);
                  setCommentaireRetour("");
                }}
              >
                <RotateCcw size={14} /> Retourner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== Modal recherche client référentiel ============== */}
      {clientSearchOpen && (
        <ClientSearchPopup
          initialQuery={courrier.client ?? ""}
          onSelect={handleSelectClient}
          onClose={() => setClientSearchOpen(false)}
        />
      )}
    </div>
  );
}

/* ====== CLIENT REFERENTIEL SEARCH POPUP ====== */

function ClientSearchPopup({
  initialQuery, onSelect, onClose,
}: {
  initialQuery: string;
  onSelect: (c: { id: string; nom: string; agence_rattachement: string }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REFERENTIEL_CLIENTS.slice(0, 8);
    return REFERENTIEL_CLIENTS.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.identifiant.toLowerCase().includes(q) ||
      c.agence_rattachement.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="font-semibold text-base mb-1">Recherche client référentiel</div>
        <p className="text-xs text-ink-500 mb-4">Sélectionnez un client du référentiel bancaire pour le rattacher au courrier.</p>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input pl-8 h-9 w-full"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom, identifiant ou agence…"
            autoFocus
          />
        </div>
        <div className="border border-ink-100 rounded-md max-h-[300px] overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nom client</th>
                <th>Identifiant</th>
                <th>Agence</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {results.map(c => (
                <tr key={c.id} className="hover:bg-brand-50/50 cursor-pointer" onClick={() => onSelect(c)}>
                  <td className="font-medium text-sm">{c.nom}</td>
                  <td className="text-xs text-ink-500">{c.identifiant}</td>
                  <td className="text-xs">{c.agence_rattachement}</td>
                  <td>
                    <button className="btn-outline text-xs h-7 px-2" onClick={() => onSelect(c)}>
                      Sélectionner
                    </button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={4} className="text-center text-ink-500 text-xs py-6">Aucun client trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-outline" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ====== TIMELINE HORIZONTALE DE TRAITEMENT ====== */

const TIMELINE_STEPS: { key: StatutCourrierWorkflow; label: string; desc: string }[] = [
  { key: "EN_PREPARATION", label: "Création du courrier", desc: "Rattachement documentaire, OCR, saisie métier" },
  { key: "EN_ATTENTE_VALIDATION_AGENCE", label: "Validation agence", desc: "Contrôle et validation responsable agence" },
  { key: "ENVOYE_CTN", label: "Envoyé CTN devise", desc: "Transmission vers CTN devise" },
];

function WorkflowTimeline({ statut, ocrStatut, ocrEnCours }: { statut: StatutCourrierWorkflow; ocrStatut: StatutOcrCourrier; ocrEnCours: boolean }) {
  const currentIdx = TIMELINE_STEPS.findIndex(s => s.key === statut);

  return (
    <div className="card p-5">
      <div className="flex items-center">
        {TIMELINE_STEPS.map((step, i) => {
          const allDone = statut === "ENVOYE_CTN";
          const completed = allDone || i < currentIdx;
          const current = !allDone && i === currentIdx;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center text-center flex-1">
                <div className={clsx(
                  "h-9 w-9 rounded-full grid place-items-center text-sm font-semibold border-2 transition",
                  completed ? "bg-brand-500 border-brand-500 text-white" :
                  current ? "bg-white border-brand-500 text-brand-600" :
                  "bg-white border-ink-200 text-ink-400"
                )}>
                  {completed ? <Check size={16} /> : i + 1}
                </div>
                <div className={clsx(
                  "text-xs font-semibold mt-2",
                  completed || current ? "text-ink-800" : "text-ink-400"
                )}>
                  {step.label}
                </div>
                <div className="text-[10px] text-ink-500 mt-0.5 max-w-[180px]">
                  {step.desc}
                </div>
                {/* OCR indicator on step 1 */}
                {i === 0 && (
                  <div className={clsx(
                    "mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium",
                    ocrEnCours ? "bg-blue-100 text-blue-700" :
                    ocrStatut === "OCR_ANALYSE" ? "bg-green-100 text-green-700" :
                    "bg-gray-100 text-gray-500"
                  )}>
                    {ocrEnCours ? "OCR en cours" : OCR_COURRIER_LABEL[ocrStatut]}
                  </div>
                )}
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={clsx(
                  "h-0.5 flex-1 mx-2 rounded",
                  allDone || i < currentIdx ? "bg-brand-500" : "bg-ink-200"
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function OcrCourrierBadge({ statut, enCours }: { statut: StatutOcrCourrier; enCours: boolean }) {
  if (enCours) {
    return (
      <span className="badge-blue inline-flex items-center gap-1">
        <Loader2 size={10} className="animate-spin" /> OCR en cours
      </span>
    );
  }
  return (
    <span className={badgeForOcrCourrier(statut)}>
      {OCR_COURRIER_LABEL[statut]}
    </span>
  );
}

function DocOcrBadge({ s }: { s: StatutOcrDoc }) {
  if (s === "NON_LANCE")  return <span className="badge-gray">OCR à lancer</span>;
  if (s === "EN_COURS")   return <span className="badge-blue inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>;
  if (s === "TERMINE")    return <span className="badge-green">OCR ok</span>;
  return <span className="badge-red">OCR échec</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="label">{label}</div>{children}</div>;
}

function OcrField({ label, isOcr, children }: { label: string; isOcr: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="label flex items-center gap-1.5">
        {label}
        {isOcr && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-semibold">OCR</span>}
      </div>
      {children}
    </div>
  );
}

function OcrEditField({
  label, value, onChange, type = "text", disabled, placeholder, isOcr,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string; isOcr: boolean }) {
  return (
    <OcrField label={label} isOcr={isOcr}>
      <input
        className={clsx("input", disabled && "bg-ink-50", isOcr && "border-green-400 bg-green-50/30")}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </OcrField>
  );
}

/* ====== Complétude documentaire ====== */

const COMPL_TYPES: TypeDocument[] = ["FACTURE", "BL", "CERTIFICAT_ORIGINE", "EFFET", "TRAITE", "AUTRE"];

function ControleDocSection({
  courrier, updateCi, editable, ocrEnCours, docsNonLances,
}: {
  courrier: import("@/domain/types").CourrierIrd;
  updateCi: (id: string, patch: Partial<import("@/domain/types").CourrierIrd>) => void;
  editable: boolean;
  ocrEnCours: boolean;
  docsNonLances: boolean;
}) {
  const lignes = courrier.controle_doc;
  const totalAtt  = lignes.reduce((s, l) => s + l.nombre_attendu, 0);
  const totalRecu = lignes.reduce((s, l) => s + l.nombre_detecte, 0);
  const score = totalAtt === 0 ? 0 : Math.round(
    (lignes.reduce((s, l) => s + Math.min(l.nombre_detecte, l.nombre_attendu), 0) / totalAtt) * 100
  );
  const hasEcart = lignes.some(l => l.nombre_detecte !== l.nombre_attendu);

  function patchLigne(idx: number, patch: Partial<import("@/domain/types").LigneControleDoc>) {
    const next = lignes.map((l, i) => {
      if (i !== idx) return l;
      const merged = { ...l, ...patch };
      const ecart = merged.nombre_detecte - merged.nombre_attendu;
      merged.statut_detection =
        ecart === 0 ? "DETECTE" : ecart < 0 ? "MANQUANT" : "EN_TROP";
      return merged;
    });
    updateCi(courrier.id, { controle_doc: next });
  }
  function addLigne() {
    updateCi(courrier.id, {
      controle_doc: [
        ...lignes,
        { type_document: "FACTURE", nombre_attendu: 1, nombre_detecte: 0, statut_detection: "MANQUANT" },
      ],
    });
  }
  function removeLigne(idx: number) {
    updateCi(courrier.id, { controle_doc: lignes.filter((_, i) => i !== idx) });
  }

  return (
    <section className="card p-5">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <div className="font-semibold text-sm">Complétude documentaire</div>
          <div className="text-xs text-ink-500 mt-0.5">
            Rapprochement attendu / reçu — modifiable manuellement ou via OCR.
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <div><span className="text-ink-500">Attendus :</span> <b>{totalAtt}</b></div>
          <div><span className="text-ink-500">Reçus :</span> <b>{totalRecu}</b></div>
          <div><span className="text-ink-500">Score :</span> <b>{score}%</b></div>
          {totalAtt === 0
            ? <span className="badge-gray">Non contrôlé</span>
            : !hasEcart
              ? <span className="badge-green"><CheckCircle2 size={12} className="mr-1" />Complet</span>
              : <span className="badge-red"><AlertTriangle size={12} className="mr-1" />Avec écart</span>}
        </div>
      </div>

      <table className="tbl mt-4">
        <thead>
          <tr>
            <th className="w-1/3">Type document</th>
            <th>Nombre attendu</th>
            <th>Nombre reçu</th>
            <th>Écart</th>
            {editable && <th className="w-10"></th>}
          </tr>
        </thead>
        <tbody>
          {lignes.map((l, idx) => {
            const ecart = l.nombre_detecte - l.nombre_attendu;
            return (
              <tr key={idx}>
                <td>
                  {editable ? (
                    <select
                      className="input h-8"
                      value={l.type_document}
                      onChange={e => patchLigne(idx, { type_document: e.target.value as TypeDocument })}
                    >
                      {COMPL_TYPES.map(t => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
                    </select>
                  ) : DOC_LABEL[l.type_document]}
                </td>
                <td>
                  {editable ? (
                    <input
                      type="number" min={0}
                      className="input h-8 w-24"
                      value={l.nombre_attendu}
                      onChange={e => patchLigne(idx, { nombre_attendu: parseInt(e.target.value) || 0 })}
                    />
                  ) : l.nombre_attendu}
                </td>
                <td>
                  {editable ? (
                    <input
                      type="number" min={0}
                      className="input h-8 w-24"
                      value={l.nombre_detecte}
                      onChange={e => patchLigne(idx, { nombre_detecte: parseInt(e.target.value) || 0 })}
                    />
                  ) : l.nombre_detecte}
                </td>
                <td>
                  {ecart === 0
                    ? <span className="badge-green">OK</span>
                    : ecart < 0
                      ? <span className="badge-red">{ecart} manquant{ecart < -1 ? "s" : ""}</span>
                      : <span className="badge-amber">+{ecart} en trop</span>}
                </td>
                {editable && (
                  <td>
                    <button className="btn-ghost text-ink-500" onClick={() => removeLigne(idx)} title="Supprimer ligne">
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
          {lignes.length === 0 && (
            <tr>
              <td colSpan={editable ? 5 : 4} className="text-center text-ink-500 text-xs py-4">
                Aucune ligne — ajoutez les types de documents attendus.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {editable && (
        <div className="flex items-center gap-3 mt-3">
          <button className="btn-outline" onClick={addLigne}>
            <Plus size={14} /> Ajouter ligne
          </button>
          {docsNonLances && !ocrEnCours && (
            <span className="text-xs text-ink-500 inline-flex items-center gap-2">
              <RefreshCw size={12} /> Documents non analysés — l'OCR peut être lancé pour enrichir automatiquement.
            </span>
          )}
        </div>
      )}
    </section>
  );
}
