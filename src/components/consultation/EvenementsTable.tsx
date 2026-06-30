import { useMemo, useState } from "react";
import { Eye, History } from "lucide-react";
import StatutBadge from "./StatutBadge";
import NatureBadge from "./NatureBadge";
import NatureFilter from "./NatureFilter";
import type { EvenementTrade, NatureEvenement } from "@/domain/consultation-detail";

export default function EvenementsTable({
  evenements,
  onSelect,
}: {
  evenements: EvenementTrade[];
  onSelect: (e: EvenementTrade) => void;
}) {
  const [selectedNatures, setSelectedNatures] = useState<NatureEvenement[]>([]);

  const filtered = useMemo(() => {
    if (selectedNatures.length === 0) return evenements;
    return evenements.filter((e) => selectedNatures.includes(e.nature));
  }, [evenements, selectedNatures]);

  return (
    <div className="bg-white rounded-xl border border-ink-100 p-5">
      <div className="flex items-center justify-between border-b border-ink-100 pb-2 mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#E8590C] flex items-center gap-2">
          <History size={14} /> Événements du dossier
        </div>
        <div className="flex items-center gap-2">
          <NatureFilter natures={evenements.map((e) => e.nature)} selected={selectedNatures} onChange={setSelectedNatures} />
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-medium bg-ink-100 text-ink-700 rounded-full">{filtered.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 bg-ink-50">
              <th className="px-3 py-2 rounded-tl-md">Référence</th>
              <th className="px-3 py-2">Nature</th>
              <th className="px-3 py-2 text-right">Montant</th>
              <th className="px-3 py-2">Date de création</th>
              <th className="px-3 py-2">Statut</th>
              <th className="px-3 py-2 text-center rounded-tr-md">Détail</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.reference}
                onClick={() => onSelect(e)}
                tabIndex={0}
                role="button"
                onKeyDown={(k) => k.key === "Enter" && onSelect(e)}
                className="cursor-pointer hover:bg-[#FDF0E8]/30 border-b border-ink-100 transition"
              >
                <td className="px-3 py-2 font-mono text-xs">{e.reference}</td>
                <td className="px-3 py-2"><NatureBadge nature={e.nature} /></td>
                <td className="px-3 py-2 text-right text-ink-700">
                  {e.montant !== null ? e.montant.toLocaleString("fr-FR") : <span className="text-ink-300">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-ink-700">{new Date(e.dateCreation).toLocaleDateString("fr-FR")}</td>
                <td className="px-3 py-2"><StatutBadge statut={e.statut} /></td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onSelect(e); }}
                    aria-label="Voir le détail de l'événement"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-[#FDF0E8] transition text-[#E8590C]"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
