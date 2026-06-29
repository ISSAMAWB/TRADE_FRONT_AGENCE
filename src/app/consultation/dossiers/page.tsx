"use client";

import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { useTomStore } from "@/store/useTomStore";
import { Search, X, ArrowRight, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, SlidersHorizontal, Eye, FileSpreadsheet, Printer } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dossiersData from "@/mocks/dossiers.json";
import eventsByProductData from "@/mocks/eventsByProduct.json";
import type { Dossier, ProduitTrade, StatutDossier, DeviseTrade } from "@/domain/consultation";

const PRODUITS: ProduitTrade[] = ["ILC", "IRD", "ERD", "ELC", "FSA"];
const PRODUIT_LABELS: Record<ProduitTrade, string> = {
  ILC: "ILC — Crédoc Import",
  IRD: "IRD — Remdoc Import",
  ERD: "ERD — Remdoc Export",
  ELC: "ELC — Crédoc Export",
  FSA: "FSA",
};
const DEVISES: DeviseTrade[] = ["EUR", "USD", "GBP", "MAD", "JPY", "CHF"];
const STATUTS: StatutDossier[] = ["En cours", "Expiré", "Annulé"];
const EVENTS_BY_PRODUCT = eventsByProductData as Record<ProduitTrade, string[]>;

const statutClasses: Record<StatutDossier, string> = {
  "En cours": "badge-statut-en-cours",
  "Expiré": "badge-statut-expire",
  "Annulé": "badge-statut-annule",
};

// Recherche type SQL LIKE : "%" est un joker (ex. "ILC%" => commence par ILC).
// Sans "%", on effectue une recherche "contient".
function likeMatch(value: string, pattern: string): boolean {
  const p = pattern.trim().toLowerCase();
  if (!p) return true;
  const v = value.toLowerCase();
  if (!p.includes("%")) return v.includes(p);
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
  return new RegExp(`^${escaped}$`).test(v);
}

