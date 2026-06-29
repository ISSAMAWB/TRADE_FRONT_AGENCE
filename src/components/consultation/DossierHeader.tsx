import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import StatutBadge from "./StatutBadge";
import type { DossierTrade } from "@/domain/consultation-detail";

export default function DossierHeader({ dossier }: { dossier: DossierTrade }) {
  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link
            href="/consultation/dossiers"
            className="text-xs text-ink-500 hover:text-[#E8590C] inline-flex items-center gap-1"
          >
            <ChevronLeft size={12} /> Retour à la liste
          </Link>
          <h1 className="text-xl font-semibold mt-1 text-ink-900">{dossier.reference}</h1>
          <div className="text-sm text-ink-500 mt-1">
            {dossier.client} · {dossier.compte} · {dossier.montant.toLocaleString("fr-FR")} {dossier.devise} · Créé le {new Date(dossier.dateCreation).toLocaleDateString("fr-FR")}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-ink-100 text-ink-700 rounded-full">{dossier.produit}</span>
          <StatutBadge statut={dossier.statut} />
        </div>
      </div>
    </div>
  );
}
