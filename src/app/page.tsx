"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  MOTIF_RETOUR_CENTRALISATION_LABEL,
  MODALITE_LABEL, STATUT_PAIEMENT_LABEL, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import {
  estATraiter, estARelancer, echeanceASuivre, envoyeCtnNonRecu,
  retourDocumentsAFaire, etatEcheanceV5, contexteMetier,
  joursEcheance, bandeRemise,
} from "@/domain/pilotage";
import {
  Mail, AlertTriangle, Pencil,
  CalendarClock, Inbox, Activity, ChevronRight, ChevronUp, ChevronDown,
  Undo2, Download, ListChecks, Filter, BellRing,
  Maximize2, Clock, Zap, Plus, SlidersHorizontal,
} from "lucide-react";
import clsx from "clsx";
import type { CourrierIrd, StatutCourrierWorkflow, HistoriqueEvent } from "@/domain/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";
import PilotageHeader from "@/components/pilotage/PilotageHeader";
import { exporterCsvDossiers } from "@/lib/exportCsv";

const DEVISES = ["EUR", "USD", "MAD", "GBP", "JPY", "CHF"];

const PRODUITS: { key: string; label: string; actif: boolean }[] = [
  { key: "TOUS", label: "Tous les produits", actif: true },
  { key: "REMISE_DOCUMENTAIRE_IMPORT", label: "REMDOC Import", actif: true },
  { key: "CREDIT_DOC", label: "Crédit documentaire", actif: false },
  { key: "REMDOC_EXPORT", label: "REMDOC Export", actif: false },
  { key: "FINANCEMENTS", label: "Financements", actif: false },
];

