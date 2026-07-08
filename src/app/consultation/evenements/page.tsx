"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { Clock, Filter, X } from "lucide-react";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier, ProduitTrade } from "@/domain/consultation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";

const PRODUITS: ProduitTrade[] = ["ILC", "IRD", "ERD", "ELC", "FIN"];

export default function EvenementsPage() {
  const dossiers = dossiersData as Dossier[];
  const [produits, setProduits] = useState<ProduitTrade[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const evenements = useMemo(() => {
    const all = dossiers.flatMap((d) =>
      d.evenements.map((e) => ({
        ...e,
        dossierId: d.id,
        clientNom: d.client.nom,
        produit: d.produit,
      }))
    );
    return all
      .filter((e) => {
        if (produits.length > 0 && !produits.includes(e.produit)) return false;
        if (typeFilter && !e.type.toLowerCase().includes(typeFilter.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dossiers, produits, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(evenements.length / pageSize));
  const paged = evenements.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [produits, typeFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function toggleProduit(p: ProduitTrade) {
    setProduits((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  }

  function resetFilters() {
    setProduits([]);
    setTypeFilter("");
    setPage(1);
  }

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-display flex items-center gap-2">
          <Clock className="text-orange-500" size={24} /> Événements récents
        </h1>

        <Card>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            <div className="flex items-center gap-1 flex-wrap">
              {PRODUITS.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleProduit(p)}
                  className={
                    "px-2 py-1 rounded-lg text-xs border transition " +
                    (produits.includes(p)
                      ? "text-white border-orange-500 bg-orange-500"
                      : "bg-white border-gray-300 text-gray-900 hover:border-orange-500")
                  }
                >
                  {p}
                </button>
              ))}
            </div>
            <input
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Type d'événement"
              className="input w-48"
            />
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              <X size={14} /> Réinitialiser
            </Button>
          </div>
        </Card>

        <div className="table-container">
          <div className="px-4 py-3 border-b border-gray-200 text-caption">{evenements.length} événement(s)</div>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Dossier</th>
                <th>Produit</th>
                <th>Client</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((e) => (
                <tr key={`${e.dossierId}-${e.date}-${e.type}`}>
                  <td className="text-sm text-gray-600">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <Link href={`/consultation/dossiers/${e.dossierId}`} className="font-medium hover:underline text-orange-500">
                      {e.dossierId}
                    </Link>
                  </td>
                  <td>
                    <span className="badge-produit">{e.produit}</span>
                  </td>
                  <td className="text-sm">{e.clientNom}</td>
                  <td>{e.type}</td>
                  <td>{e.statut}</td>
                  <td>{e.montant ? e.montant.toLocaleString("fr-FR") : "—"}</td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-400 py-8">Aucun événement.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {evenements.length > 0 && (
          <div className="flex flex-col items-center gap-2 pt-4">
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
            <div className="text-xs text-gray-500">
              {evenements.length} événement(s) — {paged.length} sur cette page
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
