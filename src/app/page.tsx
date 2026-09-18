"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect } from "react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  MOTIF_RETOUR_CENTRALISATION_LABEL,
  MODALITE_LABEL, STATUT_PAIEMENT_LABEL, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import {
  estATraiter, estARelancer, echeanceASuivre, envoyeCtnNonRecu,
  retourDocumentsAFaire, etatEcheanceV5, contexteMetier,
} from "@/domain/pilotage";
import {
  Mail, AlertTriangle, Send, Pencil, Search,
  CalendarClock, Inbox, Activity, ChevronRight,
  Undo2, Download, ListChecks, Filter, BellRing,
} from "lucide-react";
import clsx from "clsx";
import type { CourrierIrd, StatutCourrierWorkflow, HistoriqueEvent } from "@/domain/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  function submitSearch() {
    const q = searchQuery.trim();
    router.push(q ? `/listes/recherche?q=${encodeURIComponent(q)}` : "/listes/en-cours");
  }

  function applyFilters() {
    const p = new URLSearchParams();
    if (searchQuery.trim()) p.set("q", searchQuery.trim());
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
  function exporterCSV() {
    const lignes = [
      ["Référence", "Produit", "Client/Tiré", "Montant", "Devise", "Statut", "Date réception"],
      ...courriers.map(c => [
        c.reference_courrier,
        PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"],
        c.client ?? "", String(c.montant ?? ""), c.devise ?? "",
        COURRIER_WORKFLOW_LABEL[c.statut_workflow],
        new Date(c.date_reception).toLocaleDateString("fr-FR"),
      ]),
    ];
    const csv = lignes.map(r => r.map(v => `"${v}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `pilotage-agence-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const arrete = new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <div className="space-y-6">
        {/* ===== 1. En-tête ===== */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Dashboard agence · Produits Trade
            </div>
            <h1 className="text-display">Pilotage agence Casablanca</h1>
            <p className="text-subtitle">
              Arrêté au {arrete} · {nbEnCours} dossiers en cours · {nbATraiter} actions à traiter · {nbEcheances} échéances à suivre
            </p>
            <p className="text-[11px] text-gray-400 mt-1 italic">
              V1 : seul le produit REMDOC Import alimente les indicateurs. La structure reste ouverte aux autres produits Trade.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ProductSelect value={produitFiltre} onChange={setProduitFiltre} counts={courriersAll.length} />
            <button className="btn-outline h-10 inline-flex items-center gap-2" onClick={exporterCSV}>
              <Download size={15} /> Exporter
            </button>
            <Button onClick={nouveauCourrier}>
              <Mail size={16} /> Nouvelle centralisation
            </Button>
          </div>
        </div>

        {/* ===== 2. Recherche globale ===== */}
        <div className="card p-4 bg-slate-900 !border-slate-800">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitSearch()}
              placeholder="Rechercher un dossier, client, référence..."
              className="input-lg pl-10 w-full"
            />
          </div>
        </div>

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
            { label: "À traiter", unit: "actions", value: nbATraiter, href: "/listes/toutes", icon: ListChecks },
            { label: "Dossiers en cours", unit: "dossiers", value: nbEnCours, href: "/listes/en-cours", icon: Inbox },
            { label: "À relancer", unit: "dossiers", value: nbARelancer, href: "/listes/relance-remise", icon: BellRing },
            { label: "Échéances à suivre", unit: "échéances", value: nbEcheances, href: "/echeancier", icon: CalendarClock },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href}>
                <Card className="hover:ring-2 hover:ring-orange-300 transition cursor-pointer h-full">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <Icon size={13} /> {k.label}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-slate-900">{k.value}</span>
                    <span className="text-xs text-gray-500">{k.unit}</span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ===== 4. Alertes opérationnelles ===== */}
        <AlertesBlock
          nbCtnNonRecus={nbCtnNonRecus}
          dernierEnvoiCtn={dernierEnvoiCtn}
          nbSouffrance={nbSouffrance}
          nbEchues={nbEchues}
          nbSortis={nbSortis}
        />

        {/* ===== 5. À traiter | Activité récente ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* À TRAITER */}
          <Card className="lg:col-span-2">
            <div className="card-header flex items-center justify-between flex-wrap gap-2">
              <div className="text-title flex items-center gap-2">
                <ListChecks size={18} className="text-orange-500" /> À traiter
                <span className="badge-gray">{aTraiter.length} dossier{aTraiter.length > 1 ? "s" : ""}</span>
              </div>
              {/* Filtre produit — blocs cliquables */}
              <div className="flex items-center gap-1.5 flex-wrap">
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
            </div>
            <p className="text-[11px] text-gray-500 mb-3">
              Dossiers nécessitant une action du préposé agence : retours Agence et CTN à corriger, retours documents à effectuer (documents reçus depuis ≥ 30 jours, remise non effectuée).
            </p>

            <div className="space-y-2">
              {aTraiter.slice(0, NB_A_TRAITER_AFFICHES).map(c => {
                const isRetourDocs = retourDocumentsAFaire(c);
                const isRetour = c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION";
                return (
                  <div
                    key={c.id}
                    className={clsx(
                      "flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 border-l-4 hover:bg-orange-50/30 transition",
                      isRetourDocs ? "border-l-orange-500" : "border-l-red-500"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/remises-doc/import/${c.id}`} className="font-medium text-orange-600 hover:underline text-sm">
                          {c.reference_courrier}
                        </Link>
                        <span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span>
                        <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                      </div>
                      <div className="text-xs font-medium text-gray-900 mt-1">{c.client ?? "—"}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {contexteMetier(c)}
                        {isRetour && c.dernier_retour && ` — ${MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {c.montant != null && (
                        <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {c.montant.toLocaleString("fr-FR")} {c.devise}
                        </span>
                      )}
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
                    </div>
                  </div>
                );
              })}
              {aTraiter.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-6">Aucune action à traiter.</div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
              <span className="text-gray-500">{Math.min(NB_A_TRAITER_AFFICHES, aTraiter.length)} dossiers affichés sur {aTraiter.length}</span>
              <Link href="/listes/toutes" className="text-orange-600 font-medium hover:underline">Voir tout →</Link>
            </div>
          </Card>

          {/* ACTIVITÉ RÉCENTE */}
          <Card>
            <div className="card-header flex items-center justify-between">
              <div className="text-title flex items-center gap-2">
                <Activity size={18} className="text-orange-500" /> Activité récente
                <span className="text-[11px] text-gray-400 font-normal">48 h</span>
              </div>
              <FunnelFilter value={filtreProduitAct} onChange={setFiltreProduitAct} />
            </div>
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
          </Card>
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
function AlertesBlock({ nbCtnNonRecus, dernierEnvoiCtn, nbSouffrance, nbEchues, nbSortis }: {
  nbCtnNonRecus: number; dernierEnvoiCtn?: string; nbSouffrance: number; nbEchues: number; nbSortis: number;
}) {
  const [filtre, setFiltre] = useState("TOUS");
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-500" />
          <span className="text-sm font-bold uppercase tracking-wider text-gray-700">Alertes opérationnelles</span>
        </div>
        <FunnelFilter value={filtre} onChange={setFiltre} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Link href="/listes/ctn-non-recus" className="rounded-lg bg-blue-50 border-l-4 border-blue-400 p-4 hover:ring-2 hover:ring-blue-200 transition block">
          <div className="flex items-center gap-2">
            <Send size={15} className="text-blue-500" />
            <span className="text-sm font-semibold text-blue-900">Envoyés CTN non reçus en agence</span>
          </div>
          <div className="text-3xl font-bold text-blue-900 mt-2">{nbCtnNonRecus}</div>
          <div className="text-xs text-blue-700 mt-1">
            {dernierEnvoiCtn ? `Dernier envoi CTN : ${new Date(dernierEnvoiCtn).toLocaleDateString("fr-FR")}` : "Aucun envoi CTN"}
          </div>
        </Link>
        <Link href="/listes/retour-docs" className="rounded-lg bg-amber-50 border-l-4 border-amber-400 p-4 hover:ring-2 hover:ring-amber-200 transition block">
          <div className="flex items-center gap-2">
            <Undo2 size={15} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-900">Remises en souffrance ≥ 30 j</span>
          </div>
          <div className="text-3xl font-bold text-amber-900 mt-2">{nbSouffrance}</div>
          <div className="text-xs text-amber-700 mt-1">Retour documents à effectuer</div>
        </Link>
        <Link href="/listes/ech-echues" className="rounded-lg bg-red-50 border-l-4 border-red-400 p-4 hover:ring-2 hover:ring-red-200 transition block">
          <div className="flex items-center gap-2">
            <CalendarClock size={15} className="text-red-500" />
            <span className="text-sm font-semibold text-red-900">Échéances échues &lt; 45 j</span>
          </div>
          <div className="text-3xl font-bold text-red-900 mt-2">{nbEchues}</div>
          <div className="text-xs text-red-700 mt-1">
            {nbSortis} dossier{nbSortis > 1 ? "s" : ""} sorti{nbSortis > 1 ? "s" : ""} de l'indicateur (≥ J+45)
          </div>
        </Link>
      </div>
    </Card>
  );
}
