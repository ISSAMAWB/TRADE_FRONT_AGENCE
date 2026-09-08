"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { FileSpreadsheet, Plus, Inbox, Search } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import type { StatutCourrierWorkflow, CourrierIrd } from "@/domain/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";
import CollapsibleFilterPanel from "@/components/ui/CollapsibleFilterPanel";
import ClientReferentielSearchModal from "@/components/ui/ClientReferentielSearchModal";

type CorbeilleKey = "TOUS" | "EN_PREPARATION" | "A_VALIDER_AGENCE" | "ENVOYES";

const CORBEILLE_DEFS: { key: CorbeilleKey; label: string; filter: ((c: CourrierIrd) => boolean) | null }[] = [
  { key: "TOUS",             label: "Tous",              filter: null },
  { key: "EN_PREPARATION",   label: "Brouillon",         filter: c => c.statut_workflow === "EN_PREPARATION" },
  { key: "A_VALIDER_AGENCE", label: "À valider agence",  filter: c => c.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" },
  { key: "ENVOYES",          label: "Envoyés",           filter: c => c.statut_workflow === "ENVOYE_CTN" },
];

const DEVISES = ["EUR", "USD", "MAD", "GBP", "JPY", "CHF"];

export default function CentralisationRDIListPage() {
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);

  function nouvelleCentralisation() {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  }

  const [corbeille, setCorbeille] = useState<CorbeilleKey>("TOUS");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);

  /* ---- critères de recherche ---- */
  const [reference, setReference] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [statut, setStatut] = useState<"" | StatutCourrierWorkflow>("");
  const [devise, setDevise] = useState("");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const counts = useMemo(() => {
    const c: Record<CorbeilleKey, number> = { TOUS: courriers.length, EN_PREPARATION: 0, A_VALIDER_AGENCE: 0, ENVOYES: 0 };
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

    if (reference.trim()) {
      items = items.filter(c => c.reference_courrier.toLowerCase().includes(reference.trim().toLowerCase()));
    }
    if (clientQuery.trim()) {
      items = items.filter(c => (c.client ?? "").toLowerCase().includes(clientQuery.trim().toLowerCase()));
    }
    if (statut) items = items.filter(c => c.statut_workflow === statut);
    if (devise) items = items.filter(c => c.devise === devise);
    if (montantMin) items = items.filter(c => (c.montant ?? 0) >= parseFloat(montantMin));
    if (montantMax) items = items.filter(c => (c.montant ?? 0) <= parseFloat(montantMax));
    if (dateDebut) items = items.filter(c => new Date(c.date_reception) >= new Date(dateDebut));
    if (dateFin) items = items.filter(c => new Date(c.date_reception) <= new Date(dateFin + "T23:59:59"));

    return items;
  }, [courriers, corbeille, reference, clientQuery, statut, devise, montantMin, montantMax, dateDebut, dateFin]);

  function resetFilters() {
    setReference("");
    setClientQuery("");
    setStatut("");
    setDevise("");
    setMontantMin("");
    setMontantMax("");
    setDateDebut("");
    setDateFin("");
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
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
            {/* Ligne 1 : Référence centralisation, Client/Tiré, Statut */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="text-label">STATUT</label>
                <select
                  className="input w-full"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value as StatutCourrierWorkflow | "")}
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 2 : Devise, Montant min, Montant max */}
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

            {/* Ligne 3 : Date réception début, Date réception fin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-label">DATE RÉCEPTION DÉBUT</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">DATE RÉCEPTION FIN</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
        </CollapsibleFilterPanel>

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
                <th>Validation agence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="cursor-pointer hover:bg-orange-50/30">
                  <td>
                    <Link href={`/remises-doc/import/${c.id}`} className="font-medium hover:underline text-orange-500">
                      {c.reference_courrier}
                    </Link>
                  </td>
                  <td><span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span></td>
                  <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                  <td className="text-right">{c.montant ? c.montant.toLocaleString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                  <td>{c.devise ?? <span className="text-gray-400">—</span>}</td>
                  <td className="text-xs">{new Date(c.date_reception).toLocaleDateString("fr-FR")}</td>
                  <td><span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span></td>
                  <td className="text-xs">{c.date_validation_agence ? new Date(c.date_validation_agence).toLocaleDateString("fr-FR") : <span className="text-gray-400">—</span>}</td>
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
