"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FileCheck, Search } from "lucide-react";
import Shell from "@/components/Shell";
import CollapsibleFilterPanel from "@/components/ui/CollapsibleFilterPanel";
import ClientSearchModal from "@/components/ui/ClientSearchModal";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import type { DossierTrade, MontantAvecDevise } from "@/domain/consultation-detail";

const STATUT_LABEL: Record<string, string> = {
  EN_COURS: "En cours",
  EXPIRE: "Expiré",
  VALIDE: "Validé",
  ANNULE: "Annulé",
};
const STATUT_BADGE: Record<string, string> = {
  EN_COURS: "badge-blue",
  EXPIRE: "badge-amber",
  VALIDE: "badge-green",
  ANNULE: "badge-gray",
};

const DEVISES = ["EUR", "USD", "GBP", "MAD", "JPY", "CHF", "CNY", "TND"];

/** Conditions de remise éligibles à l'acceptation / aval : contre acceptation, pour aval, autre */
function conditionEligible(d: DossierTrade): boolean {
  const c = String(d.donnees["conditionsRemiseDocuments"] ?? "").toLowerCase();
  return c.includes("acceptation") || c.includes("aval") || c === "autre";
}

function montantRemise(d: DossierTrade): MontantAvecDevise | null {
  const m = d.donnees["montantRemise"];
  return m && typeof m === "object" && "valeur" in m ? (m as MontantAvecDevise) : null;
}