export default function Dashboard() {
  const router = useRouter();
  const courriersAll = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);
  const nouveauCourrier = () => {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  };

  function handleCorriger(c: CourrierIrd) {
    if (c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN") {
      applyAction(c.id, "CORRIGER");
    }
    router.push(`/remises-doc/import/${c.id}`);
  }

  /* ---------- Filtre produit global ---------- */
  const [produitFiltre, setProduitFiltre] = useState("TOUS");
  const courriers = useMemo(
    () => produitFiltre === "TOUS" ? courriersAll : courriersAll.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === produitFiltre),
    [courriersAll, produitFiltre]
  );

  /* ---------- Recherche & filtres ---------- */
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* ---------- Blocs repliables / masquables ---------- */
  const [replie, setReplie] = useState<Record<string, boolean>>({});
  const [visibles, setVisibles] = useState<Record<string, boolean>>({
    alertes: true, echeances: true, anciennete: true, acces: true, atraiter: true, activite: true,
  });
  const toggleReplie = (k: string) => setReplie(r => ({ ...r, [k]: !r[k] }));

  const [fProduit, setFProduit] = useState("");
  const [fStatuts, setFStatuts] = useState<StatutCourrierWorkflow[]>([]);
  const [fClient, setFClient] = useState("");
  const [fRef, setFRef] = useState("");
  const [fRefInt, setFRefInt] = useState("");
  const [fRefExt, setFRefExt] = useState("");
  const [fDateDeb, setFDateDeb] = useState("");
  const [fDateFin, setFDateFin] = useState("");
  const [fDevise, setFDevise] = useState("");
  const [fMontantMin, setFMontantMin] = useState("");
  const [fMontantMax, setFMontantMax] = useState("");
  const [fAgence, setFAgence] = useState("");
  const [fTypeRetour, setFTypeRetour] = useState("");
  const [fModalite, setFModalite] = useState("");
  const [fStatutPaiement, setFStatutPaiement] = useState("");
  const [fEchDeb, setFEchDeb] = useState("");
  const [fEchFin, setFEchFin] = useState("");
  const [fEtatEch, setFEtatEch] = useState("");
  const [fDerniereAction, setFDerniereAction] = useState("");

  const agences = useMemo(
    () => Array.from(new Set(courriersAll.map(c => c.agence_reception).filter(Boolean))).sort(),
    [courriersAll]
  );

  function applyFilters() {
    const p = new URLSearchParams();
    if (fProduit) p.set("produit", fProduit);
    if (fStatuts.length) p.set("statut", fStatuts.join(","));
    if (fClient.trim()) p.set("client", fClient.trim());
    if (fRef.trim()) p.set("ref", fRef.trim());
    if (fRefInt.trim()) p.set("ref_interne", fRefInt.trim());
    if (fRefExt.trim()) p.set("ref_externe", fRefExt.trim());
    if (fDateDeb) p.set("date_debut", fDateDeb);
    if (fDateFin) p.set("date_fin", fDateFin);
    if (fDevise) p.set("devise", fDevise);
    if (fMontantMin) p.set("montant_min", fMontantMin);
    if (fMontantMax) p.set("montant_max", fMontantMax);
    if (fAgence) p.set("agence", fAgence);
    if (fTypeRetour) p.set("type_retour", fTypeRetour);
    if (fModalite) p.set("modalite", fModalite);
    if (fStatutPaiement) p.set("statut_paiement", fStatutPaiement);
    if (fEchDeb) p.set("echeance_du", fEchDeb);
    if (fEchFin) p.set("echeance_au", fEchFin);
    if (fEtatEch) p.set("etat_echeance", fEtatEch);
    if (fDerniereAction) p.set("derniere_action", fDerniereAction);
    router.push(`/listes/en-cours?${p.toString()}`);
  }

  function resetFilters() {
    setFProduit(""); setFStatuts([]); setFClient(""); setFRef(""); setFRefInt(""); setFRefExt("");
    setFDateDeb(""); setFDateFin(""); setFDevise(""); setFMontantMin(""); setFMontantMax("");
    setFAgence(""); setFTypeRetour(""); setFModalite(""); setFStatutPaiement("");
    setFEchDeb(""); setFEchFin(""); setFEtatEch(""); setFDerniereAction("");
  }

  /* ---------- Agrégats ---------- */
  const nbATraiter = courriers.filter(estATraiter).length;
  const nbEnCours = courriers.length;
  const nbARelancer = courriers.filter(estARelancer).length;
  const nbEcheances = courriers.filter(echeanceASuivre).length;

  const nbCtnNonRecus = courriers.filter(envoyeCtnNonRecu).length;
  const dernierEnvoiCtn = courriers.filter(c => c.date_envoi_ctn)
    .sort((a, b) => (b.date_envoi_ctn ?? "").localeCompare(a.date_envoi_ctn ?? ""))[0]?.date_envoi_ctn;
  const nbSouffrance = courriers.filter(retourDocumentsAFaire).length;
  const nbEchues = courriers.filter(c => etatEcheanceV5(c) === "ECHUE").length;
  const nbSortis = courriers.filter(c => etatEcheanceV5(c) === "HORS_INDICATEUR").length;

  /* ---------- Échéances : buckets J0 … J-10 ---------- */
  const nbAVenir = courriers.filter(c => etatEcheanceV5(c) === "A_VENIR").length;
  const buckets = useMemo(() => {
    const b = Array(11).fill(0);
    for (const c of courriers) {
      if (etatEcheanceV5(c) !== "A_VENIR") continue;
      const j = joursEcheance(c); // 0 = J0, négatif = J-n
      if (j != null && j <= 0 && j >= -10) b[-j] += 1;
    }
    return b as number[];
  }, [courriers]);
  const maxBucket = Math.max(1, ...buckets);

  /* ---------- Ancienneté des remises ---------- */
  const bandeStats = useMemo(() => {
    const s: Record<string, number> = { SURVEILLANCE: 0, RELANCE: 0, RETOUR_DOCS: 0 };
    for (const c of courriers) {
      const b = bandeRemise(c);
      if (b) s[b] += 1;
    }
    return s;
  }, [courriers]);
  const nbRemises = bandeStats.SURVEILLANCE + bandeStats.RELANCE + bandeStats.RETOUR_DOCS;

  /* ---------- À traiter ---------- */
  const [filtreProduitATraiter, setFiltreProduitATraiter] = useState("TOUS");
  const aTraiter = useMemo(() => {
    let items = courriers.filter(estATraiter);
    if (filtreProduitATraiter !== "TOUS") {
      items = items.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === filtreProduitATraiter);
    }
    return items;
  }, [courriers, filtreProduitATraiter]);
  const NB_A_TRAITER_AFFICHES = 4;

  /* ---------- Activité récente (48 h) ---------- */
  const [filtreProduitAct, setFiltreProduitAct] = useState("TOUS");
  const activite = useMemo(() => {
    const limite = Date.now() - 48 * 3600 * 1000;
    const all: { ev: HistoriqueEvent; c: CourrierIrd }[] = [];
    for (const c of courriers) {
      if (filtreProduitAct !== "TOUS" && (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") !== filtreProduitAct) continue;
      for (const ev of c.historique) {
        if (new Date(ev.date).getTime() >= limite) all.push({ ev, c });
      }
    }
    return all.sort((a, b) => b.ev.date.localeCompare(a.ev.date)).slice(0, 7);
  }, [courriers, filtreProduitAct]);

  /* ---------- Export CSV de la vue ---------- */
  const exporterCSV = () => exporterCsvDossiers(courriers, "pilotage-agence");

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <div className="space-y-6">
        {/* ===== 1. En-tête pilotage ===== */}
        <PilotageHeader
          actif="pilotage"
          fil="Casablanca"
          actions={
            <>
              <ProductSelect value={produitFiltre} onChange={setProduitFiltre} counts={courriersAll.length} />
              <AffichageMenu visibles={visibles} onToggle={(k) => setVisibles(v => ({ ...v, [k]: !v[k] }))} />
              <button className="btn-outline h-10 inline-flex items-center gap-2" onClick={exporterCSV}>
                <Download size={15} /> Exporter
              </button>
              <Button onClick={nouveauCourrier}>
                <Mail size={16} /> Nouvelle centralisation
              </Button>
            </>
          }
        />

        {/* ===== Filtres (bouton dans le menu du haut) ===== */}
        {isFilterOpen && (
          <div className="card p-5 filter-panel-enter">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">PRODUIT</label>
                    <select className="input w-full" value={fProduit} onChange={e => setFProduit(e.target.value)}>
                      <option value="">Tous les produits</option>
                      <option value="REMISE_DOCUMENTAIRE_IMPORT">REMDOC Import</option>
                      <option disabled>Crédit documentaire — À venir</option>
                      <option disabled>REMDOC Export — À venir</option>
                      <option disabled>Financements — À venir</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label">CLIENT / TIRÉ</label>
                    <input className="input w-full" value={fClient} onChange={e => setFClient(e.target.value)} placeholder="Nom du client ou du tiré" />
                  </div>
                  <div>
                    <label className="text-label">AGENCE</label>
                    <select className="input w-full" value={fAgence} onChange={e => setFAgence(e.target.value)}>
                      <option value="">Casablanca</option>
                      {agences.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-label">STATUT</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => {
                      const active = fStatuts.includes(k as StatutCourrierWorkflow);
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFStatuts(prev => prev.includes(k as StatutCourrierWorkflow) ? prev.filter(x => x !== k) : [...prev, k as StatutCourrierWorkflow])}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                            active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">RÉFÉRENCE CENTRALISATION</label>
                    <input className="input w-full" value={fRef} onChange={e => setFRef(e.target.value)} placeholder="IRD26…" />
                  </div>
                  <div>
                    <label className="text-label">RÉFÉRENCE INTERNE</label>
                    <input className="input w-full" value={fRefInt} onChange={e => setFRefInt(e.target.value)} placeholder="INT/…" />
                  </div>
                  <div>
                    <label className="text-label">RÉFÉRENCE EXTERNE</label>
                    <input className="input w-full" value={fRefExt} onChange={e => setFRefExt(e.target.value)} placeholder="Référence du donneur d'ordre" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DATE DE RÉCEPTION — DU</label>
                    <input type="date" className="input w-full" value={fDateDeb} onChange={e => setFDateDeb(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DATE DE RÉCEPTION — AU</label>
                    <input type="date" className="input w-full" value={fDateFin} onChange={e => setFDateFin(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DERNIÈRE ACTION À PARTIR DU</label>
                    <input type="date" className="input w-full" value={fDerniereAction} onChange={e => setFDerniereAction(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DEVISE</label>
                    <select className="input w-full" value={fDevise} onChange={e => setFDevise(e.target.value)}>
                      <option value="">Toutes</option>
                      {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-label">MONTANT MIN</label>
                    <input type="number" className="input w-full" value={fMontantMin} onChange={e => setFMontantMin(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-label">MONTANT MAX</label>
                    <input type="number" className="input w-full" value={fMontantMax} onChange={e => setFMontantMax(e.target.value)} placeholder="Sans limite" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">TYPE DE RETOUR</label>
                    <select className="input w-full" value={fTypeRetour} onChange={e => setFTypeRetour(e.target.value)}>
                      <option value="">Agence · CTN</option>
                      <option value="RETOUR_AGENCE">Retour Agence</option>
                      <option value="RETOUR_CTN">Retour CTN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label">MODALITÉ</label>
                    <select className="input w-full" value={fModalite} onChange={e => setFModalite(e.target.value)}>
                      <option value="">Toutes</option>
                      {Object.entries(MODALITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-label">STATUT PAIEMENT</label>
                    <select className="input w-full" value={fStatutPaiement} onChange={e => setFStatutPaiement(e.target.value)}>
                      <option value="">Tous</option>
                      {Object.entries(STATUT_PAIEMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DATE D'ÉCHÉANCE — DU</label>
                    <input type="date" className="input w-full" value={fEchDeb} onChange={e => setFEchDeb(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DATE D'ÉCHÉANCE — AU</label>
                    <input type="date" className="input w-full" value={fEchFin} onChange={e => setFEchFin(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">ÉTAT DE L'ÉCHÉANCE</label>
                    <select className="input w-full" value={fEtatEch} onChange={e => setFEtatEch(e.target.value)}>
                      <option value="">À venir · Échue</option>
                      <option value="A_VENIR">À venir</option>
                      <option value="ECHUE">Échue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 italic">Critères transverses + critères métier REMDOC Import</span>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={resetFilters}>Réinitialiser</button>
                  <button className="btn-ghost" onClick={() => setIsFilterOpen(false)}>Masquer</button>
                  <button className="btn-primary" onClick={applyFilters}>Appliquer les filtres</button>
                </div>
              </div>
            </div>
          )}

        {/* ===== 3. KPI transverses ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "À traiter", unit: "actions", value: nbATraiter, href: "/listes/toutes", icon: ListChecks, border: "border-b-red-500", text: "text-red-600" },
            { label: "Dossiers en cours", unit: "dossiers", value: nbEnCours, href: "/listes/en-cours", icon: Inbox, border: "border-b-slate-900", text: "text-slate-900" },
            { label: "À relancer", unit: "dossiers", value: nbARelancer, href: "/listes/relances", icon: BellRing, border: "border-b-orange-500", text: "text-orange-600" },
            { label: "Échéances à suivre", unit: "échéances", value: nbEcheances, href: "/echeancier", icon: CalendarClock, border: "border-b-orange-500", text: "text-orange-600" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href}>
                <Card className={`border-b-[3px] ${k.border} hover:ring-2 hover:ring-orange-300 transition cursor-pointer h-full`}>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      <Icon size={13} /> {k.label}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold ${k.text}`}>{k.value}</span>
                      <span className="text-xs text-gray-500">{k.unit}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ===== 4. Alertes opérationnelles ===== */}
        {visibles.alertes && (
          <AlertesBlock
            nbCtnNonRecus={nbCtnNonRecus}
            dernierEnvoiCtn={dernierEnvoiCtn}
            nbSouffrance={nbSouffrance}
            nbEchues={nbEchues}
            nbSortis={nbSortis}
            replie={!!replie.alertes}
            onToggle={() => toggleReplie("alertes")}
          />
        )}

        {/* ===== 5. Échéances | Ancienneté | Accès rapides ===== */}
        <div className="grid lg:grid-cols-3 gap-4 items-start">
          {/* Échéances · 10 prochains jours */}
          {visibles.echeances && (
            <Card>
              <div className="p-5">
                <CardHeader
                  icon={CalendarClock}
                  titre="Échéances · 10 prochains jours"
                  right={
                    <>
                      <Link href="/echeancier" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:text-orange-600 grid place-items-center" title="Ouvrir l'échéancier">
                        <Maximize2 size={13} />
                      </Link>
                      <ToggleBtn replie={!!replie.echeances} onToggle={() => toggleReplie("echeances")} />
                    </>
                  }
                />
                {!replie.echeances && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-700">{nbAVenir} échéance{nbAVenir > 1 ? "s" : ""} à venir</span>
                      <Link href="/listes/ech-echues" className="badge-red">{nbEchues} échue{nbEchues > 1 ? "s" : ""} &lt; 45 j</Link>
                    </div>
                    <div className="flex items-end gap-1.5 h-24">
                      {buckets.map((n, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                          <span className="text-[10px] text-gray-500">{n > 0 ? n : ""}</span>
                          <div
                            className={clsx(
                              "w-full rounded",
                              n === 0 ? "h-1 bg-gray-100" : i <= 2 ? "bg-red-500" : i <= 6 ? "bg-amber-500" : "bg-blue-500"
                            )}
                            style={n > 0 ? { height: `${Math.max(4, (n / maxBucket) * 90)}px` } : undefined}
                          />
                          <span className="text-[9px] text-gray-400">{i === 0 ? "J0" : `J-${i}`}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">Rouge J0 à J-2 · ambre J-3 à J-6 · bleu J-7 à J-10</div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Ancienneté des remises */}
          {visibles.anciennete && (
            <Card>
              <div className="p-5">
                <CardHeader
                  icon={Clock}
                  titre="Ancienneté des remises"
                  right={<ToggleBtn replie={!!replie.anciennete} onToggle={() => toggleReplie("anciennete")} />}
                />
                {!replie.anciennete && (
                  <>
                    <div className="h-2 rounded-full overflow-hidden flex mb-4">
                      <div className="bg-blue-500" style={{ width: `${nbRemises ? (bandeStats.SURVEILLANCE / nbRemises) * 100 : 0}%` }} />
                      <div className="bg-amber-500" style={{ width: `${nbRemises ? (bandeStats.RELANCE / nbRemises) * 100 : 0}%` }} />
                      <div className="bg-orange-500" style={{ width: `${nbRemises ? (bandeStats.RETOUR_DOCS / nbRemises) * 100 : 0}%` }} />
                    </div>
                    <div className="space-y-1">
                      {([
                        { key: "SURVEILLANCE", label: "Moins de 20 jours", href: "/listes/surveillance", dot: "bg-blue-500", text: "text-blue-600" },
                        { key: "RELANCE", label: "20 à 29 jours · relance client", href: "/listes/relance-remise", dot: "bg-amber-500", text: "text-amber-600" },
                        { key: "RETOUR_DOCS", label: "30 jours et plus · retour documents", href: "/listes/retour-docs", dot: "bg-orange-500", text: "text-orange-600" },
                      ]).map(r => {
                        const n = bandeStats[r.key];
                        const pct = nbRemises ? Math.round((n / nbRemises) * 100) : 0;
                        return (
                          <Link key={r.key} href={r.href} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 transition">
                            <span className="flex items-center gap-2 text-sm text-gray-700">
                              <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                              {r.label}
                            </span>
                            <span className="text-xs text-gray-500">
                              {pct}% <span className={`font-semibold ${r.text}`}>{n}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-2">
                      {nbRemises} dossier{nbRemises > 1 ? "s" : ""} avec documents reçus et remise non effectuée
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Accès rapides */}
          {visibles.acces && (
            <Card>
              <div className="p-5">
                <CardHeader
                  icon={Zap}
                  titre="Accès rapides"
                  right={<ToggleBtn replie={!!replie.acces} onToggle={() => toggleReplie("acces")} />}
                />
                {!replie.acces && (
                  <div>
                    {([
                      { icon: Plus, label: "Nouvelle centralisation", count: null, onClick: nouveauCourrier },
                      { icon: CalendarClock, label: "Échéancier", count: nbEcheances, href: "/echeancier" },
                      { icon: BellRing, label: "Relances du jour", count: nbARelancer, href: "/listes/relances" },
                      { icon: Inbox, label: "Tous les dossiers", count: nbEnCours, href: "/listes/en-cours" },
                    ] as { icon: typeof Plus; label: string; count: number | null; href?: string; onClick?: () => void }[]).map((r) => {
                      const Icon = r.icon;
                      const inner = (
                        <>
                          <span className="flex items-center gap-2 text-sm text-gray-700">
                            <Icon size={15} className="text-gray-400" /> {r.label}
                          </span>
                          {r.count != null && <span className="text-xs text-gray-500">{r.count}</span>}
                        </>
                      );
                      const cls = "flex items-center justify-between py-2 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded transition";
                      return r.href ? (
                        <Link key={r.label} href={r.href} className={cls}>{inner}</Link>
                      ) : (
                        <button key={r.label} onClick={r.onClick} className={clsx(cls, "w-full text-left")}>{inner}</button>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ===== 6. À traiter | Activité récente ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* À TRAITER */}
          {visibles.atraiter && (
            <Card className="lg:col-span-2">
              <div className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <ListChecks size={15} className="text-orange-500" /> À traiter
                    <span className="bg-red-50 text-red-700 rounded-full px-2 text-xs font-bold">{aTraiter.length}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Link href="/listes/toutes" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:text-orange-600 grid place-items-center" title="Ouvrir la liste complète">
                      <Maximize2 size={13} />
                    </Link>
                    <ToggleBtn replie={!!replie.atraiter} onToggle={() => toggleReplie("atraiter")} />
                  </div>
                </div>
                {!replie.atraiter && (
                  <>
                    {/* Filtre produit — blocs cliquables */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <Filter size={12} className="text-gray-400" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mr-1">Produit</span>
                      {PRODUITS.map(p => {
                        const n = p.key === "TOUS"
                          ? courriers.filter(estATraiter).length
                          : courriers.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === p.key && estATraiter(c)).length;
                        if (!p.actif) {
                          return (
                            <span key={p.key} className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-gray-300 text-gray-400 cursor-not-allowed">
                              {p.label}
                            </span>
                          );
                        }
                        const active = filtreProduitATraiter === p.key;
                        return (
                          <button
                            key={p.key}
                            onClick={() => setFiltreProduitATraiter(p.key)}
                            className={clsx(
                              "px-2.5 py-1 rounded-md text-[11px] font-medium border transition",
                              active ? "border-orange-500 text-orange-600 bg-orange-50" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                            )}
                          >
                            {p.key === "TOUS" ? "Tous" : p.label} {n}
                          </button>
                        );
                      })}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Dossier</th>
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Statut et contexte métier</th>
                            <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Montant</th>
                            <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aTraiter.slice(0, NB_A_TRAITER_AFFICHES).map(c => {
                            const isRetourDocs = retourDocumentsAFaire(c);
                            const isRetour = c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION";
                            return (
                              <tr
                                key={c.id}
                                className={clsx(
                                  "border-b border-gray-100",
                                  isRetour && "border-l-4 border-l-red-500",
                                  isRetourDocs && "border-l-4 border-l-orange-500"
                                )}
                              >
                                <td className="py-2.5 pr-3 align-top">
                                  <Link href={`/remises-doc/import/${c.id}`} className="font-medium text-orange-600 hover:underline">
                                    {c.reference_courrier}
                                  </Link>
                                  <div className="text-xs text-gray-700">{c.client ?? "—"}</div>
                                  <div className="text-[11px] text-gray-400">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</div>
                                </td>
                                <td className="py-2.5 pr-3 align-top">
                                  <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {contexteMetier(c)}
                                    {isRetour && c.dernier_retour && ` — ${MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}`}
                                  </div>
                                </td>
                                <td className="py-2.5 pr-3 align-top text-right whitespace-nowrap">
                                  {c.montant != null ? (
                                    <>
                                      <div className="font-semibold text-gray-900">{c.montant.toLocaleString("fr-FR")}</div>
                                      <div className="text-[11px] text-gray-500">{c.devise}</div>
                                    </>
                                  ) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="py-2.5 align-top whitespace-nowrap">
                                  {isRetour ? (
                                    <button className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1" onClick={() => handleCorriger(c)}>
                                      <Pencil size={12} /> Corriger
                                    </button>
                                  ) : isRetourDocs ? (
                                    <button
                                      className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1"
                                      onClick={() => applyAction(c.id, "RETOURNER_DOCUMENTS")}
                                    >
                                      <Undo2 size={12} /> Retourner les documents
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                          {aTraiter.length === 0 && (
                            <tr><td colSpan={4} className="text-sm text-gray-400 text-center py-6">Aucune action à traiter.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">{Math.min(NB_A_TRAITER_AFFICHES, aTraiter.length)} dossiers affichés sur {aTraiter.length}</span>
                      <Link href="/listes/toutes" className="text-orange-600 font-medium hover:underline">Voir tout →</Link>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* ACTIVITÉ RÉCENTE */}
          {visibles.activite && (
            <Card>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                    <Activity size={15} className="text-orange-500" /> Activité récente
                    <span className="text-[11px] text-gray-400 font-normal normal-case">48 h</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FunnelFilter value={filtreProduitAct} onChange={setFiltreProduitAct} />
                    <ToggleBtn replie={!!replie.activite} onToggle={() => toggleReplie("activite")} />
                  </div>
                </div>
                {!replie.activite && (
                  <>
            <div className="space-y-1">
              {activite.map(({ ev, c }) => {
                const isRetour = ev.type === "RETOUR_AGENCE" || ev.type === "RETOUR_CTN";
                const dot = isRetour ? "bg-red-500"
                  : ev.type === "VALIDATION_AGENCE" || ev.type === "VALIDATION_CTN" ? "bg-green-500"
                  : ev.type === "TRANSMISSION_CTN" || ev.type === "ENVOI_CTN" ? "bg-blue-500"
                  : ev.type === "CORRECTION" ? "bg-amber-500"
                  : ev.type === "PAIEMENT" || ev.type === "RECEPTION_AGENCE" ? "bg-emerald-500"
                  : "bg-orange-500";
                return (
                  <Link
                    key={ev.id}
                    href={`/remises-doc/import/${c.id}/historique`}
                    className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-orange-50/40 transition"
                  >
                    <span className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{ev.message}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        <span className="font-medium text-orange-600">{c.reference_courrier}</span>
                        {" · "}{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}
                        {ev.acteur && <> · {ev.acteur}</>}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                      {new Date(ev.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} {new Date(ev.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </Link>
                );
              })}
              {activite.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-6">Aucune activité sur les 48 dernières heures.</div>
              )}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Link href="/consultation/evenements" className="text-xs text-orange-600 font-medium hover:underline">
                Tout l'historique →
              </Link>
            </div>
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ---------- Sélecteur de produit global ---------- */
function ProductSelect({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = PRODUITS.find(p => p.key === value);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-outline h-10 inline-flex items-center gap-2 min-w-[170px] justify-between"
      >
        <span className="text-sm">{current?.label ?? "Tous les produits"}</span>
        <ChevronRight size={14} className={clsx("transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
          {PRODUITS.map(p => (
            <button
              key={p.key}
              disabled={!p.actif}
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                !p.actif ? "text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700",
                value === p.key && "font-semibold text-orange-600"
              )}
            >
              <span>{p.label}{p.key === "REMISE_DOCUMENTAIRE_IMPORT" ? ` (${counts})` : ""}</span>
              {!p.actif && <span className="text-[10px] badge-gray">À venir</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Filtre produit entonnoir (local à un bloc) ---------- */
function FunnelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = PRODUITS.find(p => p.key === value);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs border transition",
          value !== "TOUS"
            ? "text-orange-600 bg-orange-50 border-orange-200"
            : "text-gray-500 bg-white border-gray-200 hover:border-gray-300"
        )}
        title="Filtrer par produit"
      >
        <Filter size={12} />
        {value === "TOUS" ? "Tous produits" : current?.label}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Filtrer par produit</div>
          {PRODUITS.map(p => (
            <button
              key={p.key}
              disabled={!p.actif}
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                !p.actif ? "text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700",
                value === p.key && "font-semibold text-orange-600"
              )}
            >
              <span>{p.label}</span>
              {!p.actif && <span className="text-[10px] badge-gray">À venir</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Bloc Alertes opérationnelles ---------- */
function AlertesBlock({ nbCtnNonRecus, dernierEnvoiCtn, nbSouffrance, nbEchues, nbSortis, replie, onToggle }: {
  nbCtnNonRecus: number; dernierEnvoiCtn?: string; nbSouffrance: number; nbEchues: number; nbSortis: number;
  replie: boolean; onToggle: () => void;
}) {
  const [filtre, setFiltre] = useState("TOUS");
  const tuiles = [
    {
      n: nbCtnNonRecus,
      titre: "Envoyés CTN non reçus en agence",
      sub: dernierEnvoiCtn ? `Dernier envoi CTN : ${new Date(dernierEnvoiCtn).toLocaleDateString("fr-FR")}` : "Aucun envoi CTN",
      href: "/listes/ctn-non-recus",
      border: "border-l-blue-500", text: "text-blue-600",
    },
    {
      n: nbSouffrance,
      titre: "Remises en souffrance ≥ 30 j",
      sub: "Retour documents à effectuer",
      href: "/listes/retour-docs",
      border: "border-l-orange-500", text: "text-orange-600",
    },
    {
      n: nbEchues,
      titre: "Échéances échues < 45 j",
      sub: `${nbSortis} dossier${nbSortis > 1 ? "s" : ""} sorti${nbSortis > 1 ? "s" : ""} de l'indicateur (≥ J+45)`,
      href: "/listes/ech-echues",
      border: "border-l-red-500", text: "text-red-600",
    },
  ];
  return (
    <Card className="border-l-4 border-l-orange-500">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Alertes opérationnelles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FunnelFilter value={filtre} onChange={setFiltre} />
            <ToggleBtn replie={replie} onToggle={onToggle} />
          </div>
        </div>
        {!replie && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {tuiles.map(t => (
              <Link
                key={t.titre}
                href={t.href}
                className={`border border-gray-200 rounded-lg p-3 border-l-4 ${t.border} flex items-center gap-3 hover:bg-gray-50 transition`}
              >
                <span className={`text-2xl font-bold ${t.text}`}>{t.n}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900">{t.titre}</div>
                  <div className="text-[11px] text-gray-500">{t.sub}</div>
                </div>
                <ChevronRight size={16} className="ml-auto text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Petits composants réutilisés dans les cartes ---------- */
function ToggleBtn({ replie, onToggle }: { replie: boolean; onToggle: () => void }) {
  return (
    <button
      className="h-7 w-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 grid place-items-center"
      onClick={onToggle}
      title={replie ? "Déplier" : "Replier"}
    >
      {replie ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
    </button>
  );
}

function CardHeader({ icon: Icon, titre, right }: { icon: typeof ListChecks; titre: string; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-orange-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{titre}</span>
      </div>
      {right && <div className="flex items-center gap-1.5">{right}</div>}
    </div>
  );
}

/* ---------- Menu « Affichage » des blocs ---------- */
const SECTIONS_AFFICHAGE = [
  { key: "alertes", label: "Alertes opérationnelles" },
  { key: "echeances", label: "Échéances · 10 prochains jours" },
  { key: "anciennete", label: "Ancienneté des remises" },
  { key: "acces", label: "Accès rapides" },
  { key: "atraiter", label: "À traiter" },
  { key: "activite", label: "Activité récente" },
];

function AffichageMenu({ visibles, onToggle }: { visibles: Record<string, boolean>; onToggle: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-outline h-10 inline-flex items-center gap-2">
        <SlidersHorizontal size={15} /> Affichage
        <ChevronRight size={14} className={clsx("transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Affichage des blocs</div>
          {SECTIONS_AFFICHAGE.map(s => (
            <label key={s.key} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer">
              <input
                type="checkbox"
                checked={visibles[s.key] ?? false}
                onChange={() => onToggle(s.key)}
                className="accent-orange-500"
              />
              {s.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
