import { ClientInfo } from "@/domain/consultation-detail";

interface BandeauClientProps {
  clientInfo: ClientInfo;
}

export default function BandeauClient({ clientInfo }: BandeauClientProps) {
  return (
    <div className="bg-white rounded-xl border-l-4 border-[#E8722A] p-5 mb-4" style={{ backgroundColor: "#FDF0E8" }}>
      <div className="text-sm font-semibold uppercase tracking-wider text-[#E8722A] mb-4 pb-2 border-b border-[#E8722A]/20">
        Informations client
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">Raison sociale</div>
          <div className="text-sm font-medium text-ink-900">{clientInfo.raisonSociale}</div>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8722A] mb-1">N° de compte</div>
          <div className="text-sm font-medium text-ink-900">{clientInfo.numeroCompte}</div>
        </div>
      </div>
    </div>
  );
}
