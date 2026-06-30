import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import StatutBadge from "./StatutBadge";
import type { DossierTrade, MontantAvecDevise } from "@/domain/consultation-detail";

function isMontantAvecDevise(value: unknown): value is MontantAvecDevise {
  return (
    typeof value === "object" &&
    value !== null &&
    "valeur" in value &&
    "devise" in value &&
    typeof (value as MontantAvecDevise).valeur === "number" &&
    typeof (value as MontantAvecDevise).devise === "string"
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR") + " " + date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function montantPrincipal(dossier: DossierTrade): string | null {
  const clesPrioritaires: Record<string, string> = {
    ILC: "montantCredit",
    ELC: "montantCredit",
    IRD: "montantRemise",
    ERD: "montantRemise",
    FIN: "montantFinancement",
  };
  const cle = clesPrioritaires[dossier.produit];
  const valeur = cle ? dossier.donnees[cle] : undefined;
  if (!valeur) return null;
  if (isMontantAvecDevise(valeur)) {
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valeur.valeur) + " " + valeur.devise;
  }
  return null;
}

export default function DossierHeader({ dossier }: { dossier: DossierTrade }) {
  const montant = montantPrincipal(dossier);

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
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8590C] mt-2 mb-1">Synthèse du dossier</div>
          <h1 className="text-xl font-semibold text-ink-900">{dossier.produitLibelle} – {dossier.reference}</h1>
          <div className="text-xs text-ink-500 mt-1">
            <span className="font-medium text-ink-700">Date de mise à jour :</span> {dossier.dateMiseAJour ? formatDateTime(dossier.dateMiseAJour) : "—"}
          </div>
          <div className="text-sm text-ink-500 mt-2">
            {dossier.client}
            {montant ? ` · ${montant}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-ink-100 text-ink-700 rounded-full">{dossier.produit}</span>
          <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-ink-100 text-ink-700 rounded-full">{dossier.produitLibelle}</span>
          <StatutBadge statut={dossier.statut} />
        </div>
      </div>
    </div>
  );
}
