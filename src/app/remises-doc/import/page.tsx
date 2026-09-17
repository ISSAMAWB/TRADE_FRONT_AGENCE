"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { FileSpreadsheet, Plus, Inbox, Search, History, Pencil, X } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  PRODUIT_IRD_LABEL, MOTIF_RETOUR_CENTRALISATION_LABEL,
  MODALITE_LABEL, STATUT_PAIEMENT_LABEL, ETAT_ECHEANCE_LABEL, etatEcheance,
} from "@/domain/labels";
import type { StatutCourrierWorkflow, CourrierIrd } from "@/domain/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";
import CollapsibleFilterPanel from "@/components/ui/CollapsibleFilterPanel";
import ClientReferentielSearchModal from "@/components/ui/ClientReferentielSearchModal";

type CorbeilleKey = "TOUS" | "EN_PREPARATION" | "A_VALIDER_AGENCE" | "A_CORRIGER" | "ENVOYES";

const CORBEILLE_DEFS: { key: CorbeilleKey; label: string; filter: ((c: CourrierIrd) => boolean) | null }[] = [
  { key: "TOUS",             label: "Tous",              filter: null },
  { key: "EN_PREPARATION",   label: "Brouillon",         filter: c => c.statut_workflow === "EN_PREPARATION" },
  { key: "A_VALIDER_AGENCE", label: "À valider agence",  filter: c => c.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" },
  { key: "A_CORRIGER",       label: "À corriger",        filter: c => c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION" },
  { key: "ENVOYES",          label: "Envoyés",           filter: c => ["EN_ATTENTE_VALIDATION_CTN", "VALIDEE_CTN", "ENVOYE_CTN"].includes(c.statut_workflow) },
];

const DEVISES = ["EUR", "USD", "MAD", "GBP", "JPY", "CHF"];

export default function CentralisationRDIListPage() {
  return (
    <Suspense fallback={<Shell><div className="text-sm text-gray-400 p-6">Chargement…</div></Shell>}>
      <CentralisationRDIListInner />
    </Suspense>
  );
}

function CentralisationRDIListInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const courriers = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);

  function nouvelleCentralisation() {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  }

  function handleCorriger(c: CourrierIrd) {
    if (c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN") {
      applyAction(c.id, "CORRIGER");
    }
    router.push(`/remises-doc/import/${c.id}`);
  }

  const corbeilleParam = sp.get("corbeille") as CorbeilleKey | null;
  const [corbeille, setCorbeille] = useState<CorbeilleKey>(
    corbeilleParam && CORBEILLE_DEFS.some(d => d.key === corbeilleParam) ? corbeilleParam : "TOUS"
  );
  const [isFilterOpen, setIsFilterOpen] = useState(sp.toString().length > 0);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  /* ---- critères de recherche (initialisés depuis l'URL) ---- */
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [reference, setReference] = useState(sp.get("ref") ?? "");
  const [refInterne, setRefInterne] = useState(sp.get("ref_interne") ?? "");
  const [refExterne, setRefExterne] = useState(sp.get("ref_externe") ?? "");
  const [clientQuery, setClientQuery] = useState(sp.get("client") ?? "");
  const [statuts, setStatuts] = useState<StatutCourrierWorkflow[]>(
    (sp.get("statut")?.split(",").filter(Boolean) ?? []) as StatutCourrierWorkflow[]
  );
  const [devise, setDevise] = useState(sp.get("devise") ?? "");
  const [montantMin, setMontantMin] = useState(sp.get("montant_min") ?? "");
  const [montantMax, setMontantMax] = useState(sp.get("montant_max") ?? "");
  const [dateDebut, setDateDebut] = useState(sp.get("date_debut") ?? "");
  const [dateFin, setDateFin] = useState(sp.get("date_fin") ?? "");
  const [agence, setAgence] = useState(sp.get("agence") ?? "");
  const [typeRetour, setTypeRetour] = useState(sp.get("type_retour") ?? "");
  const [modalite, setModalite] = useState(sp.get("modalite") ?? "");
  const [statutPaiement, setStatutPaiement] = useState(sp.get("statut_paiement") ?? "");
  const [etatEch, setEtatEch] = useState(sp.get("etat_echeance") ?? "");
  const [echeanceDebut, setEcheanceDebut] = useState(sp.get("echeance_du") ?? "");
  const [echeanceFin, setEcheanceFin] = useState(sp.get("echeance_au") ?? "");
  const [derniereAction, setDerniereAction] = useState(sp.get("derniere_action") ?? "");

  const agences = useMemo(
    () => Array.from(new Set(courriers.map(c => c.agence_reception).filter(Boolean))).sort(),
    [courriers]
  );

  const counts = useMemo(() => {
    const c: Record<CorbeilleKey, number> = { TOUS: courriers.length, EN_PREPARATION: 0, A_VALIDER_AGENCE: 0, A_CORRIGER: 0, ENVOYES: 0 };
    for (const cr of courriers) {
      for (const def of CORBEILLE_DEFS) {
        if (def.filter && def.filter(cr)) c[def.key]++;
      }
    }
    return c;
  }, [courriers]);

  const filtered = useMemo(() => {
    const def = CORBEILLE_DEFS.find(d => d.key === corbeille);
    let items = courriers;
    if (def?.filter) items = items.filter(def.filter);

    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(c =>
        c.reference_courrier.toLowerCase().includes(needle) ||
        (c.reference_interne ?? "").toLowerCase().includes(needle) ||
        (c.reference_externe ?? "").toLowerCase().includes(needle) ||
        (c.client ?? "").toLowerCase().includes(needle)
      );
    }
    if (reference.trim()) {
      items = items.filter(c => c.reference_courrier.toLowerCase().includes(reference.trim().toLowerCase()));
    }
    if (refInterne.trim()) {
      items = items.filter(c => (c.reference_interne ?? "").toLowerCase().includes(refInterne.trim().toLowerCase()));
    }
    if (refExterne.trim()) {
      items = items.filter(c => (c.reference_externe ?? "").toLowerCase().includes(refExterne.trim().toLowerCase()));
    }
    if (clientQuery.trim()) {
      items = items.filter(c => (c.client ?? "").toLowerCase().includes(clientQuery.trim().toLowerCase()));
    }
    if (statuts.length > 0) items = items.filter(c => statuts.includes(c.statut_workflow));
    if (devise) items = items.filter(c => c.devise === devise);
    if (montantMin) items = items.filter(c => (c.montant ?? 0) >= parseFloat(montantMin));
    if (montantMax) items = items.filter(c => (c.montant ?? 0) <= parseFloat(montantMax));
    if (dateDebut) items = items.filter(c => new Date(c.date_reception) >= new Date(dateDebut));
    if (dateFin) items = items.filter(c => new Date(c.date_reception) <= new Date(dateFin + "T23:59:59"));
    if (agence) items = items.filter(c => c.agence_reception === agence);
    if (typeRetour) items = items.filter(c => c.retours.some(r => r.type_retour === typeRetour));
    if (modalite) items = items.filter(c => c.modalite === modalite);
    if (statutPaiement) items = items.filter(c => c.statut_paiement === statutPaiement);
    if (etatEch) items = items.filter(c => etatEcheance(c.date_echeance) === etatEch);
    if (echeanceDebut) items = items.filter(c => c.date_echeance && new Date(c.date_echeance) >= new Date(echeanceDebut));
    if (echeanceFin) items = items.filter(c => c.date_echeance && new Date(c.date_echeance) <= new Date(echeanceFin + "T23:59:59"));
    if (derniereAction) items = items.filter(c => new Date(c.updated_at) >= new Date(derniereAction));

    return items;
  }, [courriers, corbeille, q, reference, refInterne, refExterne, clientQuery, statuts, devise,
      montantMin, montantMax, dateDebut, dateFin, agence, typeRetour, modalite, statutPaiement,
      etatEch, echeanceDebut, echeanceFin, derniereAction]);

  function resetFilters() {
    setQ(""); setReference(""); setRefInterne(""); setRefExterne(""); setClientQuery("");
    setStatuts([]); setDevise(""); setMontantMin(""); setMontantMax("");
    setDateDebut(""); setDateFin(""); setAgence(""); setTypeRetour("");
    setModalite(""); setStatutPaiement(""); setEtatEch("");
    setEcheanceDebut(""); setEcheanceFin(""); setDerniereAction("");
  }

  const isCorrigeable = (c: CourrierIrd) => c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION";

  /* ---- chips filtres actifs ---- */
  const chips: { label: string; clear: () => void }[] = [];
  if (q.trim()) chips.push({ label: `Recherche : ${q}`, clear: () => setQ("") });
  if (reference.trim()) chips.push({ label: `Réf. : ${reference}`, clear: () => setReference("") });
  if (refInterne.trim()) chips.push({ label: `Réf. interne : ${refInterne}`, clear: () => setRefInterne("") });
  if (refExterne.trim()) chips.push({ label: `Réf. externe : ${refExterne}`, clear: () => setRefExterne("") });
  if (clientQuery.trim()) chips.push({ label: `Client : ${clientQuery}`, clear: () => setClientQuery("") });
  for (const st of statuts) chips.push({ label: `Statut : ${COURRIER_WORKFLOW_LABEL[st]}`, clear: () => setStatuts(s => s.filter(x => x !== st)) });
  if (devise) chips.push({ label: `Devise : ${devise}`, clear: () => setDevise("") });
  if (montantMin) chips.push({ label: `Montant ≥ ${montantMin}`, clear: () => setMontantMin("") });
  if (montantMax) chips.push({ label: `Montant ≤ ${montantMax}`, clear: () => setMontantMax("") });
  if (dateDebut || dateFin) chips.push({ label: `Réception : ${dateDebut || "…"} → ${dateFin || "…"}`, clear: () => { setDateDebut(""); setDateFin(""); } });
  if (agence) chips.push({ label: `Agence : ${agence}`, clear: () => setAgence("") });
  if (typeRetour) chips.push({ label: typeRetour === "RETOUR_CTN" ? "Retour CTN" : "Retour Agence", clear: () => setTypeRetour("") });
  if (modalite) chips.push({ label: `Modalité : ${MODALITE_LABEL[modalite as keyof typeof MODALITE_LABEL]}`, clear: () => setModalite("") });
  if (statutPaiement) chips.push({ label: `Paiement : ${STATUT_PAIEMENT_LABEL[statutPaiement as keyof typeof STATUT_PAIEMENT_LABEL]}`, clear: () => setStatutPaiement("") });
  if (etatEch) chips.push({ label: `Échéance : ${ETAT_ECHEANCE_LABEL[etatEch as keyof typeof ETAT_ECHEANCE_LABEL]}`, clear: () => setEtatEch("") });
  if (echeanceDebut || echeanceFin) chips.push({ label: `Échéance : ${echeanceDebut || "…"} → ${echeanceFin || "…"}`, clear: () => { setEcheanceDebut(""); setEcheanceFin(""); } });
  if (derniereAction) chips.push({ label: `Dernière action ≥ ${derniereAction}`, clear: () => setDerniereAction("") });

  function toggleStatut(s: StatutCourrierWorkflow) {
    setStatuts(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-display flex items-center gap-2">
            <FileSpreadsheet className="text-orange-500" size={24} /> Centralisation des REMDOC Import
          </h1>
          <Button onClick={nouvelleCentralisation}>
            <Plus size={16} /> Nouvelle centralisation
          </Button>
        </div>

        {/* Corbeilles */}
        <Card>
          <div className="card-header flex items-center gap-2">
            <Inbox size={16} className="text-orange-500" />
            <div className="text-title">Corbeilles</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-gray-200">
            {CORBEILLE_DEFS.map(d => {
              const active = corbeille === d.key;
              return (
                <button
                  key={d.key}
                  onClick={() => setCorbeille(d.key)}
                  className={
                    "px-4 py-3 text-left bg-white hover:bg-orange-50 transition " +
                    (active ? "ring-2 ring-inset ring-orange-500" : "")
                  }
                >
                  <div className="text-caption">{d.label}</div>
                  <div className="text-lg font-semibold mt-1 text-gray-900">{counts[d.key]}</div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Filtres rétractables */}
        <CollapsibleFilterPanel
          isOpen={isFilterOpen}
          onSearch={() => {}}
          onReset={resetFilters}
        >
          <div className="space-y-4">
            {/* Ligne 1 : recherche globale, référence centralisation, client */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">RECHERCHE GLOBALE</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Dossier, client, référence…"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">RÉFÉRENCE CENTRALISATION</label>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex. CIR-2026-…"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">CLIENT / TIRÉ</label>
                <div className="flex gap-2">
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Rechercher par nom"
                    className="input flex-1"
                  />
                  <button
                    onClick={() => setClientSearchOpen(true)}
                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center shrink-0"
                    title="Rechercher dans le référentiel client"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 2 : réf interne, réf externe, agence */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">RÉFÉRENCE INTERNE</label>
                <input
                  value={refInterne}
                  onChange={(e) => setRefInterne(e.target.value)}
                  placeholder="Ex. INT/…"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">RÉFÉRENCE EXTERNE</label>
                <input
                  value={refExterne}
                  onChange={(e) => setRefExterne(e.target.value)}
                  placeholder="Ex. EXT/…"
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">AGENCE</label>
                <select className="input w-full" value={agence} onChange={(e) => setAgence(e.target.value)}>
                  <option value="">Toutes les agences</option>
                  {agences.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {/* Ligne 3 : statuts (multi-sélection) */}
            <div>
              <label className="text-label">STATUT</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => {
                  const active = statuts.includes(k as StatutCourrierWorkflow);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleStatut(k as StatutCourrierWorkflow)}
                      className={
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition " +
                        (active
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50")
                      }
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ligne 4 : devise, montants */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">DEVISE</label>
                <select
                  className="input w-full"
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                >
                  <option value="">Toutes les devises</option>
                  {DEVISES.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label">MONTANT MIN</label>
                <input
                  type="number"
                  value={montantMin}
                  onChange={(e) => setMontantMin(e.target.value)}
                  placeholder="Min"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">MONTANT MAX</label>
                <input
                  type="number"
                  value={montantMax}
                  onChange={(e) => setMontantMax(e.target.value)}
                  placeholder="Max"
                  className="input w-full"
                />
              </div>
            </div>

            {/* Ligne 5 : type retour, modalité, statut paiement */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">TYPE DE RETOUR</label>
                <select className="input w-full" value={typeRetour} onChange={(e) => setTypeRetour(e.target.value)}>
                  <option value="">Tous</option>
                  <option value="RETOUR_AGENCE">Retour Agence</option>
                  <option value="RETOUR_CTN">Retour CTN</option>
                </select>
              </div>
              <div>
                <label className="text-label">MODALITÉ</label>
                <select className="input w-full" value={modalite} onChange={(e) => setModalite(e.target.value)}>
                  <option value="">Toutes</option>
                  {Object.entries(MODALITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-label">STATUT PAIEMENT</label>
                <select className="input w-full" value={statutPaiement} onChange={(e) => setStatutPaiement(e.target.value)}>
                  <option value="">Tous</option>
                  {Object.entries(STATUT_PAIEMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Ligne 6 : date réception, dernière action */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">DATE RÉCEPTION — DU</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">DATE RÉCEPTION — AU</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">DERNIÈRE ACTION À PARTIR DU</label>
                <input
                  type="date"
                  value={derniereAction}
                  onChange={(e) => setDerniereAction(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Ligne 7 : échéances */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">DATE D'ÉCHÉANCE — DU</label>
                <input
                  type="date"
                  value={echeanceDebut}
                  onChange={(e) => setEcheanceDebut(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">DATE D'ÉCHÉANCE — AU</label>
                <input
                  type="date"
                  value={echeanceFin}
                  onChange={(e) => setEcheanceFin(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="text-label">ÉTAT DE L'ÉCHÉANCE</label>
                <select className="input w-full" value={etatEch} onChange={(e) => setEtatEch(e.target.value)}>
                  <option value="">Tous</option>
                  {Object.entries(ETAT_ECHEANCE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>
        </CollapsibleFilterPanel>

        {/* Chips filtres actifs */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-orange-100 text-orange-800 px-3 py-1 text-xs font-medium">
                {chip.label}
                <button onClick={chip.clear} className="hover:text-orange-950" title="Retirer ce filtre">
                  <X size={12} />
                </button>
              </span>
            ))}
            <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-orange-600 hover:underline">
              Tout effacer
            </button>
          </div>
        )}

        {/* Compteur */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> centralisation(s) trouvée(s)
          </div>
        </div>

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence centralisation</th>
                <th>Produit</th>
                <th>Client / Tiré</th>
                <th className="text-right">Montant</th>
                <th>Devise</th>
                <th>Date réception</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="cursor-pointer hover:bg-orange-50/30">
                  <td className="whitespace-nowrap">
                    <Link href={`/remises-doc/import/${c.id}`} className="font-medium hover:underline text-orange-500">
                      {c.reference_courrier}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap"><span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span></td>
                  <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                  <td className="text-right whitespace-nowrap">{c.montant ? c.montant.toLocaleString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                  <td className="whitespace-nowrap">{c.devise ?? <span className="text-gray-400">—</span>}</td>
                  <td className="text-xs whitespace-nowrap">{new Date(c.date_reception).toLocaleDateString("fr-FR")}</td>
                  <td className="whitespace-nowrap">
                    <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                    {isCorrigeable(c) && c.dernier_retour && (
                      <div className="text-[10px] text-red-600 mt-1">
                        {MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {isCorrigeable(c) ? (
                        <button className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1" onClick={() => handleCorriger(c)}>
                          <Pencil size={12} /> Corriger
                        </button>
                      ) : c.statut_workflow === "EN_PREPARATION" ? (
                        <Link href={`/remises-doc/import/${c.id}`}>
                          <button className="btn-outline text-xs h-8 px-3 inline-flex items-center gap-1">
                            <Pencil size={12} /> Continuer la saisie
                          </button>
                        </Link>
                      ) : (
                        <Link href={`/remises-doc/import/${c.id}`}>
                          <button className="btn-ghost text-xs h-8 px-2">Consulter</button>
                        </Link>
                      )}
                      <Link href={`/remises-doc/import/${c.id}/historique`} className="relative group">
                        <button className="btn-ghost h-8 w-8 !p-0 grid place-items-center text-ink-500">
                          <History size={15} />
                        </button>
                        <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1 z-20 hidden group-hover:block whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white shadow-lg">
                          Consulter l'historique
                        </span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-gray-400 py-8">
                    <div className="text-sm">Aucune centralisation ne correspond à vos critères.</div>
                    <button onClick={resetFilters} className="text-orange-500 text-xs hover:underline mt-1">Réinitialiser les filtres</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale recherche client référentiel */}
      {clientSearchOpen && (
        <ClientReferentielSearchModal
          initialQuery={clientQuery}
          onSelect={(c) => { setClientQuery(c.nom); setClientSearchOpen(false); }}
          onClose={() => setClientSearchOpen(false)}
        />
      )}
    </Shell>
  );
}
