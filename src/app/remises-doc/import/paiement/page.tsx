"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DollarSign, Inbox, X, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL,
  MODALITE_LABEL,
  STATUT_PAIEMENT_LABEL,
  badgeForStatutPaiement,
  badgeForCourrierWorkflow,
  PRODUIT_IRD_LABEL,
  etatEcheance,
  ETAT_ECHEANCE_LABEL,
  badgeForEtatEcheance,
} from "@/domain/labels";
import type {
  CourrierIrd, StatutPaiement, PartieOriginePaiement, PaiementIrd,
} from "@/domain/types";
import Card from "@/components/ui/Card";
import Shell from "@/components/Shell";

type CorbeilleKey = "TOUS" | StatutPaiement;

const CORBEILLE_DEFS: { key: CorbeilleKey; label: string; filter: ((c: CourrierIrd) => boolean) | null }[] = [
  { key: "TOUS",        label: "Tous",        filter: null },
  { key: "A_EFFECTUER", label: "À effectuer", filter: c => c.statut_paiement === "A_EFFECTUER" },
  { key: "EN_RETARD",   label: "En retard",   filter: c => c.statut_paiement === "EN_RETARD" },
  { key: "PARTIEL",     label: "Partiel",     filter: c => c.statut_paiement === "PARTIEL" },
  { key: "EFFECTUE",    label: "Effectué",    filter: c => c.statut_paiement === "EFFECTUE" },
];

const PARTIE_ORIGINE_OPTIONS: { value: PartieOriginePaiement; label: string }[] = [
  { value: "TIRE",               label: "Tiré" },
  { value: "TIREUR",             label: "Tireur" },
  { value: "BANQUE_REMETTANTE",  label: "Banque remettante" },
  { value: "AUTRE",              label: "Autre" },
];

