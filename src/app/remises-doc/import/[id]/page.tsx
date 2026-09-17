"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  ChevronLeft, Send, FileText, Plus, Trash2,
  CheckCircle2, AlertTriangle, Save, Check, Search,
  Clock, History,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, DOC_LABEL,
  badgeForCourrierWorkflow,
  TRANSPORTEUR_LABEL, PRODUIT_IRD_LABEL,
  MOTIF_RETOUR_CENTRALISATION_LABEL, TYPE_RETOUR_LABEL,
} from "@/domain/labels";
import ClientReferentielSearchModal from "@/components/ui/ClientReferentielSearchModal";
import Shell from "@/components/Shell";
import type {
  TypeDocument, CourrierIrd,
} from "@/domain/types";

export default function CentralisationRDIDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const courrier = useTomStore(s => s.courriersIrd.find(c => c.id === id));
  const addDocs   = useTomStore(s => s.addDocumentsCourrierIrd);
  const removeDoc = useTomStore(s => s.removeDocumentCourrierIrd);
  const updateCi  = useTomStore(s => s.updateCourrierIrd);
  const apply     = useTomStore(s => s.applyCourrierIrdAction);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  /* ---- derived ---- */
  const isBrouillon    = courrier?.statut_workflow === "EN_PREPARATION";
  const isRetourne     = courrier?.statut_workflow === "RETOUR_AGENCE" || courrier?.statut_workflow === "RETOUR_CTN";
  const isCorrection   = courrier?.statut_workflow === "EN_CORRECTION";
  const isAttenteValidation = courrier?.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE";
  const isTransmisCTN  = courrier?.statut_workflow === "EN_ATTENTE_VALIDATION_CTN";
  const isValidee      = courrier?.statut_workflow === "VALIDEE_CTN" || courrier?.statut_workflow === "ENVOYE_CTN";
  // Saisie Agence : brouillon, retourné ou en correction → édition directe
  const isEditable     = isBrouillon || isRetourne || isCorrection;

  const dernierRetour = courrier?.dernier_retour ?? courrier?.retours[courrier.retours.length - 1];
  const champsACorriger = courrier?.champs_a_corriger ?? dernierRetour?.champs_a_corriger ?? [];

  /* ---- stepper steps from history + pending ---- */
  const stepperSteps = useMemo(() => courrier ? buildStepperSteps(courrier) : [], [courrier]);

  if (!courrier) {
    return (
      <Shell>
        <div className="card p-10 text-center text-ink-500">
          Centralisation introuvable. <Link href="/remises-doc/import" className="text-brand-600">Retour à la liste</Link>
        </div>
      </Shell>
    );
  }

  function updateField(patch: Partial<CourrierIrd>) {
    updateCi(courrier!.id, { ...patch });
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

  function handleSelectClient(c: { id: string; nom: string; agence_rattachement: string }) {
    updateCi(courrier!.id, {
      client: c.nom,
      client_referentiel_id: c.id,
      client_referentiel_nom: c.nom,
      client_referentiel_agence: c.agence_rattachement,
    });
    setClientSearchOpen(false);
  }

  function handleSoumettreNouveau() {
    apply(courrier!.id, "SOUMETTRE_NOUVEAU");
    setShowConfirmation(true);
  }

  function handleEnregistrer() {
    apply(courrier!.id, "ENREGISTRER_BROUILLON");
  }

  function handleSoumissionInitiale() {
    apply(courrier!.id, "VALIDER_CREATION");
  }

  return (
    <Shell>
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/remises-doc/import" className="hover:text-brand-600">Centralisation REMDOC Import</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{courrier.reference_courrier}</span>
      </div>

      {/* ====== STEPPER DYNAMIQUE ====== */}
      <DynamicStepper steps={stepperSteps} />

      {/* ============== En-tête ============== */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Link href="/remises-doc/import" className="text-xs text-ink-500 hover:text-brand-600 inline-flex items-center gap-1">
              <ChevronLeft size={12} /> Centralisation
            </Link>
            <h1 className="text-xl font-semibold mt-1">{courrier.reference_courrier}</h1>
            <div className="text-sm text-ink-500">
              <span className="badge-produit">{PRODUIT_IRD_LABEL[courrier.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span>
              {" "}{TRANSPORTEUR_LABEL[courrier.type_transporteur]} · {courrier.reference_transporteur ?? "—"}
              {" · "}Reçu le {new Date(courrier.date_reception).toLocaleDateString("fr-FR")}
              {" · "}{courrier.agence_reception}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/remises-doc/import/${courrier.id}/historique`}>
              <button className="btn-ghost text-xs h-8 px-3 inline-flex items-center gap-1">
                <History size={13} /> Historique
              </button>
            </Link>
            <span className={badgeForCourrierWorkflow(courrier.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[courrier.statut_workflow]}</span>
          </div>
        </div>
      </div>

      {/* ====== RÉCAPITULATIF RETOUR (visible en retour ET en correction) ====== */}
      {(isRetourne || isCorrection) && dernierRetour && (
        <div className="card p-5 border-l-4 border-l-red-500 bg-red-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <div className="font-semibold text-sm text-red-900">
                Correction demandée — {TYPE_RETOUR_LABEL[dernierRetour.type_retour]}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <div><span className="text-gray-500 font-medium">Motif :</span> <span className="font-semibold">{MOTIF_RETOUR_CENTRALISATION_LABEL[dernierRetour.motif]}</span></div>
                {dernierRetour.commentaire && (
                  <div><span className="text-gray-500 font-medium">Commentaire :</span> <span>{dernierRetour.commentaire}</span></div>
                )}
                <div><span className="text-gray-500 font-medium">Retourné par :</span> <span>{dernierRetour.auteur}</span></div>
                <div><span className="text-gray-500 font-medium">Le :</span> <span>{new Date(dernierRetour.date).toLocaleDateString("fr-FR")} à {new Date(dernierRetour.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== MESSAGE DE CONFIRMATION ====== */}
      {showConfirmation && isAttenteValidation && (
        <div className="card p-5 border-l-4 border-l-green-500 bg-green-50/50">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
            <div>
              <div className="font-semibold text-sm text-green-900">Centralisation soumise à nouveau</div>
              <div className="text-sm text-green-800 mt-1">
                Le dossier a été corrigé et soumis pour validation.
              </div>
              <button className="text-xs text-green-700 hover:underline mt-2" onClick={() => setShowConfirmation(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== MESSAGES DE STATUT ====== */}
      {isAttenteValidation && !showConfirmation && (
        <div className="card p-4 bg-amber-50/50 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 text-sm text-amber-900">
            <Clock size={16} />
            <span className="font-medium">Centralisation en attente de validation Agence</span>
            <span className="text-amber-700">— En attente de validation par le Responsable Agence.</span>
          </div>
        </div>
      )}
      {isTransmisCTN && (
        <div className="card p-4 bg-blue-50/50 border-l-4 border-l-blue-400">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <Send size={16} />
            <span className="font-medium">Centralisation transmise au CTN Devise</span>
            <span className="text-blue-700">— En attente de validation CTN.</span>
          </div>
        </div>
      )}
      {isValidee && (
        <div className="card p-4 bg-green-50/50 border-l-4 border-l-green-500">
          <div className="flex items-center gap-2 text-sm text-green-900">
            <CheckCircle2 size={16} />
            <span className="font-medium">Centralisation validée par le CTN Devise</span>
            {courrier.responsable_validation && (
              <span className="text-green-700">— Validée par {courrier.responsable_validation}</span>
            )}
          </div>
        </div>
      )}

      {/* ===== Informations REMDOC Import ===== */}
      <section className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold text-sm">Informations REMDOC Import</div>
            <div className="text-xs text-ink-500 mt-0.5">
              {isEditable ? "Saisie manuelle des informations de la centralisation." : "Consultation — centralisation non modifiable."}
            </div>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          {/* Ligne 1 : Client/Tiré, Montant, Devise */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Client/Tiré" warning={champsACorriger.includes("client")}>
              <div className="flex gap-1">
                <input
                  className={clsx("input flex-1", !isEditable && "bg-ink-50", champsACorriger.includes("client") && "border-red-400 ring-1 ring-red-200")}
                  value={courrier.client ?? ""}
                  onChange={e => updateField({ client: e.target.value || undefined, client_referentiel_id: undefined, client_referentiel_nom: undefined, client_referentiel_agence: undefined })}
                  disabled={!isEditable}
                  placeholder="Saisie manuelle"
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
              {champsACorriger.includes("client") && (
                <div className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> Information à corriger
                </div>
              )}
            </Field>

            <EditField label="Montant" type="number" value={courrier.montant?.toString() ?? ""}
              onChange={v => updateField({ montant: v === "" ? undefined : parseFloat(v) })} disabled={!isEditable}
              placeholder="0.00" warning={champsACorriger.includes("montant")} />
            <EditField label="Devise" value={courrier.devise ?? ""}
              onChange={v => updateField({ devise: v || undefined })} disabled={!isEditable}
              placeholder="EUR / USD / MAD" warning={champsACorriger.includes("devise")} />
          </div>

          {/* Ligne 2 : Référence interne + Référence externe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EditField label="Référence interne" value={courrier.reference_interne ?? ""}
              onChange={v => updateField({ reference_interne: v || undefined })} disabled={!isEditable}
              warning={champsACorriger.includes("reference_interne")} />
            <EditField label="Référence externe" value={courrier.reference_externe ?? ""}
              onChange={v => updateField({ reference_externe: v || undefined })} disabled={!isEditable}
              warning={champsACorriger.includes("reference_externe")} />
          </div>

          {/* Ligne 3 : Type d'évènement + Code d'évènement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Type d'évènement">
              <select
                className={clsx("input w-full", !isEditable && "bg-ink-50")}
                value={courrier.type_evenement ?? "CREATION"}
                onChange={e => {
                  const t = e.target.value as import("@/domain/types").TypeEvenementCentralisation;
                  const code = t === "CREATION" ? "CRE001" : t === "MODIFICATION" ? "MOD002" : "CHG003";
                  updateField({ type_evenement: t, code_evenement: code });
                }}
                disabled={!isEditable}
              >
                <option value="CREATION">Création</option>
                <option value="MODIFICATION">Modification</option>
                <option value="CHANGEMENT_DOMICILIATION">Changement de domiciliation</option>
              </select>
            </Field>
            <EditField label="Code d'évènement" value={courrier.code_evenement ?? "—"} onChange={() => {}} disabled={true} />
          </div>
        </div>
      </section>

      {/* ===== Documents rattachés ===== */}
      <section className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold text-sm">Documents rattachés</div>
          {(isRetourne || isCorrection) && dernierRetour && (dernierRetour.motif === "DOCUMENT_NON_CONFORME" || dernierRetour.motif === "DOCUMENT_MANQUANT") && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle size={12} /> Document(s) à remplacer / compléter
            </span>
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
            <div className="text-sm font-medium text-ink-700">Glissez-déposez vos documents ici</div>
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
                {dernierRetour?.documents_a_remplacer?.includes(d.id) && (
                  <span className="text-[10px] text-red-600 flex items-center gap-1">
                    <AlertTriangle size={10} /> À remplacer
                  </span>
                )}
              </div>
              {isEditable && (
                <button className="btn-ghost text-ink-500" onClick={() => removeDoc(courrier.id, d.id)} title="Supprimer">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
          {courrier.documents.length === 0 && (
            <li className="px-3 py-6 text-center text-ink-500 text-xs">Aucun document rattaché</li>
          )}
        </ul>
      </section>

      {/* ===== ACTIONS ===== */}
      <section className="card p-5">
        <div className="font-semibold text-sm mb-3">Actions</div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Brouillon — saisie initiale */}
          {isBrouillon && (
            <>
              <button className="btn-outline" onClick={handleEnregistrer}>
                <Save size={14} /> Enregistrer
              </button>
              <button className="btn-primary" onClick={handleSoumissionInitiale}>
                <CheckCircle2 size={14} /> Soumettre pour validation
              </button>
            </>
          )}

          {/* Retourné ou en correction — édition directe */}
          {(isRetourne || isCorrection) && (
            <>
              <button className="btn-outline" onClick={handleEnregistrer}>
                <Save size={14} /> Enregistrer
              </button>
              <button className="btn-primary" onClick={handleSoumettreNouveau}>
                <Send size={14} /> Soumettre à nouveau
              </button>
            </>
          )}

          {/* En attente validation agence */}
          {isAttenteValidation && !showConfirmation && (
            <span className="text-xs text-ink-500">En attente de validation par le Responsable Agence. Le dossier n'est plus modifiable.</span>
          )}

          {/* Transmis CTN */}
          {isTransmisCTN && (
            <span className="text-xs text-blue-700">Centralisation transmise au CTN Devise — en attente de validation.</span>
          )}

          {/* Validée */}
          {isValidee && (
            <span className="text-xs text-green-700">Centralisation validée — verrouillée.</span>
          )}
        </div>
      </section>

      {/* ============== Modal recherche client référentiel ============== */}
      {clientSearchOpen && (
        <ClientReferentielSearchModal
          initialQuery={courrier.client ?? ""}
          onSelect={handleSelectClient}
          onClose={() => setClientSearchOpen(false)}
        />
      )}
    </div>
    </Shell>
  );
}

/* ====== STEPPER DYNAMIQUE ======
   Construit les étapes depuis l'historique réel du dossier,
   puis ajoute les étapes futures (grisées) selon le statut.
   Mapping :
   - CREATION        → "Création de la centralisation"
   - SOUMISSION      → étape "Validation Agence" (stage atteint)
   - VALIDATION_AGENCE → confirme l'étape "Validation Agence"
   - TRANSMISSION_CTN → étape "Validation CTN Devise" (stage atteint)
   - VALIDATION_CTN  → confirme l'étape "Validation CTN Devise"
   - RETOUR_AGENCE   → "Retour Agence"
   - RETOUR_CTN      → "Retour CTN"
   - CORRECTION      → "Correction"
*/

type StepKind = "CREATION" | "VALIDATION_AGENCE" | "RETOUR" | "CORRECTION" | "VALIDATION_CTN";
type StepState = "done" | "current" | "pending";

interface StepperStep {
  label: string;
  desc: string;
  kind: StepKind;
  state: StepState;
  date?: string;
}

function buildStepperSteps(c: CourrierIrd): StepperStep[] {
  const steps: StepperStep[] = [];

  for (const ev of c.historique) {
    const last = steps[steps.length - 1];
    switch (ev.type) {
      case "CREATION":
        steps.push({ label: "Création de la centralisation", desc: "Saisie Agence", kind: "CREATION", state: "done", date: ev.date });
        break;
      case "SOUMISSION":
        steps.push({ label: "Validation Agence", desc: "Responsable Agence", kind: "VALIDATION_AGENCE", state: "done", date: ev.date });
        break;
      case "VALIDATION_AGENCE":
        // la soumission a déjà matérialisé l'étape "Validation Agence" — on ne duplique pas
        if (!(last && last.kind === "VALIDATION_AGENCE")) {
          steps.push({ label: "Validation Agence", desc: "Responsable Agence", kind: "VALIDATION_AGENCE", state: "done", date: ev.date });
        }
        break;
      case "TRANSMISSION_CTN":
        steps.push({ label: "Validation CTN Devise", desc: "CTN Devise", kind: "VALIDATION_CTN", state: "done", date: ev.date });
        break;
      case "VALIDATION_CTN":
        if (!(last && last.kind === "VALIDATION_CTN")) {
          steps.push({ label: "Validation CTN Devise", desc: "CTN Devise", kind: "VALIDATION_CTN", state: "done", date: ev.date });
        }
        break;
      case "RETOUR_AGENCE":
        steps.push({ label: "Retour Agence", desc: ev.motif ?? "Correction demandée", kind: "RETOUR", state: "done", date: ev.date });
        break;
      case "RETOUR_CTN":
        steps.push({ label: "Retour CTN", desc: ev.motif ?? "Correction demandée", kind: "RETOUR", state: "done", date: ev.date });
        break;
      case "CORRECTION":
        steps.push({ label: "Correction", desc: "Saisie Agence", kind: "CORRECTION", state: "done", date: ev.date });
        break;
    }
  }

  /* ---- étapes futures (pending) selon le statut courant ---- */
  const s = c.statut_workflow;

  const pushPending = (label: string, desc: string, kind: StepKind) =>
    steps.push({ label, desc, kind, state: "pending" });

  if (s === "VALIDEE_CTN" || s === "ENVOYE_CTN") {
    // parcours terminé
  } else if (s === "EN_ATTENTE_VALIDATION_CTN") {
    // l'étape "Validation CTN Devise" (transmission) est déjà réalisée
  } else if (s === "EN_ATTENTE_VALIDATION_AGENCE") {
    pushPending("Validation CTN Devise", "CTN Devise", "VALIDATION_CTN");
  } else if (s === "EN_CORRECTION") {
    pushPending("Validation Agence", "Responsable Agence", "VALIDATION_AGENCE");
    pushPending("Validation CTN Devise", "CTN Devise", "VALIDATION_CTN");
  } else if (s === "RETOUR_AGENCE" || s === "RETOUR_CTN") {
    pushPending("Correction", "Saisie Agence", "CORRECTION");
    pushPending("Validation Agence", "Responsable Agence", "VALIDATION_AGENCE");
    pushPending("Validation CTN Devise", "CTN Devise", "VALIDATION_CTN");
  } else {
    // EN_PREPARATION — brouillon
    pushPending("Validation Agence", "Responsable Agence", "VALIDATION_AGENCE");
    pushPending("Validation CTN Devise", "CTN Devise", "VALIDATION_CTN");
  }

  // l'étape courante = dernière étape réalisée (sauf si tout est terminé)
  const done = s === "VALIDEE_CTN" || s === "ENVOYE_CTN";
  if (!done) {
    const lastRealized = [...steps].reverse().find(st => st.state === "done");
    if (lastRealized) lastRealized.state = "current";
  }

  return steps;
}

function DynamicStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <div className="card p-5">
      <div className="flex items-start overflow-x-auto">
        {steps.map((step, i) => {
          const done = step.state === "done";
          const current = step.state === "current";
          const isRetour = step.kind === "RETOUR";

          const dotClass = step.state === "pending"
            ? "bg-white border-ink-200 text-ink-400"
            : isRetour
              ? done ? "bg-red-500 border-red-500 text-white" : "bg-white border-red-500 text-red-600"
              : done ? "bg-brand-500 border-brand-500 text-white" : "bg-white border-brand-500 text-brand-600";

          return (
            <div key={i} className="flex items-start flex-1 min-w-[140px]">
              <div className="flex flex-col items-center text-center flex-1">
                <div className={clsx(
                  "h-9 w-9 rounded-full grid place-items-center text-sm font-semibold border-2 transition shrink-0",
                  dotClass
                )}>
                  {done ? (isRetour ? "!" : <Check size={16} />) : current ? (isRetour ? "!" : i + 1) : i + 1}
                </div>
                <div className={clsx(
                  "text-xs font-semibold mt-2",
                  isRetour && step.state !== "pending" ? "text-red-700" : step.state === "pending" ? "text-ink-400" : "text-ink-800"
                )}>
                  {step.label}
                </div>
                <div className="text-[10px] text-ink-500 mt-0.5 max-w-[140px]">
                  {step.desc}
                </div>
                {step.date && (
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {new Date(step.date).toLocaleDateString("fr-FR")}
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={clsx(
                  "h-0.5 flex-1 mx-2 mt-[18px] rounded shrink-0",
                  steps[i + 1].state === "pending" ? "bg-ink-200" : isRetour ? "bg-red-300" : "bg-brand-500"
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

function Field({ label, children, warning }: { label: string; children: React.ReactNode; warning?: boolean }) {
  return (
    <div>
      <div className={clsx("label", warning && "text-red-600")}>{label}</div>
      {children}
    </div>
  );
}

function EditField({
  label, value, onChange, type = "text", disabled, placeholder, warning,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string; warning?: boolean }) {
  return (
    <Field label={label} warning={warning}>
      <input
        className={clsx("input", disabled && "bg-ink-50", warning && "border-red-400 ring-1 ring-red-200")}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
      {warning && (
        <div className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
          <AlertTriangle size={10} /> Information à corriger
        </div>
      )}
    </Field>
  );
}
