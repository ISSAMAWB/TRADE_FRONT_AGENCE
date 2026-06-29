"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Mail, Plus, Search, Filter, Inbox, Loader2 } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  badgeForOcrCourrier, OCR_COURRIER_LABEL,
} from "@/domain/labels";
import type { StatutCourrierWorkflow, CourrierIrd, StatutOcrCourrier } from "@/domain/types";

type CorbeilleKey = "TOUS" | "EN_PREPARATION" | "A_VALIDER_AGENCE" | "ENVOYES";

const CORBEILLE_DEFS: { key: CorbeilleKey; label: string; filter: ((c: CourrierIrd) => boolean) | null }[] = [
  { key: "TOUS",            label: "Tous",              filter: null },
  { key: "EN_PREPARATION",  label: "En préparation",    filter: c => c.statut_workflow === "EN_PREPARATION" },
  { key: "A_VALIDER_AGENCE",label: "À valider agence",  filter: c => c.statut_workflow === "EN_ATTENTE_VALIDATION_AGENCE" },
  { key: "ENVOYES",         label: "Envoyés",           filter: c => c.statut_workflow === "ENVOYE_CTN" },
];

function isOcrEnCours(c: CourrierIrd): boolean {
  return c.documents.some(d => d.statut_ocr === "EN_COURS");
}

export default function CourriersListPage() {
  const router = useRouter();
  const courriers = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);

  function nouveauCourrier() {
    const c = createCourrierIrd();
    router.push(`/courriers/${c.id}`);
  }

  const [corbeille, setCorbeille] = useState<CorbeilleKey>("TOUS");
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<"TOUS" | StatutCourrierWorkflow>("TOUS");
  const [ocrFilter, setOcrFilter] = useState<"TOUS" | StatutOcrCourrier>("TOUS");

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
    if (statutFilter !== "TOUS") items = items.filter(c => c.statut_workflow === statutFilter);
    if (ocrFilter !== "TOUS") items = items.filter(c => c.statut_ocr === ocrFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      items = items.filter(c =>
        c.reference_courrier.toLowerCase().includes(q) ||
        (c.client ?? "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [courriers, corbeille, statutFilter, ocrFilter, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <span className="text-ink-500">Remise Documentaire Import</span>
        <span>/</span>
        <span className="text-ink-700 font-medium">Centralisation des courriers IRD</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mail className="text-brand-500" size={20} /> Centralisation des courriers IRD
        </h1>
        <button className="btn-primary" onClick={nouveauCourrier}>
          <Plus size={16} /> Nouveau courrier
        </button>
      </div>

      {/* Corbeilles */}
      <div className="card p-0">
        <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
          <Inbox size={14} className="text-brand-500" />
          <div className="font-semibold text-sm">Corbeilles</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-100">
          {CORBEILLE_DEFS.map(d => {
            const active = corbeille === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setCorbeille(d.key)}
                className={
                  "px-4 py-3 text-left bg-white hover:bg-brand-50 transition " +
                  (active ? "ring-2 ring-inset ring-brand-500" : "")
                }
              >
                <div className="text-[11px] text-ink-500">{d.label}</div>
                <div className="text-lg font-semibold mt-1">{counts[d.key]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtres */}
      <div className="card p-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Référence, client…"
            className="input pl-8 h-9 w-full"
          />
        </div>
        <Filter size={14} className="text-ink-500" />
        <select
          className="input h-9 w-48"
          value={statutFilter}
          onChange={e => setStatutFilter(e.target.value as any)}
        >
          <option value="TOUS">Tous les statuts</option>
          {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          className="input h-9 w-44"
          value={ocrFilter}
          onChange={e => setOcrFilter(e.target.value as any)}
        >
          <option value="TOUS">Indicateur OCR</option>
          {Object.entries(OCR_COURRIER_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-ink-500">{filtered.length} courrier(s)</div>
      </div>

      {/* Tableau */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Référence courrier</th>
              <th>Date réception</th>
              <th>Client</th>
              <th>Montant</th>
              <th>Indicateur OCR</th>
              <th>Statut</th>
              <th>Date validation agence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const enCours = isOcrEnCours(c);
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/courriers/${c.id}`} className="text-brand-600 font-medium hover:underline">
                      {c.reference_courrier}
                    </Link>
                  </td>
                  <td className="text-xs">{new Date(c.date_reception).toLocaleDateString("fr-FR")}</td>
                  <td>{c.client ?? <span className="text-ink-300">—</span>}</td>
                  <td>{c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-ink-300">—</span>}</td>
                  <td>
                    {enCours ? (
                      <span className="badge-blue inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>
                    ) : (
                      <span className={badgeForOcrCourrier(c.statut_ocr)}>{OCR_COURRIER_LABEL[c.statut_ocr]}</span>
                    )}
                  </td>
                  <td><span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span></td>
                  <td className="text-xs">{c.date_validation_agence ? new Date(c.date_validation_agence).toLocaleDateString("fr-FR") : <span className="text-ink-300">—</span>}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-ink-500 py-8">Aucun courrier dans cette corbeille.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
