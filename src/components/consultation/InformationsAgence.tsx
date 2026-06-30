import { AgenceInfo } from "@/domain/consultation-detail";

interface InformationsAgenceProps {
  agenceInfo: AgenceInfo;
}

export default function InformationsAgence({ agenceInfo }: InformationsAgenceProps) {
  return (
    <div className="bg-white rounded-xl border-l-4 border-[#E8722A] p-5 mt-4" style={{ backgroundColor: "#FDF0E8" }}>
      <h3 className="text-sm font-semibold text-[#E8722A] mb-4 uppercase tracking-wider">Informations agence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Référence CTN Devises</div>
          <div className="text-sm font-medium text-ink-900">{agenceInfo.referenceCTN}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Agence traitante</div>
          <div className="text-sm text-ink-700">{agenceInfo.agenceTraitante}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Gestionnaire (agent traitant)</div>
          <div className="text-sm text-ink-700">{agenceInfo.gestionnaire}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Date de prise en charge</div>
          <div className="text-sm text-ink-700">{agenceInfo.datePriseEnCharge}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Statut opérationnel</div>
          <div className="text-sm text-ink-700">{agenceInfo.statutOperationnel}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Contrôle documentaire</div>
          <div className="text-sm text-ink-700">{agenceInfo.controleDocumentaire}</div>
        </div>
        <div className="md:col-span-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Prochaine action requise</div>
          <div className="text-sm text-ink-700">{agenceInfo.prochaineAction}</div>
        </div>
        <div className="md:col-span-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Note interne</div>
          <div className="text-sm text-ink-700 bg-white p-3 rounded border border-ink-200 min-h-[60px]">
            {agenceInfo.noteInterne}
          </div>
        </div>
      </div>
    </div>
  );
}
