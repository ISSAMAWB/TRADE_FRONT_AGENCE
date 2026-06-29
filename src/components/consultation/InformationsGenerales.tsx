import { Info } from "lucide-react";
import StatutBadge from "./StatutBadge";
import type { DossierTrade } from "@/domain/consultation-detail";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{label}</div>
      <div className="text-sm font-medium text-ink-800">{value || <span className="text-ink-300">—</span>}</div>
    </div>
  );
}

export default function InformationsGenerales({ dossier }: { dossier: DossierTrade }) {
  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8590C] border-b border-ink-100 pb-2 mb-4 flex items-center gap-2">
        <Info size={14} /> Informations générales
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Field label="Référence" value={dossier.reference} />
        <Field label="Produit" value={dossier.produitLibelle} />
        <Field label="Client" value={dossier.client} />
        <Field label="Compte" value={dossier.compte} />
        <Field label="ICE" value={dossier.ice} />
        <Field label="Code client" value={dossier.codeClient} />
        <Field label="Montant" value={`${dossier.montant.toLocaleString("fr-FR")} ${dossier.devise}`} />
        <Field label="Date de création" value={new Date(dossier.dateCreation).toLocaleDateString("fr-FR")} />
        <Field label="Date d'échéance" value={new Date(dossier.dateEcheance).toLocaleDateString("fr-FR")} />
        <Field label="Banque correspondante" value={dossier.banqueCorrespondante} />
        <Field label="Pays d'origine" value={dossier.paysOrigine} />
        <Field label="Statut" value={<StatutBadge statut={dossier.statut} />} />
      </div>
    </div>
  );
}