export default function ConsultationDossiersPage() {
  const dossiers = dossiersData as Dossier[];
  const agence = useTomStore((s) => s.courriersIrd[0]?.agence_reception ?? "Agence Casablanca");

  const [produits, setProduits] = useState<ProduitTrade[]>([]);
  const [statuts, setStatuts] = useState<StatutDossier[]>([]);
  const [evenements, setEvenements] = useState<string[]>([]);
  const [refBancaire, setRefBancaire] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientSuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [devise, setDevise] = useState<DeviseTrade>("EUR");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [sortKey, setSortKey] = useState<keyof Dossier | "client">("dateCreation");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 3;

  // Sync events when products change
  useEffect(() => {
    if (produits.length === 0) {
      setEvenements([]);
      return;
    }
    const available = new Set(produits.flatMap((p) => EVENTS_BY_PRODUCT[p]));
    setEvenements((prev) => prev.filter((e) => available.has(e)));
  }, [produits]);

  type ClientSuggestion = { nom: string; compte: string; ice: string; code: string; ville?: string; rc?: string };
  const uniqueClients = useMemo(() => {
    const map = new Map<string, ClientSuggestion>();
    dossiers.forEach((d) => {
      if (!map.has(d.client.compte)) {
        map.set(d.client.compte, { ...d.client, ville: d.codeAgence.includes("RABAT") ? "Rabat" : "Casablanca", rc: `RC-${d.client.code.slice(-4)}` });
      }
    });
    return Array.from(map.values());
  }, [dossiers]);

  const clientSuggestions = useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q || selectedClient) return [];
    return uniqueClients
      .filter((c) => c.nom.toLowerCase().includes(q) || c.compte.toLowerCase().includes(q) || c.ice.toLowerCase().includes(q))
      .slice(0, 6);
  }, [uniqueClients, clientQuery, selectedClient]);

  const filtered = useMemo(() => {
    let items = dossiers.filter((d) => {
      if (refBancaire.trim() && !likeMatch(d.id, refBancaire)) return false;
      if (produits.length > 0 && !produits.includes(d.produit)) return false;
      if (selectedClient) {
        if (d.client.compte !== selectedClient.compte) return false;
      } else if (clientQuery.trim()) {
        const q = clientQuery.trim().toLowerCase();
        const match = d.client.nom.toLowerCase().includes(q) || d.client.compte.toLowerCase().includes(q) || d.client.ice.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statuts.length > 0 && !statuts.includes(d.statut)) return false;
      if (evenements.length > 0) {
        const evMatch = evenements.includes(d.evenementCourant ?? "") || d.evenements.some((e) => evenements.includes(e.type));
        if (!evMatch) return false;
      }
      const min = parseFloat(montantMin);
      const max = parseFloat(montantMax);
      if (d.devise !== devise) return false;
      if (!isNaN(min) && d.montant < min) return false;
      if (!isNaN(max) && d.montant > max) return false;
      if (dateDebut && new Date(d.dateCreation) < new Date(dateDebut)) return false;
      if (dateFin && new Date(d.dateCreation) > new Date(dateFin)) return false;
      return true;
    });

    items.sort((a, b) => {
      let va: any = sortKey === "client" ? a.client.nom : a[sortKey];
      let vb: any = sortKey === "client" ? b.client.nom : b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return items;
  }, [dossiers, refBancaire, produits, selectedClient, clientQuery, statuts, evenements, montantMin, montantMax, devise, dateDebut, dateFin, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  // Revenir à la page 1 quand le nombre de résultats change (filtres/recherche)
  useEffect(() => {
    setPage(1);
  }, [refBancaire, produits, selectedClient, clientQuery, statuts, evenements, montantMin, montantMax, devise, dateDebut, dateFin]);

  // S'assurer que la page courante reste valide
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Numéros de page à afficher (avec ellipses)
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  }, [page, totalPages]);

  function resetFilters() {
    setProduits([]);
    setStatuts([]);
    setEvenements([]);
    setRefBancaire("");
    setClientQuery("");
    setSelectedClient(null);
    setMontantMin("");
    setMontantMax("");
    setDevise("EUR");
    setDateDebut("");
    setDateFin("");
    setPage(1);
  }

  function removeClient() {
    setSelectedClient(null);
    setClientQuery("");
  }

  function selectClient(c: ClientSuggestion) {
    setSelectedClient(c);
    setClientQuery(c.nom);
    setShowSuggestions(false);
  }

  const hasActiveFilters =
    refBancaire.trim() || produits.length > 0 || statuts.length > 0 || evenements.length > 0 || selectedClient || clientQuery.trim() || montantMin || montantMax || dateDebut || dateFin;

  const header = (label: string, key: keyof Dossier | "client") => (
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
      Produit: d.produit,
      Client: d.client.nom,
      Compte: d.client.compte,
      Montant: d.montant,
      Devise: d.devise,
      "Date création": new Date(d.dateCreation).toLocaleDateString("fr-FR"),
      Statut: d.statut,
      "Événement courant": d.evenementCourant ?? "—",
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
      d.produit,
      d.client.nom,
      d.client.compte,
      d.montant.toLocaleString("fr-FR"),
      d.devise,
      new Date(d.dateCreation).toLocaleDateString("fr-FR"),
      d.statut,
      d.evenementCourant ?? "—",
    ]);
    (doc as any).autoTable({
      startY: 34,
      head: [["Référence", "Produit", "Client", "Compte", "Montant", "Devise", "Date création", "Statut", "Événement"]],
      body,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [232, 114, 42], textColor: 255 },
    });
    doc.save(`dossiers_trade_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Consultation</span>
      </div>

      {/* En-tête */}
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Consultation — Vue consolidée</h1>
        <p className="text-sm text-ink-500 mt-1">Tous clients · Tous produits Trade Finance · {agence}</p>
      </div>

      {/* Filtres */}
      <div className="card p-4 space-y-4" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
        {/* Ligne 1 — Client / Compte + recherche avancée */}
        <div className="relative">
          <label className="label">CLIENT / COMPTE</label>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value);
                if (selectedClient) setSelectedClient(null);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Rechercher par nom, n° compte ou ICE"
              className="input pl-10 h-10 w-full focus:border-[#E8722A] focus:ring-[#E8722A]"
              style={{ borderRadius: "8px 0 0 8px" }}
            />
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="h-10 px-3 text-white flex items-center gap-1"
              style={{ background: "#E8722A", borderRadius: "0 8px 8px 0" }}
              title="Recherche client avancée"
            >
              <SlidersHorizontal size={16} />
            </button>
            {selectedClient && (
              <button onClick={removeClient} className="absolute right-14 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                <X size={14} />
              </button>
            )}
          </div>
          {showSuggestions && clientSuggestions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-ink-200 shadow-lg overflow-hidden" style={{ borderRadius: 8 }}>
              {clientSuggestions.map((c) => (
                <button
                  key={c.compte}
                  onClick={() => selectClient(c)}
                  className="w-full text-left px-4 py-2 hover:bg-brand-50 border-b border-ink-100 last:border-0"
                >
                  <div className="text-sm font-medium text-ink-800">{c.nom}</div>
                  <div className="text-[11px] text-ink-500">N° compte {c.compte} · ICE {c.ice}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ligne 1bis — Référence bancaire (recherche LIKE) */}
        <div>
          <label className="label">RÉFÉRENCE BANCAIRE</label>
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={refBancaire}
              onChange={(e) => setRefBancaire(e.target.value.replace(/[^A-Za-z0-9%]/g, "").toUpperCase())}
              placeholder="Ex. ILC%  (commence par ILC)"
              className="input pl-10 h-10 w-full focus:border-[#E8722A] focus:ring-[#E8722A]"
              style={{ borderRadius: 8 }}
            />
            {refBancaire && (
              <button onClick={() => setRefBancaire("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                <X size={14} />
              </button>
            )}
          </div>
          <p className="text-[10px] text-ink-400 mt-1">Champ alphanumérique · utilisez « % » comme caractère générique (ex. « ILC% », « %0042 »)</p>
        </div>

        {/* Ligne 2 — Produit + Statut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MultiSelect label="PRODUIT" placeholder="Tous les produits" options={PRODUITS.map((p) => ({ value: p, label: PRODUIT_LABELS[p] }))} selected={produits} onChange={setProduits} />
          <MultiSelect label="STATUT" placeholder="Tous les statuts" options={STATUTS.map((s) => ({ value: s, label: s }))} selected={statuts} onChange={setStatuts} />
        </div>

        {/* Ligne 3 — Événement cascadant */}
        <div>
          <div className="flex items-center gap-2">
            <label className="label mb-0">ÉVÉNEMENT</label>
            <span className="text-[10px] text-ink-400">— dépend du produit sélectionné</span>
          </div>
          <EventSelect produits={produits} selected={evenements} onChange={setEvenements} />
        </div>

        {/* Ligne 4 — Montant + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Montant [Min] – [Max] [Devise] */}
          <div>
            <label className="label">MONTANT</label>
            <div className="flex items-center border border-ink-300 bg-white overflow-hidden h-10 focus-within:border-[#E8722A] focus-within:shadow-[0_0_0_3px_rgba(232,114,42,0.12)] transition" style={{ borderRadius: 8 }}>
              <input type="number" value={montantMin} onChange={(e) => setMontantMin(e.target.value)} placeholder="Min" className="h-full w-full px-3 text-sm text-right outline-none" />
              <span className="px-2 text-ink-400">–</span>
              <input type="number" value={montantMax} onChange={(e) => setMontantMax(e.target.value)} placeholder="Max" className="h-full w-full px-3 text-sm text-right outline-none" />
              <select value={devise} onChange={(e) => setDevise(e.target.value as DeviseTrade)} className="h-full px-3 text-sm bg-ink-50 border-l border-ink-300 outline-none">
                {DEVISES.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          </div>

          {/* Date Du → Au */}
          <div>
            <label className="label">DATE DE CRÉATION</label>
            <div className="flex items-center gap-2">
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} className="input h-10 flex-1 focus:border-[#E8722A] focus:ring-[#E8722A]" />
              <ArrowRight size={16} className="text-ink-400" />
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} className="input h-10 flex-1 focus:border-[#E8722A] focus:ring-[#E8722A]" />
            </div>
          </div>
        </div>

        {/* Ligne 5 — Barre outils */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-3 border-t border-ink-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-ink-500">Filtres actifs :</span>
            {refBancaire.trim() && <Chip label={`Réf. bancaire : ${refBancaire.trim()}`} onRemove={() => setRefBancaire("")} />}
            {produits.length > 0 && <Chip label={`Produit : ${produits.join(", ")}`} onRemove={() => setProduits([])} />}
            {statuts.length > 0 && <Chip label={`Statut : ${statuts.join(", ")}`} onRemove={() => setStatuts([])} />}
            {evenements.length > 0 && <Chip label={`Événement : ${evenements.join(", ")}`} onRemove={() => setEvenements([])} />}
            {selectedClient && <Chip label={`Client : ${selectedClient.nom}`} onRemove={removeClient} />}
            {clientQuery.trim() && !selectedClient && <Chip label={`Recherche : ${clientQuery.trim()}`} onRemove={() => setClientQuery("")} />}
            {(montantMin || montantMax) && <Chip label={`Montant : ${montantMin || "0"} – ${montantMax || "∞"} ${devise}`} onRemove={() => { setMontantMin(""); setMontantMax(""); }} />}
            {(dateDebut || dateFin) && <Chip label={`Date : ${dateDebut || "..."} → ${dateFin || "..."}`} onRemove={() => { setDateDebut(""); setDateFin(""); }} />}
            {!hasActiveFilters && <span className="text-[11px] text-ink-400 italic">Aucun filtre actif</span>}
          </div>
          <button onClick={resetFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-ink-300 rounded hover:border-[#E8722A] hover:text-[#E8722A] transition">
            <X size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {/* Compteur + Export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm text-ink-600">
          <span className="font-semibold text-ink-800">{filtered.length}</span> dossier(s) trouvé(s)
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition"
            style={{ background: "#1D6F42" }}
            title="Exporter sous Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} /> Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold text-white rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition"
            style={{ background: "#E8722A" }}
            title="Imprimer / exporter en PDF"
          >
            <Printer size={15} /> Impression
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>{header("Référence", "id")}</th>
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
              <tr key={d.id} className="cursor-pointer hover:bg-[#FDF0E8]/30">
                <td>
                  <Link href={`/consultation/dossiers/${d.id}`} className="font-medium hover:underline" style={{ color: "#E8722A" }}>{d.id}</Link>
                </td>
                <td><span className="badge-produit">{d.produit}</span></td>
                <td>
                  <div className="text-sm font-medium text-ink-800">{d.client.nom}</div>
                  <div className="text-[11px] text-ink-500">{d.client.compte}</div>
                </td>
                <td className="text-sm font-medium text-ink-800 text-right">{d.montant.toLocaleString("fr-FR")}</td>
                <td className="text-sm text-ink-700">{d.devise}</td>
                <td className="text-xs text-ink-700">{d.banqueCorrespondante}</td>
                <td className="text-xs text-ink-700">{new Date(d.dateCreation).toLocaleDateString("fr-FR")}</td>
                <td><span className={statutClasses[d.statut]}>{d.statut}</span></td>
                <td className="text-center">
                  <Link href={`/consultation/dossiers/${d.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#FDF0E8] transition" style={{ color: "#E8722A" }} title="Consulter le détail">
                    <Eye size={18} />
                  </Link>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-ink-500 py-10">
                  <div className="text-sm">Aucun dossier ne correspond à vos critères.</div>
                  <button onClick={resetFilters} className="text-[#E8722A] text-xs hover:underline mt-1">Réinitialiser les filtres</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination — centrée en bas de la page */}
      {filtered.length > 0 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1">
              <button
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-ink-200 text-ink-600 hover:border-[#E8722A] hover:text-[#E8722A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-ink-200 disabled:hover:text-ink-600 transition"
                disabled={page === 1}
                onClick={() => setPage(1)}
                title="Première page"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-ink-200 text-ink-600 hover:border-[#E8722A] hover:text-[#E8722A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-ink-200 disabled:hover:text-ink-600 transition"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Page précédente"
              >
                <ChevronLeft size={16} />
              </button>
              {pageNumbers.map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1.5 text-ink-400 text-xs select-none">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-xs font-medium border transition ${
                      p === page
                        ? "text-white border-transparent"
                        : "text-ink-600 border-ink-200 hover:border-[#E8722A] hover:text-[#E8722A]"
                    }`}
                    style={p === page ? { background: "#E8722A" } : undefined}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-ink-200 text-ink-600 hover:border-[#E8722A] hover:text-[#E8722A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-ink-200 disabled:hover:text-ink-600 transition"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Page suivante"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-ink-200 text-ink-600 hover:border-[#E8722A] hover:text-[#E8722A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-ink-200 disabled:hover:text-ink-600 transition"
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                title="Dernière page"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
          <div className="text-xs text-ink-500">
            Page <span className="font-semibold text-ink-700">{page}</span> sur <span className="font-semibold text-ink-700">{totalPages}</span>
          </div>
        </div>
      )}

      {showAdvanced && (
        <AdvancedSearchModal
          clients={uniqueClients}
          onSelect={(c) => { selectClient(c); setShowAdvanced(false); }}
          onClose={() => setShowAdvanced(false)}
        />
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full" style={{ background: "#FDF0E8", color: "#E8722A" }}>
      {label}
      <button onClick={onRemove} className="hover:opacity-70"><X size={12} /></button>
    </span>
  );
}

function MultiSelect<T extends string>({
  label, placeholder, options, selected, onChange,
}: { label: string; placeholder: string; options: { value: T; label: string }[]; selected: T[]; onChange: (vals: T[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const allSelected = selected.length === options.length && options.length > 0;
  const display =
    selected.length === 0 ? placeholder
    : selected.length === 1 ? options.find((o) => o.value === selected[0])?.label
    : selected.length === 2 ? selected.map((v) => options.find((o) => o.value === v)?.label).join(", ")
    : `${selected.length} sélectionnés`;

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(options.map((o) => o.value));
  }

  function toggleOne(val: T) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between h-10 px-3 bg-white border text-sm transition ${open ? "border-[#E8722A] shadow-[0_0_0_3px_rgba(232,114,42,0.12)]" : "border-ink-300 hover:border-ink-400"}`}
        style={{ borderRadius: 8 }}
      >
        <span className={selected.length === 0 ? "text-ink-400" : "text-ink-800"}>{display}</span>
        <ChevronDown size={16} className="text-ink-400 transition" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-ink-200 shadow-lg overflow-hidden" style={{ borderRadius: 8 }}>
          <label className="flex items-center gap-2 px-3 py-2 border-b border-ink-100 cursor-pointer hover:bg-ink-50">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#E8722A]" />
            <span className="text-sm font-medium text-ink-700">Tous</span>
          </label>
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-ink-50">
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggleOne(o.value)} className="accent-[#E8722A]" />
              <span className="text-sm text-ink-700">{o.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function EventSelect({
  produits, selected, onChange,
}: { produits: ProduitTrade[]; selected: string[]; onChange: (vals: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const disabled = produits.length === 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const groups = useMemo(() => {
    return produits.map((p) => ({ produit: p, events: EVENTS_BY_PRODUCT[p] }));
  }, [produits]);

  const allEvents = useMemo(() => groups.flatMap((g) => g.events), [groups]);
  const allSelected = selected.length === allEvents.length && allEvents.length > 0;

  const display = disabled
    ? "Sélectionnez d'abord un produit"
    : selected.length === 0
    ? "Tous les événements"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} sélectionnés`;

  function toggleAll() {
    if (allSelected) onChange([]);
    else onChange(allEvents);
  }

  function toggleOne(val: string) {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between h-10 px-3 border text-sm transition ${disabled ? "bg-ink-100 text-ink-400 cursor-not-allowed border-ink-200" : open ? "bg-white border-[#E8722A] shadow-[0_0_0_3px_rgba(232,114,42,0.12)]" : "bg-white border-ink-300 hover:border-ink-400"}`}
        style={{ borderRadius: 8 }}
      >
        <span>{display}</span>
        <ChevronDown size={16} className="text-ink-400 transition" style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-ink-200 shadow-lg overflow-hidden" style={{ borderRadius: 8 }}>
          <label className="flex items-center gap-2 px-3 py-2 border-b border-ink-100 cursor-pointer hover:bg-ink-50">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[#E8722A]" />
            <span className="text-sm font-medium text-ink-700">Tous</span>
          </label>
          {groups.map((g) => (
            <div key={g.produit}>
              <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#E8722A", background: "#FFF4E6" }}>{g.produit}</div>
              {g.events.map((e) => (
                <label key={`${g.produit}-${e}`} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-ink-50">
                  <input type="checkbox" checked={selected.includes(e)} onChange={() => toggleOne(e)} className="accent-[#E8722A]" />
                  <span className="text-sm text-ink-700">{e}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdvancedSearchModal({
  clients, onSelect, onClose,
}: { clients: { nom: string; compte: string; ice: string; code: string }[]; onSelect: (c: any) => void; onClose: () => void }) {
  const [nom, setNom] = useState("");
  const [compte, setCompte] = useState("");

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  const results = useMemo(() => {
    return clients.filter((c) => {
      if (nom && !c.nom.toLowerCase().includes(nom.toLowerCase())) return false;
      if (compte && !c.compte.toLowerCase().includes(compte.toLowerCase())) return false;
      return true;
    });
  }, [clients, nom, compte]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-[500px] bg-white shadow-xl p-5 space-y-4" style={{ borderRadius: 8 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "#E8722A" }}><Search size={18} /> Recherche client avancée</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Raison sociale / Nom</label>
            <input value={nom} onChange={(e) => setNom(e.target.value)} className="input h-9 w-full" placeholder="Nom client" />
          </div>
          <div>
            <label className="label">N° de compte</label>
            <input value={compte} onChange={(e) => setCompte(e.target.value)} className="input h-9 w-full" placeholder="007 780 ..." />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium border border-ink-300 rounded hover:bg-ink-50">Annuler</button>
          <button onClick={() => { setNom(""); setCompte(""); }} className="px-4 py-2 text-sm font-medium border border-ink-300 rounded hover:bg-ink-50">Réinitialiser</button>
        </div>

        <div className="border-t border-ink-100 pt-3">
          <div className="text-xs text-ink-500 mb-2">{results.length} résultat(s)</div>
          <div className="max-h-60 overflow-auto border border-ink-100 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-[11px] uppercase text-ink-500">
                <tr>
                  <th className="text-left px-3 py-2">Client</th>
                  <th className="text-left px-3 py-2">N° compte</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {results.map((c) => (
                  <tr key={c.compte} className="border-b border-ink-100 hover:bg-[#FDF0E8] cursor-pointer" onClick={() => onSelect(c)}>
                    <td className="px-3 py-2 font-medium">{c.nom}</td>
                    <td className="px-3 py-2">{c.compte}</td>
                    <td className="px-3 py-2">
                      <button onClick={() => onSelect(c)} className="text-xs font-medium" style={{ color: "#E8722A" }}>Sélectionner</button>
                    </td>
                  </tr>
                ))}
                {results.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-ink-500 text-xs">Aucun résultat.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
