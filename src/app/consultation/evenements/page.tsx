"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Clock, Filter, X } from "lucide-react";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier, ProduitTrade } from "@/domain/consultation";

const PRODUITS: ProduitTrade[] = ["ILC", "IRD", "ERD", "ELC", "FSA"];

export default function EvenementsPage() {
  const dossiers = dossiersData as Dossier[];
  const [produits, setProduits] = useState<ProduitTrade[]>([]);
  const [typeFilter, setTypeFilter] = useState("");

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

  function toggleProduit(p: ProduitTrade) {
    setProduits((arr) => (arr.includes(p) ? arr.filter((x) => x !== p) : [...arr, p]));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/consultation/dossiers" className="hover:text-brand-600">Consultation</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Événements récents</span>
      </div>

      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Clock className="text-brand-500" size={20} /> Événements récents
      </h1>

      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <Filter size={14} className="text-ink-500" />
        <div className="flex items-center gap-1 flex-wrap">
          {PRODUITS.map((p) => (
            <button
              key={p}
              onClick={() => toggleProduit(p)}
              className={
                "px-2 py-1 rounded text-xs border transition " +
                (produits.includes(p)
                  ? "text-white border-[#E8722A]"
                  : "bg-white border-[#E5E7EB] text-ink-700 hover:border-[#E8722A]")
              }
              style={produits.includes(p) ? { background: "#E8722A" } : undefined}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          placeholder="Type d'événement"
          className="input h-9 w-48"
        />
        <button className="btn-outline h-9 text-xs" onClick={() => { setProduits([]); setTypeFilter(""); }}>
          <X size={14} /> Réinitialiser
        </button>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-ink-100 text-xs text-ink-500">{evenements.length} événement(s)</div>
        <table className="tbl">
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
            {evenements.map((e, idx) => (
              <tr key={`${e.id}-${idx}`}>
                <td className="text-xs">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                <td>
                  <Link href={`/consultation/dossiers/${e.dossierId}`} className="text-brand-600 font-medium hover:underline">
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
            {evenements.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-ink-500 py-8">Aucun événement.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