export default function PaiementImportPage() {
  const courriers = useTomStore(s => s.courriersIrd);
  const initierPaiement = useTomStore(s => s.initierPaiementIrd);

  const [corbeille, setCorbeille] = useState<CorbeilleKey>("TOUS");
  const [courrierCible, setCourrierCible] = useState<CourrierIrd | null>(null);

  /* ---- formulaire d'initiation ---- */
  const [refPaiement, setRefPaiement] = useState("");
  const [partieOrigine, setPartieOrigine] = useState<PartieOriginePaiement>("TIRE");
  const [paiementRecuDe, setPaiementRecuDe] = useState("");
  const [dateReception, setDateReception] = useState("");
  const [partieAPayer, setPartieAPayer] = useState("");
  const [instruction, setInstruction] = useState("");

  const eligibles = useMemo(
    () => courriers.filter(c => c.statut_paiement != null),
    [courriers]
  );

  const counts = useMemo(() => {
    const c: Record<CorbeilleKey, number> = { TOUS: eligibles.length, A_EFFECTUER: 0, EN_RETARD: 0, PARTIEL: 0, EFFECTUE: 0 };
    for (const cr of eligibles) {
      for (const def of CORBEILLE_DEFS) {
        if (def.filter && def.filter(cr)) c[def.key]++;
      }
    }
    return c;
  }, [eligibles]);

  const filtered = useMemo(() => {
    const def = CORBEILLE_DEFS.find(d => d.key === corbeille);
    return def?.filter ? eligibles.filter(def.filter) : eligibles;
  }, [eligibles, corbeille]);

  function ouvrirInitiation(c: CourrierIrd) {
    setCourrierCible(c);
    setRefPaiement(c.paiement?.reference_paiement ?? "");
    setPartieOrigine(c.paiement?.partie_origine_paiement ?? "TIRE");
    setPaiementRecuDe(c.paiement?.paiement_recu_de ?? c.client ?? "");
    setDateReception(c.paiement?.date_reception ?? new Date().toISOString().slice(0, 10));
    setPartieAPayer(c.paiement?.partie_a_payer ?? "");
    setInstruction(c.paiement?.instruction ?? "");
  }

  function validerInitiation() {
    if (!courrierCible) return;
    const data: PaiementIrd = {
      reference_paiement: refPaiement || undefined,
      partie_origine_paiement: partieOrigine,
      paiement_recu_de: paiementRecuDe || undefined,
      date_reception: dateReception || undefined,
      partie_a_payer: partieAPayer || undefined,
      instruction: instruction || undefined,
    };
    initierPaiement(courrierCible.id, data);
    setCourrierCible(null);
  }

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-display flex items-center gap-2">
            <DollarSign className="text-orange-500" size={24} /> Paiement — REMDOC Import
          </h1>
        </div>

        {/* Corbeilles */}
        <Card>
          <div className="card-header flex items-center gap-2">
            <Inbox size={16} className="text-orange-500" />
            <div className="text-title">Corbeilles</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-gray-200">
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
                <th>Statut paiement</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => {
                const etat = etatEcheance(c.date_echeance);
                const dejaPaye = c.statut_paiement === "EFFECTUE";
                return (
                  <tr key={c.id}>
                    <td className="font-medium text-gray-900">{c.reference_courrier}</td>
                    <td><span className="badge-produit">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</span></td>
                    <td>{c.client ?? <span className="text-gray-400">—</span>}</td>
                    <td className="text-right">{c.montant ? c.montant.toLocaleString("fr-FR") : <span className="text-gray-400">—</span>}</td>
                    <td>{c.devise ?? <span className="text-gray-400">—</span>}</td>
                    <td className="text-xs">{c.modalite ? MODALITE_LABEL[c.modalite] : <span className="text-gray-400">—</span>}</td>
                    <td className="text-xs">
                      {c.date_echeance ? (
                        <span className="inline-flex items-center gap-1">
                          {new Date(c.date_echeance).toLocaleDateString("fr-FR")}
                          {etat && <span className={badgeForEtatEcheance(etat)}>{ETAT_ECHEANCE_LABEL[etat]}</span>}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td>
                      {c.statut_paiement
                        ? <span className={badgeForStatutPaiement(c.statut_paiement)}>{STATUT_PAIEMENT_LABEL[c.statut_paiement]}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="text-center">
                      {dejaPaye ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <CheckCircle2 size={14} /> Payé
                        </span>
                      ) : (
                        <button
                          className="btn-primary !py-1.5 !px-3 text-xs"
                          onClick={() => ouvrirInitiation(c)}
                        >
                          Initier le paiement
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-8">
                    <div className="text-sm">Aucune remise ne correspond à cette corbeille.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== Modal initiation du paiement ===== */}
      {courrierCible && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={() => setCourrierCible(null)}>
          <div className="card max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-semibold text-base">Initiation du paiement</div>
                <div className="text-xs text-ink-500 mt-0.5">
                  {courrierCible.reference_courrier} · {courrierCible.client ?? "—"}
                  {courrierCible.montant != null && ` · ${courrierCible.montant.toLocaleString("fr-FR")} ${courrierCible.devise ?? ""}`}
                </div>
              </div>
              <button className="btn-ghost !p-1" onClick={() => setCourrierCible(null)} title="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Référence du paiement reçu">
                  <input
                    className="input w-full"
                    value={refPaiement}
                    onChange={e => setRefPaiement(e.target.value)}
                    placeholder="Ex. LIC3344992"
                  />
                </Field>
                <Field label="Partie à l'origine du paiement">
                  <select
                    className="input w-full"
                    value={partieOrigine}
                    onChange={e => setPartieOrigine(e.target.value as PartieOriginePaiement)}
                  >
                    {PARTIE_ORIGINE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Paiement reçu de">
                  <input
                    className="input w-full"
                    value={paiementRecuDe}
                    onChange={e => setPaiementRecuDe(e.target.value)}
                    placeholder="Nom et adresse du payeur"
                  />
                </Field>
                <Field label="Date de réception">
                  <input
                    type="date"
                    className="input w-full"
                    value={dateReception}
                    onChange={e => setDateReception(e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Partie à payer">
                <input
                  className="input w-full"
                  value={partieAPayer}
                  onChange={e => setPartieAPayer(e.target.value)}
                  placeholder="Bénéficiaire du paiement"
                />
              </Field>

              <Field label="Instruction du paiement">
                <textarea
                  className="input min-h-[80px]"
                  value={instruction}
                  onChange={e => setInstruction(e.target.value)}
                  placeholder="Instructions de règlement…"
                />
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="btn-outline" onClick={() => setCourrierCible(null)}>Annuler</button>
              <button className="btn-primary" onClick={validerInitiation}>
                <CheckCircle2 size={14} /> Valider le paiement
              </button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}

/* ---------- helpers ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="label">{label}</div>{children}</div>;
}
