import { useState } from "react";
import { Search, Download, Clock, Eye } from "lucide-react";
import StatutBadge from "./StatutBadge";
import type { EvenementTrade } from "@/domain/consultation-detail";

interface EventTableProps {
  evenements: EvenementTrade[];
  filtreEvenement?: string;
  montantMin?: string;
  montantMax?: string;
  dateDebut?: string;
  dateFin?: string;
}

function formatMontant(valeur: number | null, devise: string): string {
  if (valeur === null || valeur === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valeur) + " " + devise;
}

function formatDate(valeur: string): string {
  const date = new Date(valeur);
  if (isNaN(date.getTime())) return valeur;
  return date.toLocaleDateString("fr-FR");
}

export default function EventTable({
  evenements,
  filtreEvenement = "",
  montantMin = "",
  montantMax = "",
  dateDebut = "",
  dateFin = "",
}: EventTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<EvenementTrade | null>(null);

  const filtered = evenements.filter((e) => {
    if (filtreEvenement && !e.nature.toLowerCase().includes(filtreEvenement.toLowerCase())) return false;
    if (searchQuery && !e.nature.toLowerCase().includes(searchQuery.toLowerCase()) && !e.reference.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (montantMin && e.montant !== null && e.montant < parseFloat(montantMin)) return false;
    if (montantMax && e.montant !== null && e.montant > parseFloat(montantMax)) return false;
    if (dateDebut && new Date(e.dateCreation) < new Date(dateDebut)) return false;
    if (dateFin && new Date(e.dateCreation) > new Date(dateFin)) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* En-tête */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 gap-4 flex-wrap">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700 flex items-center gap-2">
          <Clock size={16} className="text-orange-500" />
          Évènements du dossier
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-semibold bg-gray-900 text-white rounded-full">
            {filtered.length}
          </span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="input pl-10 w-56"
            />
          </div>
          <button className="btn-outline inline-flex items-center gap-2">
            <Download size={16} /> Exporter
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nature</th>
              <th className="text-right">Montant</th>
              <th>Date de création</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.reference}
                onClick={() => setSelected(e)}
                className="cursor-pointer"
              >
                <td className="text-sm font-medium text-orange-500">{e.reference}</td>
                <td className="text-sm">{e.nature}</td>
                <td className="text-sm text-right">{formatMontant(e.montant, e.devise)}</td>
                <td className="text-sm">{formatDate(e.dateCreation)}</td>
                <td><StatutBadge statut={e.statut} /></td>
                <td className="text-right">
                  <Eye size={16} className="text-gray-400 inline" />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-8">
                  Aucun évènement à afficher
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer latéral */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full max-w-md h-full overflow-auto shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700">Détail de l'évènement</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Référence</div>
                  <div className="text-sm font-medium text-orange-500">{selected.reference}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Statut</div>
                  <StatutBadge statut={selected.statut} />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Nature</div>
                  <div className="text-sm">{selected.nature}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Montant</div>
                  <div className="text-sm">{formatMontant(selected.montant, selected.devise)}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Date de création</div>
                  <div className="text-sm">{formatDate(selected.dateCreation)}</div>
                </div>
                {selected.datePaiement && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Date de paiement</div>
                    <div className="text-sm">{formatDate(selected.datePaiement)}</div>
                  </div>
                )}
              </div>
              {selected.uetr && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">UETR</div>
                  <div className="text-xs font-mono break-all">{selected.uetr}</div>
                </div>
              )}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Journal d'audit</div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div><strong>Utilisateur :</strong> Utilisateur responsable</div>
                  <div><strong>Service :</strong> Service Trade</div>
                  <div><strong>Commentaires :</strong> Aucun commentaire</div>
                  <div><strong>Message SWIFT :</strong> Non disponible</div>
                  <div><strong>Pièces jointes :</strong> Aucune pièce jointe</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
