"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  ChevronLeft, Send, FileText, Plus, Trash2,
  CheckCircle2, AlertTriangle, Save, RotateCcw, Check, Search,
} from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, DOC_LABEL,
  badgeForCourrierWorkflow,
  TRANSPORTEUR_LABEL, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import ClientReferentielSearchModal from "@/components/ui/ClientReferentielSearchModal";
import Shell from "@/components/Shell";
import type {
  TypeDocument, StatutCourrierWorkflow,
} from "@/domain/types";

export default function CentralisationRDIDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const courrier = useTomStore(s => s.courriersIrd.find(c => c.id === id));
  const addDocs   = useTomStore(s => s.addDocumentsCourrierIrd);
  const removeDoc = useTomStore(s => s.removeDocumentCourrierIrd);
  const updateCi  = useTomStore(s => s.updateCourrierIrd);
  const apply     = useTomStore(s => s.applyCourrierIrdAction);
  const acteur    = useTomStore(s => s.acteurCourant);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [commentaireRetour, setCommentaireRetour] = useState("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  if (!courrier) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Centralisation introuvable. <Link href="/remises-doc/import" className="text-brand-600">Retour à la liste</Link>
      </div>
    );
  }

  /* ---- derived ---- */
  const isEditable    = courrier.statut_workflow === "EN_PREPARATION" && acteur === "AGENCE";
  const isLocked      = courrier.statut_workflow === "ENVOYE_CTN";

  function updateField(field: string, patch: Partial<import("@/domain/types").CourrierIrd>) {
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

      {/* ====== TIMELINE HORIZONTALE DE TRAITEMENT ====== */}
      <WorkflowTimeline statut={courrier.statut_workflow} />

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
              {" · "}{courrier.agence_reception} · TEAM REMDOC IMPORT
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={badgeForCourrierWorkflow(courrier.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[courrier.statut_workflow]}</span>
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
              <CheckCircle2 size={14} /> Centralisation validée et envoyée au CTN devise
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

      {/* ===== Informations REMDOC Import ===== */}
      <section className="card p-5">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="font-semibold text-sm">Informations REMDOC Import</div>
            <div className="text-xs text-ink-500 mt-0.5">
              Saisie manuelle des informations de la centralisation.
            </div>
          </div>
        </div>
        <div className="space-y-3 mt-4">
          {/* Ligne 1 : Client/Tiré, Montant, Devise */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Client/Tiré">
              <div className="flex gap-1">
                <input
                  className={clsx("input flex-1", !isEditable && "bg-ink-50")}
                  value={courrier.client ?? ""}
                  onChange={e => updateField("client", { client: e.target.value || undefined, client_referentiel_id: undefined, client_referentiel_nom: undefined, client_referentiel_agence: undefined })}
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
            </Field>

            <EditField label="Montant" type="number" value={courrier.montant?.toString() ?? ""}
              onChange={v => updateField("montant", { montant: v === "" ? undefined : parseFloat(v) })} disabled={!isEditable}
              placeholder="0.00" />
            <EditField label="Devise" value={courrier.devise ?? ""}
              onChange={v => updateField("devise", { devise: v || undefined })} disabled={!isEditable}
              placeholder="EUR / USD / MAD" />
          </div>

          {/* Ligne 2 : Référence interne + Référence externe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <EditField label="Référence interne" value={courrier.reference_interne ?? ""}
              onChange={v => updateField("reference_interne", { reference_interne: v || undefined })} disabled={!isEditable} />
            <EditField label="Référence externe" value={courrier.reference_externe ?? ""}
              onChange={v => updateField("reference_externe", { reference_externe: v || undefined })} disabled={!isEditable} />
          </div>
        </div>
      </section>

      {/* ===== Documents rattachés ===== */}
      <section className="card p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-semibold text-sm">Documents rattachés</div>
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
          {courrier.statut_workflow === "EN_PREPARATION" && acteur === "AGENCE" && (
            <>
              <button className="btn-outline">
                <Save size={14} /> Enregistrer
              </button>
              <button className="btn-primary" onClick={() => apply(courrier.id, "VALIDER_CREATION")}>
                <CheckCircle2 size={14} /> Valider création
              </button>
              <span className="text-xs text-ink-500 ml-2">Saisie manuelle des informations, puis validation.</span>
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
            <span className="text-xs text-green-700">Centralisation envoyée au CTN devise — verrouillée.</span>
          )}
        </div>
      </section>

      {/* ============== Modal retour pour correction ============== */}
      {returnModalOpen && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setReturnModalOpen(false)}>
          <div className="card max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="font-semibold text-base mb-2">Retourner pour correction</div>
            <p className="text-xs text-ink-500 mb-4">La centralisation sera renvoyée à l'agent pour complétion.</p>
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

/* ====== TIMELINE HORIZONTALE DE TRAITEMENT ====== */

const TIMELINE_STEPS: { key: StatutCourrierWorkflow; label: string; desc: string }[] = [
  { key: "EN_PREPARATION", label: "Création de la centralisation", desc: "Rattachement documentaire, saisie métier" },
  { key: "EN_ATTENTE_VALIDATION_AGENCE", label: "Validation agence", desc: "Contrôle et validation responsable agence" },
  { key: "ENVOYE_CTN", label: "Envoyé CTN devise", desc: "Transmission vers CTN devise" },
];

function WorkflowTimeline({ statut }: { statut: StatutCourrierWorkflow }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="label">{label}</div>{children}</div>;
}

function EditField({
  label, value, onChange, type = "text", disabled, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string }) {
  return (
    <Field label={label}>
      <input
        className={clsx("input", disabled && "bg-ink-50")}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
      />
    </Field>
  );
}
