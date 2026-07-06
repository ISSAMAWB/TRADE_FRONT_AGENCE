import Link from "next/link";
import { Building2, Banknote, FileText, Calendar, Info, TrendingUp, History, Eye, Clock, Check, Circle, Diamond, AlertCircle } from "lucide-react";
import StatutBadge from "./StatutBadge";
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

function getTauxChange(devise: string): number | null {
  const taux: Record<string, number> = { EUR: 10.8, USD: 10.05 };
  return devise && devise !== "MAD" ? taux[devise] ?? null : null;
}

function formatContreValeurMAD(montant: number, devise: string): string | null {
  const taux = getTauxChange(devise);
  if (!taux || devise === "MAD") return null;
  const valeur = montant * taux;
  const nombre = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valeur);
  return `≈ ${nombre} MAD (${devise} 1 = ${taux.toFixed(2)} MAD)`;
}

function getBarPct(total: unknown, part: unknown): number {
  const totalOk = isMontantAvecDevise(total) ? total.valeur : typeof total === "number" ? total : 0;
  const partOk = isMontantAvecDevise(part) ? part.valeur : typeof part === "number" ? part : 0;
  if (!totalOk || totalOk <= 0) return 0;
  return Math.min(100, Math.max(0, (partOk / totalOk) * 100));
}

function joursRestants(date: string): number | null {
  const cible = new Date(date);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  cible.setHours(0, 0, 0, 0);
  const diff = cible.getTime() - aujourdhui.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#e8632b] mb-3">{children}</div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[10px] border border-[#e5e8ec] p-4 ${className}`}>{children}</div>
  );
}

function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "blue" | "orange" | "green" | "purple" | "amber" }) {
  const styles = {
    gray: "bg-[#f3f4f6] text-[#4b5563]",
    blue: "bg-[#eef4ff] text-[#2a5bd7]",
    orange: "bg-[#fffaf4] text-[#c2410c] border border-[#f3ddc2]",
    green: "bg-[#e7f6ef] text-[#177a52]",
    purple: "bg-[#f4f1fb] text-[#6d4fc4]",
    amber: "bg-[#fdeee3] text-[#c2410c]",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${styles[color]}`}>
      {children}
    </span>
  );
}

function CarteInfo({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-ink-100 p-3 flex flex-col justify-between h-full">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-500 mb-2 pb-1 border-b border-ink-100">
        {titre}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function ChampCarte({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-0.5">{label}</div>
      <div className="text-[13px] font-medium text-ink-900 leading-tight">{value}</div>
    </div>
  );
}

function BandeauEcheanceV2({
  date,
  dateDebut,
  contexte,
  label,
  labelDebut,
  labelFin,
  isPaiementAVue,
  documentsRecusLe,
}: {
  date: string;
  dateDebut?: string;
  contexte?: string;
  label: string;
  labelDebut: string;
  labelFin: string;
  isPaiementAVue?: boolean;
  documentsRecusLe?: unknown;
}) {
  const jours = date ? joursRestants(date) : null;
  const isAlerte = jours !== null && jours < 15 && jours >= 0;
  const today = new Date().toISOString();

  if (isPaiementAVue) {
    return (
      <div className="bg-[#f4f7fb] border border-dashed border-[#c9d6e6] rounded-[10px] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#eef4ff] flex items-center justify-center text-[#2a5bd7]">
              <AlertCircle size={16} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#0f172a]">Paiement à vue — pas de date d'échéance</div>
              <div className="text-[11px] text-[#64748b]">Le règlement est exigible à la présentation des documents au tiré.</div>
            </div>
          </div>
          {documentsRecusLe && (
            <div className="text-[11px] text-[#64748b]">Documents reçus le {formatDate(String(documentsRecusLe))}</div>
          )}
        </div>
      </div>
    );
  }

  const debut = dateDebut ? new Date(dateDebut) : null;
  const fin = date ? new Date(date) : null;
  const now = new Date();
  const progress = debut && fin ? Math.min(100, Math.max(0, ((now.getTime() - debut.getTime()) / (fin.getTime() - debut.getTime())) * 100)) : 0;

  return (
    <div className={`rounded-[10px] border p-4 ${isAlerte ? "bg-[#fef2f2] border-[#fecaca]" : "bg-[#fffaf4] border-[#f3ddc2]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-[10.5px] font-semibold uppercase tracking-[0.08em] ${isAlerte ? "text-[#dc2626]" : "text-[#c2410c]"}`}>{label}</span>
          {date && (
            <span className={`text-[21px] font-extrabold tabular-nums ${isAlerte ? "text-[#dc2626]" : "text-[#9a3412]"}`}>
              {formatDate(date)}
            </span>
          )}
          {jours !== null && (
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isAlerte ? "bg-[#dc2626] text-white" : "bg-[#f97316] text-white"}`}>
              {jours > 0 ? `dans ${jours} jours` : jours === 0 ? "Aujourd'hui" : "Dépassé"}
            </span>
          )}
        </div>
        {contexte && <div className="text-[12.5px] text-[#0f172a]">{contexte}</div>}
      </div>

      {date && (
        <>
          <div className="relative h-1.5 bg-[#e5e8ec] rounded-full mb-3">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2a9d6f] to-[#f97316]"
              style={{ width: `${progress}%` }}
            />
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isAlerte ? "bg-[#dc2626]" : "bg-[#f97316]"}`}
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#64748b]">
            <span>{labelDebut} · {dateDebut ? formatDate(dateDebut) : "—"}</span>
            <span className={`font-semibold ${isAlerte ? "text-[#dc2626]" : "text-[#f97316]"}`}>Aujourd'hui · {formatDate(today)}</span>
            <span>{labelFin} · {formatDate(date)}</span>
          </div>
        </>
      )}
    </div>
  );
}

