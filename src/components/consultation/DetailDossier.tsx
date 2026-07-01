import Link from "next/link";
import { Building2, Banknote, FileText, Calendar, Info, TrendingUp, History, Eye } from "lucide-react";
import DossierHeader from "./DossierHeader";
import StatutBadge from "./StatutBadge";
import BandeauClient from "./BandeauClient";
import { getProduitSchema } from "@/lib/produits";
import type { DossierTrade, BlocSchema, ChampSchema, MontantAvecDevise, Paiement, Courrier } from "@/domain/consultation-detail";

const ICONES: Record<string, React.ComponentType<{ size?: number | string }>> = {
  Building2,
  Banknote,
  FileText,
  Calendar,
  Info,
  TrendingUp,
  History,
};

function formatMontant(valeur: number, devise: string): string {
  const nombre = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valeur);
  return `${nombre} ${devise}`;
}

function formatDate(valeur: string): string {
  const date = new Date(valeur);
  if (isNaN(date.getTime())) return valeur;
  return date.toLocaleDateString("fr-FR");
}

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

function isPaiementArray(value: unknown): value is Paiement[] {
  return Array.isArray(value) && value.every((p) => typeof p === "object" && p !== null && "uetr" in p && "montant" in p);
}

function isCourrierArray(value: unknown): value is Courrier[] {
  return Array.isArray(value) && value.every((c) => typeof c === "object" && c !== null && "reference" in c && "dateEnvoi" in c);
}

