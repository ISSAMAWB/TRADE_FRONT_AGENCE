import Link from "next/link";
import { Building2, Banknote, FileText, Calendar, Info, TrendingUp, History, Eye } from "lucide-react";
import DossierHeader from "./DossierHeader";
import StatutBadge from "./StatutBadge";
import BandeauClient from "./BandeauClient";
import { getProduitSchema } from "@/lib/produits";
import type { DossierTrade, BlocSchema, ChampSchema, MontantAvecDevise, Paiement, Courrier, ProduitCode } from "@/domain/consultation-detail";

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
        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-brand-500 text-white rounded-md">
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
      return <span className="font-medium text-brand-500">{formatMontant(raw.valeur, raw.devise)}</span>;
    }
    if (typeof raw === "number") {
      return <span className="font-medium text-brand-500">{formatMontant(raw, "")}</span>;
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
      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md ${confirme ? "bg-green-100 text-green-800" : "bg-ink-100 text-ink-700"}`}>
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
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-ink-50 text-ink-700 border border-ink-200 rounded-lg">
            {String(item)}
          </span>
        ))}
        {remaining > 0 && (
          <button className="text-xs text-brand-500 hover:underline font-medium">
            +{remaining} Voir plus
          </button>
        )}
      </div>
    );
  }

  if (champ.format === "multi-valeurs-ird" && Array.isArray(raw)) {
    const MAX_VISIBLE = 3;
    const visible = raw.slice(0, MAX_VISIBLE);
    const remaining = raw.length - MAX_VISIBLE;
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {visible.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-ink-50 text-ink-700 border border-ink-200 rounded-lg">
            {String(item)}
          </span>
        ))}
        {remaining > 0 && (
          <button className="text-sm text-brand-500 hover:underline font-medium px-1">
            ...
          </button>
        )}
      </div>
    );
  }

  if (Array.isArray(raw)) {
    return (
      <div className="flex flex-wrap gap-2">
        {raw.map((item, idx) => (
          <span key={idx} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-ink-50 text-ink-700 border border-ink-200 rounded-lg">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  return String(raw);
}

function SectionHeader({ titre, icone }: { titre: string; icone: string }) {
  const Icone = ICONES[icone] ?? Info;
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-[30px] h-[30px] rounded-lg bg-brand-100/40 flex items-center justify-center">
        <Icone size={16} className="text-brand-500" />
      </div>
      <span className="text-xs font-medium uppercase tracking-[0.06em] text-ink-900">{titre}</span>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium uppercase tracking-[0.05em] text-ink-500 mb-1">{children}</div>
  );
}

function FieldValue({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[15px] font-medium text-ink-900 leading-snug">{children}</div>
  );
}

function Field({ champ, dossier }: { champ: ChampSchema; dossier: DossierTrade }) {
  return (
    <div className="min-w-0">
      <FieldLabel>{champ.label}</FieldLabel>
      <FieldValue>{renderValeur(champ, dossier)}</FieldValue>
    </div>
  );
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-x-5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
      {children}
    </div>
  );
}

function PastilleEcheance({ date }: { date: string }) {
  const expiration = new Date(date);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  expiration.setHours(0, 0, 0, 0);
  const diff = expiration.getTime() - aujourdhui.getTime();
  const jours = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (jours < 0) {
    return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800">Expiré</span>;
  }
  if (jours < 30) {
    return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">J-{jours}</span>;
  }
  return null;
}

function BarreConsommation({ montantCredit, montantDisponible, devise }: { montantCredit: number; montantDisponible: number; devise: string }) {
  if (!montantCredit || montantCredit <= 0) return null;
  const consomme = Math.max(0, montantCredit - montantDisponible);
  const pctConsomme = Math.min(100, Math.max(0, Math.round((consomme / montantCredit) * 100)));
  const pctDisponible = Math.max(0, 100 - pctConsomme);
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-ink-500 mb-1.5">
        <span className="uppercase tracking-[0.05em]">Consommation du crédit</span>
        <span>{pctDisponible} % disponible · {formatMontant(consomme, devise)} utilisés</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100 border border-ink-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pctConsomme}%` }}
        />
      </div>
    </div>
  );
}

