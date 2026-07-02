"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Eye, FileSpreadsheet, Printer, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier, StatutDossier, DeviseTrade, ProduitTrade } from "@/domain/consultation";
import Button from "@/components/ui/Button";
import CollapsibleFilterPanel from "@/components/ui/CollapsibleFilterPanel";
import Shell from "@/components/Shell";
import ClientSearchModal from "@/components/ui/ClientSearchModal";

const STATUTS: StatutDossier[] = ["En cours", "Expiré", "Annulé"];
const DEVISES: DeviseTrade[] = ["EUR", "USD", "GBP", "MAD", "JPY", "CHF"];
const PRODUITS: ProduitTrade[] = ["ILC", "IRD", "ERD", "ELC", "FIN"];

const PRODUIT_LABELS: Record<string, string> = {
  ILC: "CREDOC IMPORT",
  IRD: "REMDOC IMPORT",
  ERD: "REMDOC EXPORT",
  ELC: "CREDOC EXPORT",
  FIN: "FINANCEMENT",
};

const statutClasses: Record<StatutDossier, string> = {
  "En cours": "badge-statut-en-cours",
  "Expiré": "badge-statut-expire",
  "Annulé": "badge-statut-annule",
};

export default function ConsultationDossiersPage() {
  const dossiers = dossiersData as Dossier[];

  const [refBancaire, setRefBancaire] = useState("");
  const [statut, setStatut] = useState<StatutDossier | "">("");
  const [clientQuery, setClientQuery] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [devise, setDevise] = useState<DeviseTrade | "">("");
  const [refClient, setRefClient] = useState("");
  const [produit, setProduit] = useState<ProduitTrade | "">("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [sortKey, setSortKey] = useState<keyof Dossier>("dateCreation");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    let items = dossiers.filter((d) => {
      if (refBancaire.trim() && !d.id.toLowerCase().includes(refBancaire.toLowerCase())) return false;
      if (statut && d.statut !== statut) return false;
      if (clientQuery.trim() && !d.client.nom.toLowerCase().includes(clientQuery.toLowerCase())) return false;
      if (dateDebut && new Date(d.dateCreation) < new Date(dateDebut)) return false;
      if (dateFin && new Date(d.dateCreation) > new Date(dateFin)) return false;
      if (montantMin && d.montant < parseFloat(montantMin)) return false;
      if (montantMax && d.montant > parseFloat(montantMax)) return false;
      if (devise && d.devise !== devise) return false;
      if (refClient.trim() && !d.client.compte.toLowerCase().includes(refClient.toLowerCase())) return false;
      if (produit && d.produit !== produit) return false;
      return true;
    });

    items.sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [dossiers, refBancaire, statut, clientQuery, dateDebut, dateFin, montantMin, montantMax, devise, refClient, produit, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [refBancaire, statut, clientQuery, dateDebut, dateFin, montantMin, montantMax, devise, refClient, produit]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function resetFilters() {
    setRefBancaire("");
    setStatut("");
    setClientQuery("");
    setDateDebut("");
    setDateFin("");
    setMontantMin("");
    setMontantMax("");
    setDevise("");
    setRefClient("");
    setProduit("");
    setPage(1);
  }

  const header = (label: string, key: keyof Dossier) => (
    <button
      className="flex items-center gap-1 uppercase tracking-wider"
      onClick={() => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSortKey(key);
          setSortDir("asc");
        }
      }}
    >
      {label}
      {sortKey === key && (sortDir === "asc" ? " ▲" : " ▼")}
    </button>
  );

  function exportToExcel() {
    const data = filtered;
    const rows = data.map((d) => ({
      Référence: d.id,
      "Référence Client": d.client.compte,
      Produit: PRODUIT_LABELS[d.produit] || d.produit,
      Client: d.client.nom,
      Compte: d.client.compte,
      Montant: d.montant,
      Devise: d.devise,
      "Date création": new Date(d.dateCreation).toLocaleDateString("fr-FR"),
      Statut: d.statut,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dossiers");
    XLSX.writeFile(wb, `dossiers_trade_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportToPDF() {
    const data = filtered;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Résultat de la recherche — Dossiers Trade", 14, 20);
    doc.setFontSize(10);
    doc.text(`Exporté le ${new Date().toLocaleDateString("fr-FR")} — ${data.length} dossier(s)`, 14, 28);
    const body = data.map((d) => [
      d.id,
      d.client.compte,
      PRODUIT_LABELS[d.produit] || d.produit,
      d.client.nom,
      d.client.compte,
      d.montant.toLocaleString("fr-FR"),
      d.devise,
      new Date(d.dateCreation).toLocaleDateString("fr-FR"),
      d.statut,
    ]);
    (doc as any).autoTable({
      startY: 34,
      head: [["Référence", "Référence Client", "Produit", "Client", "Compte", "Montant", "Devise", "Date création", "Statut"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [232, 114, 42], textColor: 255 },
    });
    doc.save(`dossiers_trade_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <h1 className="text-display">Liste des dossiers Trade</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportToExcel}>
              <FileSpreadsheet size={16} />
              Exporter Excel
            </Button>
            <Button variant="secondary" onClick={exportToPDF}>
              <Printer size={16} />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Filtres rétractables */}
        <CollapsibleFilterPanel
          isOpen={isFilterOpen}
          onSearch={() => {}}
          onReset={resetFilters}
        >
          <div className="space-y-4">
            {/* Ligne 1: Référence bancaire, Référence client, Client / Compte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">RÉFÉRENCE BANCAIRE</label>
                <input
                  value={refBancaire}
                  onChange={(e) => setRefBancaire(e.target.value)}
                  placeholder="Ex. ILC%  (commence par ILC)"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-label">RÉFÉRENCE CLIENT</label>
                <input
                  value={refClient}
                  onChange={(e) => setRefClient(e.target.value)}
                  placeholder="Ex. CL%  (commence par CL)"
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

            {/* Ligne 2: Produit, Devise, Statut */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">PRODUIT</label>
                <select
                  className="input w-full"
                  value={produit}
                  onChange={(e) => setProduit(e.target.value as ProduitTrade | "")}
                >
                  <option value="">Tous les produits</option>
                  {PRODUITS.map((p) => (
                    <option key={p} value={p}>{PRODUIT_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label">DEVISE</label>
                <select
                  className="input w-full"
                  value={devise}
                  onChange={(e) => setDevise(e.target.value as DeviseTrade | "")}
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
                  onChange={(e) => setStatut(e.target.value as StatutDossier | "")}
                >
                  <option value="">Tous les statuts</option>
                  {STATUTS.map((s) => (
                    <option key={s} value={s}>{s}</option>
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
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> dossier(s) trouvé(s)
          </div>
        </div>

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{header("Référence bancaire", "id")}</th>
                <th>{header("Référence client", "client")}</th>
                <th>{header("Produit", "produit")}</th>
                <th>{header("Client / Compte", "client")}</th>
                <th className="text-right">{header("Montant", "montant")}</th>
                <th>{header("Devise", "devise")}</th>
                <th>Correspondant bancaire</th>
                <th>{header("Date création", "dateCreation")}</th>
                <th>{header("Statut", "statut")}</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((d) => (
                <tr key={d.id} className="cursor-pointer hover:bg-orange-50/30">
                  <td>
                    <Link href={`/consultation/dossiers/${d.id}`} className="font-medium hover:underline text-orange-500">{d.id}</Link>
                  </td>
                  <td>
                    <Link href={`/consultation/dossiers/${d.id}`} className="font-medium hover:underline text-orange-500">{d.client.compte}</Link>
                  </td>
                  <td><span className="badge-produit">{PRODUIT_LABELS[d.produit] || d.produit}</span></td>
                  <td>
                    <div className="text-sm font-medium text-gray-900">{d.client.nom}</div>
                    <div className="text-xs text-gray-600">{d.client.compte}</div>
                  </td>
                  <td className="text-sm font-medium text-gray-900 text-right">{d.montant.toLocaleString("fr-FR")}</td>
                  <td className="text-sm text-gray-600">{d.devise}</td>
                  <td className="text-xs text-gray-600">{d.banqueCorrespondante}</td>
                  <td className="text-xs text-gray-600">{new Date(d.dateCreation).toLocaleDateString("fr-FR")}</td>
                  <td><span className={statutClasses[d.statut]}>{d.statut}</span></td>
                  <td className="text-center">
                    <Link href={`/consultation/dossiers/${d.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-orange-50 transition text-orange-500" title="Consulter le détail">
                      <Eye size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-gray-400 py-8">
                    <div className="text-sm">Aucun dossier ne correspond à vos critères.</div>
                    <button onClick={resetFilters} className="text-orange-500 text-xs hover:underline mt-1">Réinitialiser les filtres</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col items-center gap-2 pt-2">
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1">
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition"
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  title="Première page"
                >
                  «
                </button>
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  title="Page précédente"
                >
                  ‹
                </button>
                <span className="px-3 text-sm text-gray-900">
                  Page {page} sur {totalPages}
                </span>
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  title="Page suivante"
                >
                  ›
                </button>
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-300 text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:text-gray-600 transition"
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  title="Dernière page"
                >
                  »
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ClientSearchModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientSelect={(client) => {
          setClientQuery(client.nom);
          setRefClient(client.compte);
        }}
      />
    </Shell>
  );
}
