"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { REFERENTIEL_CLIENTS } from "@/store/useTomStore";

export default function ClientReferentielSearchModal({
  initialQuery,
  onSelect,
  onClose,
}: {
  initialQuery: string;
  onSelect: (c: { id: string; nom: string; agence_rattachement: string }) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REFERENTIEL_CLIENTS.slice(0, 8);
    return REFERENTIEL_CLIENTS.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.identifiant.toLowerCase().includes(q) ||
      c.agence_rattachement.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card max-w-xl w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="font-semibold text-base mb-1">Recherche client référentiel</div>
        <p className="text-xs text-ink-500 mb-4">Sélectionnez un client du référentiel bancaire.</p>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            className="input pl-8 h-9 w-full"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher par nom, identifiant ou agence…"
            autoFocus
          />
        </div>
        <div className="border border-ink-100 rounded-md max-h-[300px] overflow-y-auto">
          <table className="tbl">
            <thead>
              <tr>
                <th>Nom client</th>
                <th>Identifiant</th>
                <th>Agence</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {results.map(c => (
                <tr key={c.id} className="hover:bg-brand-50/50 cursor-pointer" onClick={() => onSelect(c)}>
                  <td className="font-medium text-sm">{c.nom}</td>
                  <td className="text-xs text-ink-500">{c.identifiant}</td>
                  <td className="text-xs">{c.agence_rattachement}</td>
                  <td>
                    <button className="btn-outline text-xs h-7 px-2" onClick={() => onSelect(c)}>
                      Sélectionner
                    </button>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr><td colSpan={4} className="text-center text-ink-500 text-xs py-6">Aucun client trouvé.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="btn-outline" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
