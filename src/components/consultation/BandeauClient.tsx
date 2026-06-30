import { ClientInfo } from "@/domain/consultation-detail";

interface BandeauClientProps {
  clientInfo: ClientInfo;
}

export default function BandeauClient({ clientInfo }: BandeauClientProps) {
  return (
    <div className="bg-white rounded-xl border-l-4 border-[#E8722A] p-5 mb-4" style={{ backgroundColor: "#FDF0E8" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">Raison sociale</div>
          <div className="text-sm font-medium text-ink-900">{clientInfo.raisonSociale}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">N° de compte</div>
          <div className="text-sm font-medium text-ink-900">{clientInfo.numeroCompte}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">ICE</div>
          <div className="text-sm text-ink-700">{clientInfo.ice}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">Code client</div>
          <div className="text-sm text-ink-700">{clientInfo.codeClient}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">Agence de rattachement</div>
          <div className="text-sm text-ink-700">{clientInfo.agenceRattachement}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">Rôle dans l'opération</div>
          <div className="text-sm text-ink-700">{clientInfo.roleOperation}</div>
        </div>
      </div>
    </div>
  );
}
