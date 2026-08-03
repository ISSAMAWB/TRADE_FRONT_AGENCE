import Link from "next/link";
import { ChevronLeft, Building2, Banknote, FileText, Calendar, Info, TrendingUp } from "lucide-react";
import StatutBadge from "./StatutBadge";
import { getProduitSchema } from "@/lib/produits";
import type { DossierTrade, ChampSchema, MontantAvecDevise } from "@/domain/consultation-detail";

const ICONES: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Building2,
  Banknote,
  FileText,
  Calendar,
  Info,
  TrendingUp,
};

function isMontantAvecDevise(value: unknown): value is MontantAvecDevise {
  return (
    typeof value === "object" &&
    value !== null &&
    "valeur" in value &&
    "devise" in value
  );
}

function formatMontant(valeur: number, devise: string): string {
  const nombre = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valeur);
  return `${nombre} ${devise}`.trim();
}

function formatDate(valeur: string): string {
  const date = new Date(valeur);
  if (isNaN(date.getTime())) return valeur;
  return date.toLocaleDateString("fr-FR");
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
  if (valeur && isMontantAvecDevise(valeur)) {
    return formatMontant(valeur.valeur, valeur.devise);
  }
  return null;
}

function renderValeur(champ: ChampSchema, dossier: DossierTrade): React.ReactNode {
  const raw = dossier.donnees[champ.cle];

  if (raw === null || raw === undefined || raw === "") {
    return <span className="text-gray-300">—</span>;
  }

  if (champ.estClient) {
    return (
      <div className="flex items-center gap-2">
        <span>{String(raw)}</span>
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-orange-500 text-white rounded-md">
          Client
        </span>
      </div>
    );
  }

  if ((champ.format === "montant" || champ.format === "montant-emphase" || champ.format === "montant-declare") && isMontantAvecDevise(raw)) {
    const contenu = formatMontant(raw.valeur, raw.devise);
    if (champ.format === "montant-emphase") {
      return <span className="font-semibold text-orange-500">{contenu}</span>;
    }
    return contenu;
  }

  if (champ.format === "date") {
    return formatDate(String(raw));
  }

  if (champ.format === "badge-confirmation") {
    const confirme = String(raw).toLowerCase().includes("confirm");
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${confirme ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
        {confirme ? "Confirmé" : String(raw)}
      </span>
    );
  }

  if (Array.isArray(raw)) {
    return (
      <div className="flex flex-wrap gap-2">
        {raw.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-lg">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  return String(raw);
}

function InfoLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{label}</div>
      <div className="text-sm font-medium text-gray-900">{value}</div>
    </div>
  );
}

export default function MasterSummaryCard({ dossier }: { dossier: DossierTrade }) {
  const montant = montantPrincipal(dossier);
  const schema = getProduitSchema(dossier.produit);
  const blocs = schema?.blocs ?? [];
  const client = dossier.clientInfo;

  return (
    <div className="space-y-4">
      {/* Ligne 1 : Synthèse + Informations client */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Link
                href="/consultation/dossiers"
                className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1"
              >
                <ChevronLeft size={12} /> Retour à la liste
              </Link>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 mt-2 mb-1">Synthèse du dossier</div>
              <h1 className="text-xl font-semibold text-gray-900">{dossier.produitLibelle} – {dossier.reference}</h1>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-700">Dernière mise à jour :</span> {dossier.dateMiseAJour ? formatDateTime(dossier.dateMiseAJour) : "—"}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {dossier.client}
                {montant ? ` · ${montant}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{dossier.produit}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{dossier.produitLibelle}</span>
              <StatutBadge statut={dossier.statut} />
            </div>
          </div>
        </div>

        {client && (
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-3">Informations client</div>
            <div className="space-y-3">
              <InfoLine label="Raison sociale" value={client.raisonSociale} />
              <InfoLine label="N° de compte" value={client.numeroCompte} />
              <InfoLine label="ICE" value={client.ice} />
              <InfoLine label="Code client" value={client.codeClient} />
            </div>
          </div>
        )}
      </div>

      {/* Ligne 2 : Cartes thématiques (blocs du schéma produit) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {blocs.map((bloc) => {
          const Icone = ICONES[bloc.icone] ?? Info;
          return (
            <div key={bloc.titre} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-orange-100/50 flex items-center justify-center">
                  <Icone size={15} className="text-orange-500" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700">{bloc.titre}</span>
              </div>
              <div className="space-y-3">
                {bloc.champs.map((champ) => (
                  <div key={champ.cle}>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">{champ.label}</div>
                    <div className="text-sm font-medium text-gray-900">{renderValeur(champ, dossier)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