function CarteStat({ label, valeur, devise, accent = false, subtext }: { label: string; valeur: number; devise: string; accent?: boolean; subtext?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? "border-brand-200 bg-brand-50/30" : "border-ink-200 bg-ink-50/50"}`}>
      <div className="text-xs font-medium uppercase tracking-[0.05em] text-ink-500 mb-1">{label}</div>
      <div className={`text-[22px] font-medium leading-tight ${accent ? "text-brand-500" : "text-ink-900"}`}>
        {formatMontant(valeur, devise)}
      </div>
      {subtext && <div className="text-xs text-ink-500 mt-1">{subtext}</div>}
    </div>
  );
}

function BlocFinancierILC({ dossier }: { dossier: DossierTrade }) {
  const credit = dossier.donnees["montantCredit"];
  const disponible = dossier.donnees["montantDisponible"];
  const reclame = dossier.donnees["montantReclame"];
  const attente = dossier.donnees["montantEnAttente"];
  const tolerance = dossier.donnees["tolerance"];
  const typeFrais = dossier.donnees["typeFrais"];

  const creditOk = isMontantAvecDevise(credit) ? credit : null;
  const disponibleOk = isMontantAvecDevise(disponible) ? disponible : null;
  const reclameOk = isMontantAvecDevise(reclame) ? reclame : null;

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-5">
      <SectionHeader titre="Informations financières" icone="Banknote" />
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {creditOk && <CarteStat label="Montant du crédit" valeur={creditOk.valeur} devise={creditOk.devise} />}
        {disponibleOk && <CarteStat label="Montant disponible" valeur={disponibleOk.valeur} devise={disponibleOk.devise} accent />}
        {reclameOk && (
          <CarteStat
            label="Montant réclamé"
            valeur={reclameOk.valeur}
            devise={reclameOk.devise}
            subtext={isMontantAvecDevise(attente) ? `Dont ${formatMontant(attente.valeur, attente.devise)} en attente` : undefined}
          />
        )}
      </div>
      {creditOk && disponibleOk && (
        <BarreConsommation montantCredit={creditOk.valeur} montantDisponible={disponibleOk.valeur} devise={creditOk.devise} />
      )}
      <div className="mt-4 grid gap-x-5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {tolerance !== undefined && tolerance !== null && tolerance !== "" && (
          <div className="min-w-0">
            <FieldLabel>Tolérance</FieldLabel>
            <FieldValue>{String(tolerance)}</FieldValue>
          </div>
        )}
        {typeFrais !== undefined && typeFrais !== null && typeFrais !== "" && (
          <div className="min-w-0">
            <FieldLabel>Type de frais</FieldLabel>
            <FieldValue>{String(typeFrais)}</FieldValue>
          </div>
        )}
      </div>
    </div>
  );
}

function BlocFinancierIRD({ dossier }: { dossier: DossierTrade }) {
  const montantRemise = dossier.donnees["montantRemise"];
  const encours = dossier.donnees["encours"];
  const fraisAuMaroc = dossier.donnees["fraisAuMaroc"];
  const fraisAEtranger = dossier.donnees["fraisAEtranger"];

  const showRemise = isMontantAvecDevise(montantRemise);
  const showEncours = isMontantAvecDevise(encours);
  const showFraisMaroc = fraisAuMaroc !== undefined && fraisAuMaroc !== null && fraisAuMaroc !== "";
  const showFraisEtranger = fraisAEtranger !== undefined && fraisAEtranger !== null && fraisAEtranger !== "";

  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-5">
      <SectionHeader titre="Informations financières" icone="Banknote" />
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-3">
        {showRemise && (
          <div className="min-w-0">
            <FieldLabel>Montant de la remise</FieldLabel>
            <FieldValue>{formatMontant(montantRemise.valeur, montantRemise.devise)}</FieldValue>
          </div>
        )}
        {showEncours && (
          <div className="min-w-0">
            <FieldLabel>Encours</FieldLabel>
            <FieldValue>{formatMontant(encours.valeur, encours.devise)}</FieldValue>
          </div>
        )}
        {showFraisMaroc && (
          <div className="min-w-0">
            <FieldLabel>Frais au Maroc</FieldLabel>
            <FieldValue>{String(fraisAuMaroc)}</FieldValue>
          </div>
        )}
        {showFraisEtranger && (
          <div className="min-w-0 md:col-start-3">
            <FieldLabel>Frais à l'étranger</FieldLabel>
            <FieldValue>{String(fraisAEtranger)}</FieldValue>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailsDossierBloc({ blocs, dossier }: { blocs: BlocSchema[]; dossier: DossierTrade }) {
  return (
    <div className="space-y-4">
      {blocs.map((bloc) => {
        if (dossier.produit === "ILC" && bloc.titre === "Informations financières") {
          return <BlocFinancierILC key={bloc.titre} dossier={dossier} />;
        }
        if (dossier.produit === "IRD" && bloc.titre === "Informations financières") {
          return <BlocFinancierIRD key={bloc.titre} dossier={dossier} />;
        }
        return (
          <div key={bloc.titre} className="rounded-xl border border-ink-100 bg-ink-50/50 p-5">
            <SectionHeader titre={bloc.titre} icone={bloc.icone} />
            <FieldGrid>
              {bloc.champs.map((champ) => {
                if (champ.cle === "dateExpiration" && (dossier.produit === "ILC" || dossier.produit === "ELC")) {
                  const raw = dossier.donnees[champ.cle];
                  return (
                    <div key={champ.cle} className="min-w-0">
                      <FieldLabel>{champ.label}</FieldLabel>
                      <FieldValue>
                        <span className="inline-flex items-center gap-2">
                          {raw ? formatDate(String(raw)) : <span className="text-ink-300">—</span>}
                          {typeof raw === "string" && <PastilleEcheance date={raw} />}
                        </span>
                      </FieldValue>
                    </div>
                  );
                }
                return <Field key={champ.cle} champ={champ} dossier={dossier} />;
              })}
            </FieldGrid>
          </div>
        );
      })}
    </div>
  );
}

function EvenementsTable({ evenements }: { evenements: DossierTrade["evenements"] }) {
  return (
    <div className="bg-gradient-to-br from-white via-brand-50/30 to-brand-50/20 rounded-xl border border-ink-100 p-5 shadow-card">
      <div className="flex items-center justify-between border-b-2 border-ink-200 pb-3 mb-5">
        <div className="text-sm font-medium uppercase tracking-wider text-brand-500 flex items-center gap-2">
          <History size={16} /> Événements du dossier
        </div>
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium bg-ink-900 text-white rounded-full">{evenements.length}</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 bg-ink-50">
              <th className="px-3 py-2 rounded-tl-md">Référence</th>
              <th className="px-3 py-2">Nature</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2">Date de création</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 rounded-tr-md"></th>
            </tr>
          </thead>
          <tbody>
            {evenements.map((e) => (
              <tr key={e.reference} className="border-b border-ink-100 transition">
                <td className="px-3 py-2 font-mono text-xs">{e.reference}</td>
                <td className="px-3 py-2 font-medium text-ink-800">{e.nature}</td>
                <td className="px-3 py-2 text-right text-ink-700">
                  {e.montant !== null ? formatMontant(e.montant, e.devise) : <span className="text-ink-300">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-ink-700">{formatDate(e.dateCreation)}</td>
                <td className="px-3 py-2"><StatutBadge statut={e.statut} /></td>
                <td className="px-3 py-2 text-right">
                  <button className="text-ink-400 hover:text-brand-500 transition">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
        <DetailsDossierBloc blocs={schema.blocs} dossier={dossier} />
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 p-5 text-sm text-ink-500">
          Schéma inconnu pour le produit {dossier.produit}.
        </div>
      )}

      <EvenementsTable evenements={dossier.evenements} />
    </div>
  );
}