export default function AcceptationAvalImportPage() {
  const router = useRouter();
  const dossiers = dossiersDetail as DossierTrade[];


  /* ---- critères de recherche ---- */
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [refOperation, setRefOperation] = useState("");
  const [refCorrespondant, setRefCorrespondant] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [devise, setDevise] = useState("");
  const [statut, setStatut] = useState("");
  const [modalite, setModalite] = useState("");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  // Remises documentaires import dont la condition de remise est Contre acceptation / Pour aval / Autre
  const eligibles = useMemo(
    () => dossiers.filter(d => d.produit === "IRD" && conditionEligible(d)),
    [dossiers]
  );

  const modalites = useMemo(
    () => Array.from(new Set(eligibles.map(d => String(d.donnees["conditionsRemiseDocuments"] ?? "")))).filter(Boolean),
    [eligibles]
  );

  const filtered = useMemo(() => {
    let items = eligibles;
    if (refOperation.trim()) items = items.filter(d => d.reference.toLowerCase().includes(refOperation.trim().toLowerCase()));
    if (refCorrespondant.trim()) items = items.filter(d => String(d.donnees["referenceCorrespondant"] ?? "").toLowerCase().includes(refCorrespondant.trim().toLowerCase()));
    if (clientQuery.trim()) {
      const needle = clientQuery.trim().toLowerCase();
      items = items.filter(d =>
        (d.clientInfo?.raisonSociale ?? d.client ?? "").toLowerCase().includes(needle) ||
        (d.clientInfo?.numeroCompte ?? "").toLowerCase().includes(needle)
      );
    }
    if (devise) items = items.filter(d => montantRemise(d)?.devise === devise);
    if (statut) items = items.filter(d => String(d.statut) === statut);
    if (modalite) items = items.filter(d => String(d.donnees["conditionsRemiseDocuments"] ?? "") === modalite);
    if (montantMin) items = items.filter(d => (montantRemise(d)?.valeur ?? 0) >= parseFloat(montantMin));
    if (montantMax) items = items.filter(d => (montantRemise(d)?.valeur ?? 0) <= parseFloat(montantMax));
    if (dateDebut) items = items.filter(d => d.donnees["dateEcheance"] && new Date(String(d.donnees["dateEcheance"])) >= new Date(dateDebut));
    if (dateFin) items = items.filter(d => d.donnees["dateEcheance"] && new Date(String(d.donnees["dateEcheance"])) <= new Date(dateFin + "T23:59:59"));
    return items;
  }, [eligibles, refOperation, refCorrespondant, clientQuery, devise, statut,
      modalite, montantMin, montantMax, dateDebut, dateFin]);

  function resetFilters() {
    setRefOperation(""); setRefCorrespondant(""); setClientQuery("");
    setDevise(""); setStatut(""); setModalite("");
    setMontantMin(""); setMontantMax(""); setDateDebut(""); setDateFin("");
  }

  function ouvrirAcceptation(d: DossierTrade) {
    router.push(`/consultation/dossiers/${d.reference}/evenements/nouveau?nature=${encodeURIComponent("Acceptation & Aval de la traite")}`);
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
            <FileCheck className="text-orange-500" size={24} /> Acceptation &amp; Aval — REMDOC Import
          </h1>
        </div>

        {/* Filtres rétractables */}
        <CollapsibleFilterPanel
          isOpen={isFilterOpen}
          onSearch={() => {}}
          onReset={resetFilters}
        >
          <div className="space-y-4">
            {/* Ligne 1: Référence opération, Référence correspondant, Client / Compte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">REF DE L'OPERATION</label>
                <input
                  value={refOperation}
                  onChange={(e) => setRefOperation(e.target.value)}
                  placeholder="Ex. IRD%  (commence par IRD)"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">REF CORRESPONDANT</label>
                <input
                  value={refCorrespondant}
                  onChange={(e) => setRefCorrespondant(e.target.value)}
                  placeholder="Ex. CORR%  (commence par CORR)"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">CLIENT / COMPTE</label>
                <div className="flex gap-2">
                  <input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Rechercher par nom, n° compte"
                    className="input flex-1"
                  />
                  <button
                    onClick={() => setIsClientModalOpen(true)}
                    className="h-10 w-10 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                    title="Rechercher un client"
                  >
                    <Search size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Ligne 2: Devise, Statut, Modalité */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">DEVISE</label>
                <select
                  className="input w-full"
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                >
                  <option value="">Toutes les devises</option>
                  {DEVISES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label">STATUT</label>
                <select
                  className="input w-full"
                  value={statut}
                  onChange={(e) => setStatut(e.target.value)}
                >
                  <option value="">Tous les statuts</option>
                  {Object.entries(STATUT_LABEL).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label">MODALITÉ</label>
                <select
                  className="input w-full"
                  value={modalite}
                  onChange={(e) => setModalite(e.target.value)}
                >
                  <option value="">Toutes les modalités</option>
                  {modalites.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ligne 3: Montant min, Montant max, Date début, Date fin */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <label className="text-label">DATE DÉBUT</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">DATE FIN</label>
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
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{filtered.length}</span> remise(s) trouvée(s)
        </div>

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence remise</th>
                <th>Produit</th>
                <th>Client / Tiré</th>
                <th className="text-right">Montant</th>
                <th>Devise</th>
                <th>Modalité</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => {
                const montant = montantRemise(d);
                const modaliteD = String(d.donnees["conditionsRemiseDocuments"] ?? "");
                const echeance = d.donnees["dateEcheance"] ? String(d.donnees["dateEcheance"]) : null;
                return (
                  <tr key={`${d.reference}-${d.statut}`}>
                    <td className="font-medium text-gray-900">{d.reference}</td>
                    <td><span className="badge-produit">REMDOC Import</span></td>
                    <td>{d.clientInfo?.raisonSociale ?? d.client ?? <span className="text-gray-400">—</span>}</td>
                    <td className="text-right">{montant ? montant.valeur.toLocaleString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                    <td>{montant?.devise ?? <span className="text-gray-400">—</span>}</td>
                    <td className="text-xs">{modaliteD || <span className="text-gray-400">—</span>}</td>
                    <td className="text-xs">{echeance ? new Date(echeance).toLocaleDateString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                    <td>
                      <span className={STATUT_BADGE[String(d.statut)] ?? "badge-gray"}>{STATUT_LABEL[String(d.statut)] ?? d.statut}</span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn-primary !py-1.5 !px-3 text-xs"
                        onClick={() => ouvrirAcceptation(d)}
                        disabled={String(d.statut) !== "EN_COURS"}
                        title={String(d.statut) !== "EN_COURS" ? "Dossier non en cours" : "Initier une acceptation / aval"}
                      >
                        Initier l'acceptation
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-8">
                    <div className="text-sm">Aucune remise ne correspond aux critères.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal recherche client */}
      <ClientSearchModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientSelect={(client) => {
          setClientQuery(client.nom);
          setIsClientModalOpen(false);
        }}
      />
    </Shell>
  );
}
