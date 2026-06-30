import { X, Paperclip } from "lucide-react";
import StatutBadge from "./StatutBadge";
import type { EvenementTrade } from "@/domain/consultation-detail";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-ink-800">{value || <span className="text-ink-300">—</span>}</div>
    </div>
  );
}

export default function EvenementDetailDrawer({
  evenement,
  onClose,
}: {
  evenement: EvenementTrade | null;
  onClose: () => void;
}) {
  if (!evenement) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white h-full w-full max-w-md shadow-2xl overflow-y-auto p-6 animate-[slideIn_0.2s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 hover:bg-ink-100 rounded-md text-ink-500" aria-label="Fermer">
          <X size={20} />
        </button>

        <div className="mt-2 mb-6"><StatutBadge statut={evenement.statut} /></div>

        <h2 className="text-lg font-semibold text-ink-900 mb-1">{evenement.nature}</h2>
        <p className="text-sm text-ink-500 mb-6">{evenement.reference}</p>

        <div className="bg-ink-50 rounded-lg p-4 mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Description</div>
          <div className="text-sm text-ink-700">{evenement.description}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Montant" value={evenement.montant !== null ? `${evenement.montant.toLocaleString("fr-FR")} ${evenement.devise}` : null} />
          <Field label="Date / heure" value={new Date(evenement.dateCreation).toLocaleString("fr-FR")} />
          <Field label="Canal" value={evenement.canal} />
          <Field label="Réf. SWIFT" value={evenement.refSwift} />
          <Field label="Émetteur" value={evenement.emetteur} />
          <Field label="Entité" value={evenement.entite} />
          <Field label="Échéance" value={evenement.dateEcheance ? new Date(evenement.dateEcheance).toLocaleDateString("fr-FR") : null} />
          <Field
            label="Pièces jointes"
            value={
              evenement.piecesJointes > 0 ? (
                <span className="inline-flex items-center gap-1"><Paperclip size={14} /> {evenement.piecesJointes}</span>
              ) : null
            }
          />
        </div>
      </div>
    </div>
  );
}
