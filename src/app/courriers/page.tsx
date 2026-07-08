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
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";

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
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-display flex items-center gap-2">
            <Mail className="text-orange-500" size={24} /> Centralisation des courriers IRD
          </h1>
          <Button onClick={nouveauCourrier}>
            <Plus size={16} /> Nouveau courrier
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

        {/* Filtres */}
        <Card>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par référence ou client"
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value as "TOUS" | StatutCourrierWorkflow)}
              className="input"
            >
              <option value="TOUS">Tous les statuts</option>
              {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={ocrFilter}
              onChange={(e) => setOcrFilter(e.target.value as "TOUS" | StatutOcrCourrier)}
              className="input"
            >
              <option value="TOUS">Tous les OCR</option>
              {Object.entries(OCR_COURRIER_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <Button variant="secondary" size="sm" onClick={() => { setQuery(""); setStatutFilter("TOUS"); setOcrFilter("TOUS"); }}>
              <Filter size={14} /> Réinitialiser
            </Button>
          </div>
        </Card>

        {/* Tableau */}
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Montant</th>
                <th>OCR</th>
                <th>Statut</th>
                <th>Validation agence</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const enCours = isOcrEnCours(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/courriers/${c.id}`} className="font-medium hover:underline text-orange-500">
                        {c.reference_courrier}
                      </Link>
                    </td>
                    <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                    <td>{c.montant ? `${c.montant.toLocaleString("fr-FR")} ${c.devise ?? ""}` : <span className="text-gray-400">—</span>}</td>
                    <td>
                      {enCours ? (
                        <span className="badge-primary inline-flex items-center gap-1"><Loader2 size={10} className="animate-spin" />OCR en cours</span>
                      ) : (
                        <span className={badgeForOcrCourrier(c.statut_ocr)}>{OCR_COURRIER_LABEL[c.statut_ocr]}</span>
                      )}
                    </td>
                    <td><span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span></td>
                    <td className="text-xs">{c.date_validation_agence ? new Date(c.date_validation_agence).toLocaleDateString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center text-gray-400 py-8">Aucun courrier dans cette corbeille.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
}
