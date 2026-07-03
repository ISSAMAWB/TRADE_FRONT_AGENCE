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

function DetailILC({ dossier }: { dossier: DossierTrade }) {
  const montantCredit = dossier.donnees["montantCredit"];
  const montantDisponible = dossier.donnees["montantDisponible"];
  const montantReclame = dossier.donnees["montantReclame"];
  const tolerance = dossier.donnees["tolerance"];
  const typeFrais = dossier.donnees["typeFrais"];
  const dateExpiration = dossier.donnees["dateExpiration"];
  const lieuExpiration = dossier.donnees["lieuExpiration"];
  const titresImportation = dossier.donnees["referencesTitresImportation"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <CarteInfo titre="Montant & Frais">
          <div className="space-y-2">
            <ChampCarte label="Montant du crédit" value={isMontantAvecDevise(montantCredit) ? formatMontant(montantCredit.valeur, montantCredit.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Montant disponible" value={isMontantAvecDevise(montantDisponible) ? formatMontant(montantDisponible.valeur, montantDisponible.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Montant réclamé" value={isMontantAvecDevise(montantReclame) ? formatMontant(montantReclame.valeur, montantReclame.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Tolérance" value={tolerance ? String(tolerance) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Type de frais" value={typeFrais ? String(typeFrais) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Expiration">
          <div className="space-y-2">
            <ChampCarte label="Date d'expiration" value={dateExpiration ? formatDate(String(dateExpiration)) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Lieu d'expiration" value={lieuExpiration ? String(lieuExpiration) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Références">
          <div className="space-y-2">
            <ChampCarte label="Référence de l'opération" value={dossier.donnees["referenceOperation"] ? String(dossier.donnees["referenceOperation"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Mode de réalisation" value={dossier.donnees["modeRealisation"] ? String(dossier.donnees["modeRealisation"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Nature de l'opération" value={dossier.donnees["natureOperation"] ? String(dossier.donnees["natureOperation"]) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>

        <CarteInfo titre="Parties impliquées">
          <div className="space-y-2">
            <ChampCarte label="Donneur d'ordre" value={dossier.donnees["donneurOrdre"] ? String(dossier.donnees["donneurOrdre"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Bénéficiaire" value={dossier.donnees["beneficiaire"] ? String(dossier.donnees["beneficiaire"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Banque de notification" value={dossier.donnees["banqueNotification"] ? String(dossier.donnees["banqueNotification"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Banque de confirmation" value={dossier.donnees["banqueConfirmation"] ? String(dossier.donnees["banqueConfirmation"]) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>
      </div>

      {titresImportation && Array.isArray(titresImportation) && titresImportation.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          <CarteInfo titre="Titres d'importation">
            <div className="flex flex-wrap gap-1.5 items-center">
              {titresImportation.slice(0, 3).map((item, idx) => (
                <span key={idx} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-ink-50 text-ink-700 border border-ink-200 rounded-md">
                  {String(item)}
                </span>
              ))}
              {titresImportation.length > 3 && (
                <button className="text-xs text-brand-500 hover:underline font-medium px-1">...</button>
              )}
            </div>
          </CarteInfo>
        </div>
      )}

      <EvenementsTable evenements={dossier.evenements} />
    </div>
  );
}

function DetailERD({ dossier }: { dossier: DossierTrade }) {
  const montantRemise = dossier.donnees["montantRemise"];
  const encours = dossier.donnees["encours"];
  const typeFrais = dossier.donnees["typeFrais"];
  const referencesCourrier = dossier.donnees["referencesCourrier"];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <div className="bg-white rounded-lg border border-[#e5e8ec] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#e8632b] mb-3">Montant & frais</div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#94a3b8]">Remise</span>
              <span className="text-[12.5px] font-medium text-ink-900 tabular-nums">{isMontantAvecDevise(montantRemise) ? formatMontant(montantRemise.valeur, montantRemise.devise) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#94a3b8]">Encours</span>
              <span className="text-[12.5px] font-medium text-ink-900 tabular-nums">{isMontantAvecDevise(encours) ? formatMontant(encours.valeur, encours.devise) : "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#94a3b8]">Type de frais</span>
              <span className="text-[12.5px] font-medium text-ink-900">{typeFrais ? String(typeFrais) : "—"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e8ec] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#e8632b] mb-3">Client</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Raison sociale</div>
              <div className="text-[12.5px] font-medium text-ink-900">{dossier.clientInfo?.raisonSociale || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">N° de compte</div>
              <div className="text-[12.5px] font-medium text-ink-900 font-mono">{dossier.clientInfo?.numeroCompte || "—"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e8ec] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#e8632b] mb-3">Parties</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Tireur</div>
              <div className="text-[12.5px] font-medium text-ink-900">{dossier.donnees["client"] ? String(dossier.donnees["client"]) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Tiré</div>
              <div className="text-[12.5px] font-medium text-ink-900">{dossier.donnees["tire"] ? String(dossier.donnees["tire"]) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Banque d'encaissement</div>
              <div className="text-[12.5px] font-medium text-ink-900">{dossier.donnees["partieRemettante"] ? String(dossier.donnees["partieRemettante"]) : "—"}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-[#e5e8ec] p-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#e8632b] mb-3">Références</div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Référence</div>
              <div className="text-[12.5px] font-medium text-ink-900 font-mono">{dossier.donnees["referenceOperation"] ? String(dossier.donnees["referenceOperation"]) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] mb-1">Autre référence</div>
              <div className="text-[12.5px] font-medium text-ink-900 font-mono">{dossier.donnees["autreReference"] ? String(dossier.donnees["autreReference"]) : "—"}</div>
            </div>
            {referencesCourrier && isCourrierArray(referencesCourrier) && referencesCourrier.length > 0 && (
              <div>
                <div className="text-xs text-[#94a3b8] mb-1">Réf. courrier</div>
                <div className="text-[12.5px] font-medium text-ink-900">{referencesCourrier.length} courrier(s)</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <EvenementsTable evenements={dossier.evenements} />
    </div>
  );
}

function DetailIRD({ dossier }: { dossier: DossierTrade }) {
  const montantRemise = dossier.donnees["montantRemise"];
  const encours = dossier.donnees["encours"];
  const fraisAuMaroc = dossier.donnees["fraisAuMaroc"];
  const fraisAEtranger = dossier.donnees["fraisAEtranger"];
  const conditionsRemise = dossier.donnees["conditionsRemiseDocuments"];
  const dateEcheance = dossier.donnees["dateEcheance"];
  const titresImportation = dossier.donnees["referencesTitresImportation"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CarteInfo titre="Montant & Frais">
          <div className="space-y-2">
            <ChampCarte label="Montant de la remise" value={isMontantAvecDevise(montantRemise) ? formatMontant(montantRemise.valeur, montantRemise.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Encours" value={isMontantAvecDevise(encours) ? formatMontant(encours.valeur, encours.devise) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Frais au Maroc" value={fraisAuMaroc ? String(fraisAuMaroc) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Frais à l'étranger" value={fraisAEtranger ? String(fraisAEtranger) : <span className="text-ink-300">—</span>} />
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
            <ChampCarte label="Tiré" value={dossier.donnees["client"] ? String(dossier.donnees["client"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Tireur" value={dossier.donnees["tireur"] ? String(dossier.donnees["tireur"]) : <span className="text-ink-300">—</span>} />
            <ChampCarte label="Partie remettante" value={dossier.donnees["partieRemettante"] ? String(dossier.donnees["partieRemettante"]) : <span className="text-ink-300">—</span>} />
          </div>
        </CarteInfo>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CarteInfo titre="Titres d'importation">
          {(() => {
            if (!Array.isArray(titresImportation) || titresImportation.length === 0) return <span className="text-ink-300">—</span>;
            const MAX_VISIBLE = 3;
            const visible = titresImportation.slice(0, MAX_VISIBLE);
            const remaining = titresImportation.length - MAX_VISIBLE;
            return (
              <div className="flex flex-wrap gap-1.5 items-center">
                {visible.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-ink-50 text-ink-700 border border-ink-200 rounded-md">
                    {String(item)}
                  </span>
                ))}
                {remaining > 0 && (
                  <button className="text-xs text-brand-500 hover:underline font-medium px-1">...</button>
                )}
              </div>
            );
          })()}
        </CarteInfo>
      </div>

      <EvenementsTable evenements={dossier.evenements} />
    </div>
  );
}

function EvenementsTable({ evenements }: { evenements: DossierTrade["evenements"] }) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e8ec] p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-[#e8632b] flex items-center gap-2">
          Événements
        </div>
        <span className="bg-ink-900 text-white px-2 py-0.5 rounded-full text-xs font-medium">
          {evenements.length}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e5e8ec]">
              <th className="text-left py-2 px-3 font-semibold text-ink-700 text-xs uppercase tracking-wider">Référence</th>
              <th className="text-left py-2 px-3 font-semibold text-ink-700 text-xs uppercase tracking-wider">Nature</th>
              <th className="text-right py-2 px-3 font-semibold text-ink-700 text-xs uppercase tracking-wider">Montant</th>
              <th className="text-left py-2 px-3 font-semibold text-ink-700 text-xs uppercase tracking-wider">Date de création</th>
              <th className="text-left py-2 px-3 font-semibold text-ink-700 text-xs uppercase tracking-wider">Statut</th>
            </tr>
          </thead>
          <tbody>
            {evenements.map((e) => (
              <tr key={e.reference} className="border-b border-[#e5e8ec] hover:bg-[#f8fafc] transition-colors cursor-pointer">
                <td className="py-2 px-3 font-mono text-xs text-ink-600">{e.reference}</td>
                <td className="py-2 px-3 font-semibold text-ink-900">{e.nature}</td>
                <td className="py-2 px-3 text-right font-mono text-ink-900 tabular-nums">
                  {e.montant !== null ? formatMontant(e.montant, e.devise) : <span className="text-ink-300">—</span>}
                </td>
                <td className="py-2 px-3 text-ink-600">{formatDate(e.dateCreation)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    e.statut === "VALIDE" ? "bg-[#e6f6ee] text-[#177a52]" :
                    e.statut === "EN_COURS" ? "bg-[#eef4ff] text-[#2a5bd7]" :
                    e.statut === "EN_ATTENTE" ? "bg-[#fef3e2] text-[#b45309]" :
                    "bg-ink-100 text-ink-600"
                  }`}>
                    {e.statut === "VALIDE" ? "Validé" :
                     e.statut === "EN_COURS" ? "En cours" :
                     e.statut === "EN_ATTENTE" ? "En attente" : e.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BandeauEcheance({ dossier }: { dossier: DossierTrade }) {
  const dateEcheance = dossier.donnees["dateEcheance"] || dossier.donnees["dateExpiration"];
  const conditions = dossier.donnees["conditionsRemiseDocuments"];
  const dateOuverture = dossier.dateMiseAJour;

  const today = new Date();
  const echeance = dateEcheance ? new Date(String(dateEcheance)) : null;
  const ouverture = dateOuverture ? new Date(dateOuverture) : null;

  let joursRestants = null;
  let isAlerte = false;

  if (echeance) {
    const diffTime = echeance.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    joursRestants = diffDays;
    isAlerte = diffDays < 15 && diffDays > 0;
  }

  const progress = ouverture && echeance ? Math.min(100, Math.max(0, ((today.getTime() - ouverture.getTime()) / (echeance.getTime() - ouverture.getTime())) * 100)) : 0;

  return (
    <div className={`rounded-lg border p-4 ${isAlerte ? "bg-[#fef2f2] border-[#fecaca]" : "bg-[#fffaf4] border-[#f3ddc2]"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <span className={`text-[10.5px] font-semibold uppercase tracking-wider ${isAlerte ? "text-[#dc2626]" : "text-[#c2410c]"}`}>ÉCHÉANCE</span>
          {echeance && (
            <span className={`text-[20px] font-extrabold tabular-nums ${isAlerte ? "text-[#dc2626]" : "text-[#9a3412]"}`}>
              {formatDate(String(dateEcheance))}
            </span>
          )}
          {joursRestants !== null && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isAlerte ? "bg-[#dc2626] text-white" : "bg-[#f97316] text-white"}`}>
              {joursRestants > 0 ? `dans ${joursRestants} jours` : joursRestants === 0 ? "Aujourd'hui" : "Échéance dépassée"}
            </span>
          )}
        </div>
        {conditions && (
          <div className="text-sm text-ink-600">{String(conditions)}</div>
        )}
      </div>

      {ouverture && echeance && (
        <>
          <div className="relative h-1.5 bg-ink-200 rounded-full mb-2">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-green-500 to-orange-500"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-ink-500">
            <span>Ouverture · {ouverture ? formatDate(ouverture.toISOString()) : "—"}</span>
            <span className={`font-semibold ${isAlerte ? "text-[#dc2626]" : "text-[#f97316]"}`}>Aujourd'hui · {formatDate(today.toISOString())}</span>
            <span>Échéance · {formatDate(String(dateEcheance))}</span>
          </div>
        </>
      )}
    </div>
  );
}

function EnTeteCompact({ dossier }: { dossier: DossierTrade }) {
  const montant = dossier.donnees["montantRemise"] || dossier.donnees["montantCredit"];
  const montantValeur = isMontantAvecDevise(montant) ? formatMontant(montant.valeur, montant.devise) : "—";

  return (
    <div className="bg-white rounded-lg border border-[#e5e8ec] p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/consultation/dossiers" className="text-sm text-ink-500 hover:text-brand-600 flex items-center gap-1">
          ‹ Liste
        </Link>
        <div className="h-6 w-px bg-ink-200" />
        <div>
          <h1 className="text-[18px] font-bold text-ink-900">{dossier.produitLibelle}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-sm text-ink-600">{dossier.reference}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              dossier.statut === "EN_COURS" ? "bg-[#eef4ff] text-[#2a5bd7]" :
              dossier.statut === "VALIDE" ? "bg-[#e6f6ee] text-[#177a52]" :
              dossier.statut === "EN_ATTENTE" ? "bg-[#fef3e2] text-[#b45309]" :
              "bg-ink-100 text-ink-600"
            }`}>
              {dossier.statut === "EN_COURS" ? "En cours" :
               dossier.statut === "VALIDE" ? "Validé" :
               dossier.statut === "EN_ATTENTE" ? "En attente" : dossier.statut}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Montant</div>
          <div className="text-[26px] font-extrabold text-ink-900 tabular-nums">{montantValeur}</div>
        </div>
        <button className="px-4 py-2 bg-[#e8632b] text-white rounded-lg text-sm font-semibold hover:bg-[#d45524] transition-colors">
          Nouvel événement
        </button>
      </div>
    </div>
  );
}

export default function DetailDossier({ dossier }: { dossier: DossierTrade }) {
  const schema = getProduitSchema(dossier.produit);

  return (
    <div className="bg-[#f6f7f9] min-h-screen py-6">
      <div className="max-w-[1240px] mx-auto space-y-4">
        <EnTeteCompact dossier={dossier} />
        <BandeauEcheance dossier={dossier} />

      {schema ? (
        dossier.produit === "IRD" ? (
          <DetailIRD dossier={dossier} />
        ) : dossier.produit === "ERD" ? (
          <DetailERD dossier={dossier} />
        ) : dossier.produit === "ILC" ? (
          <DetailILC dossier={dossier} />
        ) : (
          <DetailsDossierBloc blocs={schema.blocs} dossier={dossier} />
        )
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 p-5 text-sm text-ink-500">
          Schéma inconnu pour le produit {dossier.produit}.
        </div>
      )}

      {dossier.produit !== "IRD" && dossier.produit !== "ERD" && dossier.produit !== "ILC" && <EvenementsTable evenements={dossier.evenements} />}
      </div>
    </div>
  );
}