function TableauPaiements({ paiements }: { paiements: Paiement[] }) {
  return (
    <table className="w-full text-xs mt-1">
      <tbody>
        {paiements.map((p) => (
          <tr key={p.uetr} className="border-b border-ink-100">
            <td className="px-2 py-1 font-mono text-[10px]">{p.uetr}</td>
            <td className="px-2 py-1 text-right">{formatMontant(p.montant, p.devise)}</td>
            <td className="px-2 py-1">{formatDate(p.datePaiement)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TableauCourriers({ courriers }: { courriers: Courrier[] }) {
  return (
    <table className="w-full text-xs mt-1">
      <tbody>
        {courriers.map((c) => (
          <tr key={c.reference} className="border-b border-ink-100">
            <td className="px-2 py-1 font-mono text-[10px]">{c.reference}</td>
            <td className="px-2 py-1">{formatDate(c.dateEnvoi)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function renderValeur(champ: ChampSchema, dossier: DossierTrade): React.ReactNode {
  const raw = dossier.donnees[champ.cle];

  if (raw === null || raw === undefined || raw === "") {
    return <span className="text-ink-300">—</span>;
  }

  if (champ.estClient) {
    return (
      <div className="flex items-center gap-2">
        <span>{String(raw)}</span>
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-[#E8722A] text-white rounded-full">
          Client
        </span>
      </div>
    );
  }

  if (champ.format === "montant") {
    if (isMontantAvecDevise(raw)) {
      return formatMontant(raw.valeur, raw.devise);
    }
    if (typeof raw === "number") {
      return formatMontant(raw, "");
    }
    return String(raw);
  }

  if (champ.format === "montant-emphase") {
    if (isMontantAvecDevise(raw)) {
      return <span className="font-semibold text-[#E8590C]">{formatMontant(raw.valeur, raw.devise)}</span>;
    }
    if (typeof raw === "number") {
      return <span className="font-semibold text-[#E8590C]">{formatMontant(raw, "")}</span>;
    }
    return String(raw);
  }

  if (champ.format === "montant-declare") {
    if (isMontantAvecDevise(raw)) {
      const attente = dossier.donnees["montantEnAttente"];
      return (
        <div>
          <div>{formatMontant(raw.valeur, raw.devise)}</div>
          {isMontantAvecDevise(attente) && (
            <div className="text-[10px] text-ink-400 mt-0.5">
              Dont {formatMontant(attente.valeur, attente.devise)} en attente de paiement
            </div>
          )}
        </div>
      );
    }
    return String(raw);
  }

  if (champ.format === "date") {
    return formatDate(String(raw));
  }

  if (champ.format === "badge-confirmation") {
    const confirme = String(raw).toLowerCase() === "confirme" || String(raw).toLowerCase() === "confirmé";
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
        style={{
          background: confirme ? "#E1F5EE" : "#F1EFE8",
          color: confirme ? "#0F6E56" : "#5F5E5A",
          borderRadius: 20,
        }}
      >
        {confirme ? "Confirmé" : "Non confirmé"}
      </span>
    );
  }

  if (champ.format === "tableau-paiements" && isPaiementArray(raw)) {
    return <TableauPaiements paiements={raw} />;
  }

  if (champ.format === "tableau-courriers" && isCourrierArray(raw)) {
    return <TableauCourriers courriers={raw} />;
  }

  if (champ.format === "multi-valeurs" && Array.isArray(raw)) {
    const MAX_VISIBLE = 3;
    const visible = raw.slice(0, MAX_VISIBLE);
    const remaining = raw.length - MAX_VISIBLE;
    return (
      <div className="flex flex-wrap gap-2">
        {visible.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-ink-100 text-ink-700 rounded-md">
            {String(item)}
          </span>
        ))}
        {remaining > 0 && (
          <button className="text-xs text-[#E8590C] hover:underline font-medium">
            +{remaining} Voir plus
          </button>
        )}
      </div>
    );
  }

  if (Array.isArray(raw)) {
    return (
      <div className="flex flex-wrap gap-2">
        {raw.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-ink-100 text-ink-700 rounded-md">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  return String(raw);
}

function Bloc({ bloc, dossier }: { bloc: BlocSchema; dossier: DossierTrade }) {
  const Icone = ICONES[bloc.icone] ?? Info;
  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8590C] border-b border-ink-100 pb-2 mb-4 flex items-center gap-2">
        <Icone size={14} /> {bloc.titre}
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {bloc.champs.map((champ) => (
          <div key={champ.cle}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">{champ.label}</div>
            <div className="text-sm font-medium text-ink-800">{renderValeur(champ, dossier)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvenementsTable({ evenements }: { evenements: DossierTrade["evenements"] }) {
  return (
    <>
      {/* Séparateur visuel */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#E8590C] to-transparent my-6" />
      
      <div className="bg-[#FDF0E8] rounded-xl border-2 border-[#E8590C] shadow-lg p-5">
        <div className="flex items-center justify-between bg-[#E8590C] -mx-5 -mt-5 px-5 py-3 rounded-t-xl mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white flex items-center gap-2">
            <History size={16} /> Événements du dossier
          </div>
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-white text-[#E8590C] rounded-full">{evenements.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-700 bg-white/60">
                <th className="px-3 py-2 rounded-tl-md">Référence</th>
                <th className="px-3 py-2">Nature</th>
                <th className="px-3 py-2 text-right">Montant</th>
                <th className="px-3 py-2">Date de création</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2 rounded-tr-md"></th>
              </tr>
            </thead>
            <tbody>
              {evenements.map((e, idx) => (
                <tr key={e.reference} className={`border-b border-[#E8590C]/20 transition ${idx % 2 === 0 ? 'bg-white/40' : 'bg-white/80'}`}>
                  <td className="px-3 py-2 font-mono text-xs">{e.reference}</td>
                  <td className="px-3 py-2 font-medium text-ink-800">{e.nature}</td>
                  <td className="px-3 py-2 text-right text-ink-700">
                    {e.montant !== null ? formatMontant(e.montant, e.devise) : <span className="text-ink-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-ink-700">{formatDate(e.dateCreation)}</td>
                  <td className="px-3 py-2"><StatutBadge statut={e.statut} /></td>
                  <td className="px-3 py-2 text-right">
                    <button className="text-ink-400 hover:text-[#E8590C] transition">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function DetailDossier({ dossier }: { dossier: DossierTrade }) {
  const schema = getProduitSchema(dossier.produit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Consultation</Link>
        <span>/</span>
        <Link href="/consultation/dossiers" className="hover:text-brand-600">Dossiers Trade</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{dossier.reference}</span>
      </div>

      <DossierHeader dossier={dossier} />

      {dossier.clientInfo && <BandeauClient clientInfo={dossier.clientInfo} />}

      {schema ? (
        <div className="space-y-4">
          {schema.blocs.map((bloc) => (
            <Bloc key={bloc.titre} bloc={bloc} dossier={dossier} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 p-5 text-sm text-ink-500">
          Schéma inconnu pour le produit {dossier.produit}.
        </div>
      )}

      <EvenementsTable evenements={dossier.evenements} />
    </div>
  );
}
