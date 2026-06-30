import { useEffect, useRef } from "react";
import { X, FileText, Paperclip, HelpCircle } from "lucide-react";
import NatureBadge from "./NatureBadge";
import StatutBadge from "./StatutBadge";
import DetailsOperationBloc from "./DetailsOperationBloc";
import { getNatureSchema } from "@/lib/natures";
import type { EvenementTrade } from "@/domain/consultation-detail";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-ink-800">{value || <span className="text-ink-300">—</span>}</div>
    </div>
  );
}

export default function OperationDetail({
  event,
  onClose,
}: {
  event: EvenementTrade | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!event) return;
    panelRef.current?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [event, onClose]);

  if (!event) return null;

  const schema = getNatureSchema(event.nature);
  const dg = event.detailsGeneraux;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto p-6 outline-none"
        style={{ animation: "slideIn 0.2s ease-out" }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-ink-100 rounded-md text-ink-500"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="mt-2 mb-1">
          <StatutBadge statut={event.statut} />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <NatureBadge nature={event.nature} />
          </div>
          <p className="text-sm text-ink-500 font-mono">{event.reference}</p>
        </div>

        {/* Bloc 1 — Détails généraux */}
        <div className="bg-white border border-ink-100 rounded-lg p-4 mb-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#E8590C] mb-3 flex items-center gap-2">
            <FileText size={14} /> Détails généraux
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Référence opération" value={dg.referenceOperation} />
            <Field label="Dossier rattaché" value={dg.dossierRattache} />
            <Field label="Date de création" value={new Date(event.dateCreation).toLocaleString("fr-FR")} />
            <Field label="Date d'échéance" value={dg.dateEcheance ? new Date(dg.dateEcheance).toLocaleDateString("fr-FR") : null} />
            <Field label="Montant" value={event.montant !== null ? event.montant.toLocaleString("fr-FR") : null} />
            <Field label="Devise" value={event.devise} />
            <Field label="Canal" value={dg.canal} />
            <Field label="Réf. SWIFT" value={dg.refSwift} />
            <Field label="Émetteur" value={dg.emetteur} />
            <Field label="Entité" value={dg.entite} />
          </div>
        </div>

        {/* Bloc 2 — Détails de l'opération */}
        <DetailsOperationBloc event={event} />

        {/* Bloc 3 — Notes */}
        {event.notes && (
          <div className="bg-white border border-ink-100 rounded-lg p-4 mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#E8590C] mb-2">Notes</div>
            <p className="text-sm text-ink-700">{event.notes}</p>
          </div>
        )}

        {/* Bloc 4 — Documents attachés */}
        <div className="bg-white border border-ink-100 rounded-lg p-4 mt-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#E8590C] mb-3 flex items-center gap-2">
            <Paperclip size={14} /> Documents attachés
          </div>
          {event.documents.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {event.documents.map((doc, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-ink-800">{doc.nom}</span>
                  <span className="text-xs text-ink-500">{doc.type}{doc.taille ? ` · ${doc.taille}` : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-500">Aucun document attaché.</p>
          )}
        </div>

        {/* Volet d'aide contextuelle */}
        {schema?.aide && (
          <div className="bg-[#FDF0E8] rounded-lg p-4 mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#E8590C] mb-2 flex items-center gap-2">
              <HelpCircle size={14} /> Aide
            </div>
            <p className="text-sm text-ink-700">{schema.aide}</p>
          </div>
        )}
      </div>
    </div>
  );
}