function EvenementsTableV2({ evenements }: { evenements: DossierTrade["evenements"] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#e8632b] flex items-center gap-2">
          Événements du dossier
        </div>
        <span className="bg-[#0f172a] text-white px-2 py-0.5 rounded-full text-[11px] font-medium">
          {evenements.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e5e8ec]">
              <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Référence</th>
              <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Nature</th>
              <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant</th>
              <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de création</th>
              <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Statut</th>
              <th className="text-left py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {evenements.map((e) => (
              <tr key={e.reference} className="border-b border-[#e5e8ec] hover:bg-[#f8fafc] transition-colors cursor-pointer">
                <td className="py-[9px] px-3 font-mono text-[11px] text-[#64748b]">{e.reference}</td>
                <td className="py-[9px] px-3 font-semibold text-[#0f172a]">{e.nature}</td>
                <td className="py-[9px] px-3 text-right font-mono text-[#0f172a] tabular-nums">
                  {e.montant !== null ? formatMontant(e.montant, e.devise) : <span className="text-[#94a3b8]">—</span>}
                </td>
                <td className="py-[9px] px-3 text-[#64748b]">{formatDate(e.dateCreation)}</td>
                <td className="py-[9px] px-3">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    e.statut === "VALIDE" ? "bg-[#e6f6ee] text-[#177a52]" :
                    e.statut === "EN_COURS" ? "bg-[#eef4ff] text-[#2a5bd7]" :
                    e.statut === "EN_ATTENTE" ? "bg-[#fef3e2] text-[#b45309]" :
                    "bg-[#f3f4f6] text-[#64748b]"
                  }`}>
                    {e.statut === "VALIDE" ? "Validé" :
                     e.statut === "EN_COURS" ? "En cours" :
                     e.statut === "EN_ATTENTE" ? "En attente" : e.statut}
                  </span>
                </td>
                <td className="py-[9px] px-3 text-right">
                  <button className="text-[#94a3b8] hover:text-[#e8632b] transition">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function DetailILCIRD({ dossier }: { dossier: DossierTrade }) {
  const isILC = dossier.produit === "ILC";
  const isIRD = dossier.produit === "IRD";
  const client = dossier.clientInfo;

  const montantPrincipal = isILC ? dossier.donnees["montantCredit"] : dossier.donnees["montantRemise"];
  const montantPrincipalOk = isMontantAvecDevise(montantPrincipal) ? montantPrincipal : null;

  const dateEcheance = isIRD ? dossier.donnees["dateEcheance"] : null;
  const dateExpiration = isILC ? dossier.donnees["dateExpiration"] : null;
  const dateEcheanceOuExpiration = String(dateEcheance || dateExpiration || "");
  const jours = dateEcheanceOuExpiration ? joursRestants(dateEcheanceOuExpiration) : null;
  const isAlerte = jours !== null && jours < 15 && jours >= 0;

  const conditionsRemise = dossier.donnees["conditionsRemiseDocuments"];
  const isPaiementAVue = isIRD && String(conditionsRemise).toLowerCase().includes("vue");
  const isContreAcceptation = isIRD && String(conditionsRemise).toLowerCase().includes("acceptation");

  const modeRealisation = dossier.donnees["modeRealisation"];
  const isSightPayment = isILC && String(modeRealisation).toLowerCase().includes("vue");
  const isAcceptation = isILC && String(modeRealisation).toLowerCase().includes("acceptation");

  const confirmation = dossier.donnees["creditConfirme"];
  const isConfirme = isILC && String(confirmation).toLowerCase() === "confirmé";
  const isUnconfirmed = isILC && !isConfirme;

  const dateEmission = dossier.donnees["dateEmission"] || dossier.dateMiseAJour;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex justify-between items-start">
              <div>
                <Link href="/consultation/dossiers" className="text-xs text-[#64748b] hover:text-[#e8632b] flex items-center gap-1 mb-2">
                  ‹ Retour à la liste
                </Link>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11.5px] text-[#64748b]">{isILC ? "ILC · Import" : "IRD · Import"}</span>
                  {isILC && (
                    <>
                      <Badge color={isConfirme ? "green" : "purple"}>
                        {isConfirme ? <Check size={11} /> : <Circle size={11} />}
                        {isConfirme ? "Confirmed" : "Unconfirmed"}
                      </Badge>
                      <Badge color={isSightPayment ? "blue" : "amber"}>
                        {isSightPayment ? <Diamond size={11} /> : <Clock size={11} />}
                        {isSightPayment ? "Sight Payment" : "Acceptation"}
                      </Badge>
                    </>
                  )}
                  {isIRD && (
                    <Badge color={isContreAcceptation ? "amber" : "blue"}>
                      {isContreAcceptation ? <Clock size={11} /> : <Diamond size={11} />}
                      {isContreAcceptation ? "Contre acceptation" : "Paiement à vue"}
                    </Badge>
                  )}
                  <Badge color="blue">En cours</Badge>
                </div>
                <h1 className="text-[19px] font-bold text-[#0f172a] leading-tight">
                  {dossier.produitLibelle} <span className="font-mono text-[#64748b] font-normal">{dossier.reference}</span>
                </h1>
                <div className="text-[11.5px] text-[#64748b] mt-1">
                  {String(dossier.donnees["natureOperation"] || "Opération commerciale")}
                  {dossier.donnees["referenceCorrespondant"] && (
                    <span> · Réf. correspondant {String(dossier.donnees["referenceCorrespondant"])}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#e5e8ec] mt-4 pt-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#94a3b8]">
                    {isILC ? "Montant du crédit" : "Montant de la remise"}
                  </div>
                  <div className="text-[28px] font-extrabold text-[#0f172a] tabular-nums leading-tight">
                    {montantPrincipalOk ? formatMontant(montantPrincipalOk.valeur, montantPrincipalOk.devise) : "—"}
                  </div>
                  {montantPrincipalOk && (
                    <div className="text-[11px] text-[#64748b]">
                      {isILC ? `Tolérance ${dossier.donnees["tolerance"] || "—"}` : `Frais Maroc : ${dossier.donnees["fraisAuMaroc"] || "—"} · Étranger : ${dossier.donnees["fraisAEtranger"] || "—"}`}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="h-[10px] rounded-[6px] overflow-hidden flex">
                    {isILC ? (
                      <>
                        <div
                          className="h-full bg-[#e8632b]"
                          style={{ width: `${getBarPct(dossier.donnees["montantCredit"], dossier.donnees["montantReclame"])}%` }}
                        />
                        <div className="h-full bg-[#2a9d6f] flex-1" />
                      </>
                    ) : (
                      <>
                        <div
                          className="h-full bg-[#2a9d6f]"
                          style={{ width: `${getBarPct(dossier.donnees["montantRemise"], dossier.donnees["montantRegle"])}%` }}
                        />
                        <div className="h-full bg-[#e8632b] flex-1" />
                      </>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] mt-2">
                    {isILC ? (
                      <>
                        <span className="flex items-center gap-1 text-[#e8632b]">
                          <span className="w-2 h-2 rounded-full bg-[#e8632b]" />
                          Réclamé {isMontantAvecDevise(dossier.donnees["montantReclame"]) ? formatMontant(dossier.donnees["montantReclame"].valeur, dossier.donnees["montantReclame"].devise) : "—"}
                        </span>
                        <span className="flex items-center gap-1 text-[#2a9d6f]">
                          <span className="w-2 h-2 rounded-full bg-[#2a9d6f]" />
                          Disponible {isMontantAvecDevise(dossier.donnees["montantDisponible"]) ? formatMontant(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise) : "—"}
                          {isMontantAvecDevise(dossier.donnees["montantDisponible"]) && formatContreValeurMAD(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise) && (
                            <span className="text-[#94a3b8] ml-1">≈ {formatContreValeurMAD(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise)}</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-[#2a9d6f]">
                          <span className="w-2 h-2 rounded-full bg-[#2a9d6f]" />
                          Réglé {isMontantAvecDevise(dossier.donnees["montantRegle"]) ? formatMontant(dossier.donnees["montantRegle"].valeur, dossier.donnees["montantRegle"].devise) : "—"}
                        </span>
                        <span className="flex items-center gap-1 text-[#e8632b]">
                          <span className="w-2 h-2 rounded-full bg-[#e8632b]" />
                          Encours {isMontantAvecDevise(dossier.donnees["encours"]) ? formatMontant(dossier.donnees["encours"].valeur, dossier.donnees["encours"].devise) : "—"}
                          {isMontantAvecDevise(dossier.donnees["encours"]) && formatContreValeurMAD(dossier.donnees["encours"].valeur, dossier.donnees["encours"].devise) && (
                            <span className="text-[#94a3b8] ml-1">≈ {formatContreValeurMAD(dossier.donnees["encours"].valeur, dossier.donnees["encours"].devise)}</span>
                          )}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <BandeauEcheanceV2
            date={dateEcheanceOuExpiration}
            dateDebut={dateEmission ? String(dateEmission) : undefined}
            contexte={isILC ? String(dossier.donnees["lieuExpiration"] || "") : String(conditionsRemise || "")}
            label={isILC ? "DATE D'EXPIRATION" : "DATE D'ÉCHÉANCE"}
            labelDebut={isILC ? "Émission" : "Ouverture"}
            labelFin={isILC ? "Expiration" : "Échéance"}
            isPaiementAVue={isPaiementAVue}
            documentsRecusLe={isIRD ? dossier.donnees["dateReceptionDocuments"] : undefined}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <SectionLabel>Parties impliquées</SectionLabel>
              <div className="space-y-4">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">{client?.raisonSociale || String(dossier.donnees[isILC ? "donneurOrdre" : "client"] || "—")}</div>
                  <div className="text-[11px] text-[#64748b]">Client · {isILC ? "Donneur d'ordre" : "Tiré"}</div>
                  <div className="text-[12px] font-mono text-[#0f172a]">{client?.numeroCompte || "—"}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Bénéficiaire" : "Tireur"}</div>
                  <div className="text-[13px] font-medium text-[#0f172a]">{String(dossier.donnees[isILC ? "beneficiaire" : "tireur"] || "—")}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Banque notificatrice" : "Partie remettante"}</div>
                  <div className="text-[13px] font-medium text-[#0f172a]">{String(dossier.donnees[isILC ? "banqueNotification" : "partieRemettante"] || "—")}</div>
                </div>
              </div>
            </Card>

            <Card>
              <SectionLabel>Informations financières</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Montant du crédit" : "Montant de la remise"}</div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">
                    {montantPrincipalOk ? formatMontant(montantPrincipalOk.valeur, montantPrincipalOk.devise) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Tolérance" : "Encours"}</div>
                  <div className={`text-[13px] font-semibold ${isILC ? "text-[#0f172a]" : "text-[#e8632b]"}`}>
                    {isILC ? String(dossier.donnees["tolerance"] || "—") : (isMontantAvecDevise(dossier.donnees["encours"]) ? formatMontant(dossier.donnees["encours"].valeur, dossier.donnees["encours"].devise) : "—")}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Montant réclamé" : "Contre-valeur MAD"}</div>
                  <div className={`text-[13px] font-semibold ${isILC ? "text-[#e8632b]" : "text-[#0f172a]"}`}>
                    {isILC
                      ? (isMontantAvecDevise(dossier.donnees["montantReclame"]) ? formatMontant(dossier.donnees["montantReclame"].valeur, dossier.donnees["montantReclame"].devise) : "—")
                      : (montantPrincipalOk && formatContreValeurMAD(montantPrincipalOk.valeur, montantPrincipalOk.devise) ? formatContreValeurMAD(montantPrincipalOk.valeur, montantPrincipalOk.devise) : "—")}
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Montant disponible" : "Frais au Maroc"}</div>
                  <div className={`text-[13px] font-semibold ${isILC ? "text-[#2a9d6f]" : "text-[#0f172a]"}`}>
                    {isILC
                      ? (isMontantAvecDevise(dossier.donnees["montantDisponible"]) ? formatMontant(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise) : "—")
                      : String(dossier.donnees["fraisAuMaroc"] || "—")}
                  </div>
                </div>
                {isILC && (
                  <div className="sm:col-span-2">
                    <div className="text-[11.5px] text-[#94a3b8] mb-1">Contre-valeur MAD</div>
                    <div className="text-[13px] font-semibold text-[#0f172a]">
                      {isMontantAvecDevise(dossier.donnees["montantDisponible"]) && formatContreValeurMAD(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise)
                        ? formatContreValeurMAD(dossier.donnees["montantDisponible"].valeur, dossier.donnees["montantDisponible"].devise)
                        : "—"}
                    </div>
                  </div>
                )}
                {!isILC && (
                  <div>
                    <div className="text-[11.5px] text-[#94a3b8] mb-1">Frais à l'étranger</div>
                    <div className="text-[13px] font-semibold text-[#0f172a]">{String(dossier.donnees["fraisAEtranger"] || "—")}</div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div>
          <Card className="border-l-[3px] border-l-[#e8632b] h-full">
            <SectionLabel>Caractéristiques de l'opération</SectionLabel>
            <div className="space-y-4">
              <div>
                <div className="text-[11.5px] text-[#94a3b8] mb-1">Réf. de l'opération</div>
                <div className="text-[13px] font-medium text-[#0f172a] font-mono">{String(dossier.donnees["referenceOperation"] || "—")}</div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Réf. correspondant" : "Autre référence"}</div>
                <div className="text-[13px] font-medium text-[#0f172a] font-mono">
                  {String(dossier.donnees[isILC ? "referenceCorrespondant" : "autreReference"] || "—")}
                </div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#94a3b8] mb-1">Type d'opération</div>
                <div className="text-[13px] font-medium text-[#0f172a]">{String(dossier.donnees["natureOperation"] || "Opération commerciale")}</div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Mode de réalisation" : "Conditions de remise"}</div>
                <div className="text-[13px] font-medium text-[#0f172a]">{String(isILC ? modeRealisation : conditionsRemise || "—")}</div>
              </div>
              <div>
                <div className="text-[11.5px] text-[#94a3b8] mb-1">{isILC ? "Nature de la confirmation" : "Échéance"}</div>
                <div className={`text-[13px] font-semibold ${isILC ? (isConfirme ? "text-[#177a52]" : "text-[#6d4fc4]") : "text-[#0f172a]"}`}>
                  {isILC ? (isConfirme ? "Confirmed" : "Unconfirmed") : (dateEcheance ? formatDate(String(dateEcheance)) : "—")}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EvenementsTableV2 evenements={dossier.evenements} />
    </div>
  );
}

function DetailERD({ dossier }: { dossier: DossierTrade }) {
  const montantRemise = dossier.donnees["montantRemise"];
  const encours = dossier.donnees["encours"];
  const typeFrais = dossier.donnees["typeFrais"];
  const conditionsRemise = dossier.donnees["conditionsRemiseDocuments"];
  const dateEcheance = dossier.donnees["dateEcheance"];
  const referencesCourrier = dossier.donnees["referencesCourrier"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CarteInfo titre="Montant & Frais">
          <div className="space-y-2">
            <ChampCarte label="Montant de la remise" value={isMontantAvecDevise(montantRemise) ? formatMontant(montantRemise.valeur, montantRemise.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Encours" value={isMontantAvecDevise(encours) ? formatMontant(encours.valeur, encours.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Type de frais" value={typeFrais ? String(typeFrais) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Conditions & Échéance">
          <div className="space-y-2">
            <ChampCarte label="Conditions de remise" value={conditionsRemise ? String(conditionsRemise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Date d'échéance" value={dateEcheance ? formatDate(String(dateEcheance)) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Références">
          <div className="space-y-2">
            <ChampCarte label="Référence" value={dossier.donnees["referenceOperation"] ? String(dossier.donnees["referenceOperation"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Autre référence" value={dossier.donnees["autreReference"] ? String(dossier.donnees["autreReference"]) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Parties impliquées">
          <div className="space-y-2">
            <ChampCarte label="Tireur" value={dossier.donnees["client"] ? String(dossier.donnees["client"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Tiré" value={dossier.donnees["tire"] ? String(dossier.donnees["tire"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Banque d'encaissement" value={dossier.donnees["partieRemettante"] ? String(dossier.donnees["partieRemettante"]) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>
      </div>

      {referencesCourrier && isCourrierArray(referencesCourrier) && referencesCourrier.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CarteInfo titre="Références de courrier">
            <TableauCourriers courriers={referencesCourrier} />
          </CarteInfo>
        </div>
      )}

      <EvenementsTable evenements={dossier.evenements} />
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
    <div className="bg-[#f6f7f9] min-h-screen py-6">
      <div className="max-w-[1240px] mx-auto space-y-4">
        <div className="flex items-center gap-2 text-xs text-[#64748b]">
          <Link href="/" className="hover:text-[#e8632b]">Consultation</Link>
          <span>/</span>
          <Link href="/consultation/dossiers" className="hover:text-[#e8632b]">Dossiers Trade</Link>
          <span>/</span>
          <span className="text-[#0f172a] font-medium font-mono">{dossier.reference}</span>
        </div>

        {schema ? (
          dossier.produit === "IRD" || dossier.produit === "ILC" ? (
            <DetailILCIRD dossier={dossier} />
          ) : dossier.produit === "ERD" ? (
            <DetailERD dossier={dossier} />
          ) : (
            <DetailsDossierBloc blocs={schema.blocs} dossier={dossier} />
          )
        ) : (
          <div className="bg-white rounded-xl border border-[#e5e8ec] p-5 text-sm text-[#64748b]">
            Schéma inconnu pour le produit {dossier.produit}.
          </div>
        )}
      </div>
    </div>
  );
}
