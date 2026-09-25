"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import { useTomStore } from "@/store/useTomStore";
import {
  COURRIER_WORKFLOW_LABEL, badgeForCourrierWorkflow,
  MOTIF_RETOUR_CENTRALISATION_LABEL,
  MODALITE_LABEL, STATUT_PAIEMENT_LABEL, PRODUIT_IRD_LABEL,
} from "@/domain/labels";
import {
  estATraiter, estARelancer, echeanceASuivre, envoyeCtnNonRecu,
  retourDocumentsAFaire, etatEcheanceV5, contexteMetier,
  joursEcheance, bandeRemise,
} from "@/domain/pilotage";
import {
  Mail, AlertTriangle, Pencil,
  CalendarClock, Inbox, Activity, ChevronRight, ChevronUp, ChevronDown,
  Undo2, Download, ListChecks, Filter, BellRing,
  Maximize2, Clock, Zap, Plus, SlidersHorizontal, GripVertical,
  Settings2, EyeOff, Columns3, Rows3,
} from "lucide-react";
import {
  DndContext, DragOverlay, closestCenter,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove,
  rectSortingStrategy, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { CourrierIrd, StatutCourrierWorkflow, HistoriqueEvent, ProduitIrd } from "@/domain/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";
import PilotageHeader from "@/components/pilotage/PilotageHeader";
import { exporterCsvDossiers } from "@/lib/exportCsv";
import {
  WIDGETS, loadWidgetPrefs, saveWidgetPrefs, resetWidgetPrefs, defaultWidgetPrefs,
  tailleDe, type WidgetPrefs, type WidgetDef, type WidgetW,
} from "@/lib/widgetPrefs";

/* Grille 12 colonnes : classes de portée générées statiquement (Tailwind ne
   peut pas construire les classes à la volée). */
const COL_SPAN: Record<number, string> = { 4: "lg:col-span-4", 6: "lg:col-span-6", 8: "lg:col-span-8", 12: "lg:col-span-12" };
const ROW_SPAN: Record<number, string> = { 1: "", 2: "lg:row-span-2" };

const DEVISES = ["EUR", "USD", "MAD", "GBP", "JPY", "CHF"];

const PRODUITS: { key: string; label: string; actif: boolean }[] = [
  { key: "TOUS", label: "Tous les produits", actif: true },
  { key: "REMISE_DOCUMENTAIRE_IMPORT", label: "REMDOC Import", actif: true },
  { key: "CREDIT_DOC", label: "Crédit documentaire", actif: false },
  { key: "REMDOC_EXPORT", label: "REMDOC Export", actif: false },
  { key: "FINANCEMENTS", label: "Financements", actif: false },
];

/* Widgets squelettes affichés dans les sections des produits non raccordés.
   Hors registre WIDGETS : ni drag, ni repli, ni masquage — simples placeholders. */
const FAKE_WIDGETS_PRODUIT: Record<string, { titre: string; icon: typeof Clock }[]> = {
  CREDIT_DOC: [
    { titre: "Échéancier crédits", icon: CalendarClock },
    { titre: "Encours par banque", icon: Inbox },
  ],
  REMDOC_EXPORT: [
    { titre: "Remises export à suivre", icon: ListChecks },
    { titre: "Acceptations à l'étranger", icon: Mail },
  ],
  FINANCEMENTS: [
    { titre: "Préfinancements en cours", icon: Clock },
    { titre: "Taux d'utilisation", icon: Activity },
  ],
};

export default function Dashboard() {
  const router = useRouter();
  const courriersAll = useTomStore(s => s.courriersIrd);
  const createCourrierIrd = useTomStore(s => s.createCourrierIrd);
  const applyAction = useTomStore(s => s.applyCourrierIrdAction);
  const nouveauCourrier = () => {
    const c = createCourrierIrd();
    router.push(`/remises-doc/import/${c.id}`);
  };

  function handleCorriger(c: CourrierIrd) {
    if (c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN") {
      applyAction(c.id, "CORRIGER");
    }
    router.push(`/remises-doc/import/${c.id}`);
  }

  /* ---------- Filtre produit global ---------- */
  const [produitFiltre, setProduitFiltre] = useState("TOUS");
  const courriers = useMemo(
    () => produitFiltre === "TOUS" ? courriersAll : courriersAll.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === produitFiltre),
    [courriersAll, produitFiltre]
  );

  /* ---------- Recherche & filtres ---------- */
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  /* ---------- Widgets : ordre / visibilité / repli — persisté en localStorage ---------- */
  /* Init sur les défauts puis chargement des prefs stockées après le mount :
     évite les erreurs d'hydratation quand la vue enregistrée diffère des défauts. */
  const [prefs, setPrefs] = useState<WidgetPrefs>(defaultWidgetPrefs);
  useEffect(() => { setPrefs(loadWidgetPrefs()); }, []);
  const updatePrefs = (fn: (p: WidgetPrefs) => WidgetPrefs) =>
    setPrefs(prev => { const next = fn(prev); saveWidgetPrefs(next); return next; });
  const toggleReplie = (k: string) => updatePrefs(p => ({ ...p, replie: { ...p.replie, [k]: !p.replie[k] } }));
  const toggleMasque = (k: string) => updatePrefs(p => ({
    ...p,
    masques: p.masques.includes(k) ? p.masques.filter(x => x !== k) : [...p.masques, k],
  }));
  const resetVue = () => { resetWidgetPrefs(); setPrefs(defaultWidgetPrefs()); };

  /* ---------- Drag & drop dnd-kit (réordonnancement des widgets) ---------- */
  /* Mode « Personnaliser » (non persisté) : overlay de drag sur les cartes,
     contrôles d'édition dans les en-têtes, carte « + Ajouter un widget ». */
  const [editMode, setEditMode] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const toggleEditMode = () => {
    setEditMode(m => !m);
    setActiveDragId(null);
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const handleDragStart = (e: DragStartEvent) => setActiveDragId(String(e.active.id));
  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const sid = String(active.id);
    const oid = String(over.id);
    updatePrefs(p => {
      const key: "order" | "orderProduit" | null =
        p.order.includes(sid) ? "order" : p.orderProduit.includes(sid) ? "orderProduit" : null;
      if (!key || !p[key].includes(oid)) return p;
      return { ...p, [key]: arrayMove(p[key], p[key].indexOf(sid), p[key].indexOf(oid)) };
    });
  };

  /* ---------- Contrôles d'édition : taille (w × h) ---------- */
  const cycleW = (id: string) => updatePrefs(p => {
    const t = tailleDe(id, p);
    const ws: WidgetW[] = [4, 6, 8, 12];
    const w = ws[(ws.indexOf(t.w) + 1) % ws.length];
    return { ...p, tailles: { ...p.tailles, [id]: { ...t, w } } };
  });
  const toggleH = (id: string) => updatePrefs(p => {
    const t = tailleDe(id, p);
    return { ...p, tailles: { ...p.tailles, [id]: { ...t, h: t.h === 1 ? 2 : 1 } } };
  });
  const dragHandleFor = (id: string) => {
    const t = tailleDe(id, prefs);
    return (
      <span className="flex items-center gap-1">
        <GripVertical size={14} className="text-gray-300" />
        <button
          className="h-7 w-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 grid place-items-center"
          title="Largeur" onClick={() => cycleW(id)}
        >
          <Columns3 size={14} />
        </button>
        <button
          className="h-7 w-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 grid place-items-center"
          title="Hauteur" onClick={() => toggleH(id)}
        >
          <Rows3 size={14} />
        </button>
        <span className="text-[10px] text-gray-400">{t.w}×{t.h}</span>
      </span>
    );
  };
  const masquerBtnFor = (id: string) => (
    <MasquerBtn onMasquer={() => toggleMasque(id)} />
  );

  const [fProduit, setFProduit] = useState("");
  const [fStatuts, setFStatuts] = useState<StatutCourrierWorkflow[]>([]);
  const [fClient, setFClient] = useState("");
  const [fRef, setFRef] = useState("");
  const [fRefInt, setFRefInt] = useState("");
  const [fRefExt, setFRefExt] = useState("");
  const [fDateDeb, setFDateDeb] = useState("");
  const [fDateFin, setFDateFin] = useState("");
  const [fDevise, setFDevise] = useState("");
  const [fMontantMin, setFMontantMin] = useState("");
  const [fMontantMax, setFMontantMax] = useState("");
  const [fAgence, setFAgence] = useState("");
  const [fTypeRetour, setFTypeRetour] = useState("");
  const [fModalite, setFModalite] = useState("");
  const [fStatutPaiement, setFStatutPaiement] = useState("");
  const [fEchDeb, setFEchDeb] = useState("");
  const [fEchFin, setFEchFin] = useState("");
  const [fEtatEch, setFEtatEch] = useState("");
  const [fDerniereAction, setFDerniereAction] = useState("");

  const agences = useMemo(
    () => Array.from(new Set(courriersAll.map(c => c.agence_reception).filter(Boolean))).sort(),
    [courriersAll]
  );

  function applyFilters() {
    const p = new URLSearchParams();
    if (fProduit) p.set("produit", fProduit);
    if (fStatuts.length) p.set("statut", fStatuts.join(","));
    if (fClient.trim()) p.set("client", fClient.trim());
    if (fRef.trim()) p.set("ref", fRef.trim());
    if (fRefInt.trim()) p.set("ref_interne", fRefInt.trim());
    if (fRefExt.trim()) p.set("ref_externe", fRefExt.trim());
    if (fDateDeb) p.set("date_debut", fDateDeb);
    if (fDateFin) p.set("date_fin", fDateFin);
    if (fDevise) p.set("devise", fDevise);
    if (fMontantMin) p.set("montant_min", fMontantMin);
    if (fMontantMax) p.set("montant_max", fMontantMax);
    if (fAgence) p.set("agence", fAgence);
    if (fTypeRetour) p.set("type_retour", fTypeRetour);
    if (fModalite) p.set("modalite", fModalite);
    if (fStatutPaiement) p.set("statut_paiement", fStatutPaiement);
    if (fEchDeb) p.set("echeance_du", fEchDeb);
    if (fEchFin) p.set("echeance_au", fEchFin);
    if (fEtatEch) p.set("etat_echeance", fEtatEch);
    if (fDerniereAction) p.set("derniere_action", fDerniereAction);
    router.push(`/listes/en-cours?${p.toString()}`);
  }

  function resetFilters() {
    setFProduit(""); setFStatuts([]); setFClient(""); setFRef(""); setFRefInt(""); setFRefExt("");
    setFDateDeb(""); setFDateFin(""); setFDevise(""); setFMontantMin(""); setFMontantMax("");
    setFAgence(""); setFTypeRetour(""); setFModalite(""); setFStatutPaiement("");
    setFEchDeb(""); setFEchFin(""); setFEtatEch(""); setFDerniereAction("");
  }

  /* ---------- Agrégats ---------- */
  const nbATraiter = courriers.filter(estATraiter).length;
  const nbEnCours = courriers.length;
  const nbARelancer = courriers.filter(estARelancer).length;
  const nbEcheances = courriers.filter(echeanceASuivre).length;

  const nbCtnNonRecus = courriers.filter(envoyeCtnNonRecu).length;
  const dernierEnvoiCtn = courriers.filter(c => c.date_envoi_ctn)
    .sort((a, b) => (b.date_envoi_ctn ?? "").localeCompare(a.date_envoi_ctn ?? ""))[0]?.date_envoi_ctn;
  const nbSouffrance = courriers.filter(retourDocumentsAFaire).length;
  const nbEchues = courriers.filter(c => etatEcheanceV5(c) === "ECHUE").length;
  const nbSortis = courriers.filter(c => etatEcheanceV5(c) === "HORS_INDICATEUR").length;

  /* ---------- À traiter ---------- */
  const [filtreProduitATraiter, setFiltreProduitATraiter] = useState("TOUS");
  const aTraiter = useMemo(() => {
    let items = courriers.filter(estATraiter);
    if (filtreProduitATraiter !== "TOUS") {
      items = items.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === filtreProduitATraiter);
    }
    return items;
  }, [courriers, filtreProduitATraiter]);
  const NB_A_TRAITER_AFFICHES = 6;

  /* ---------- Activité récente (48 h) ---------- */
  const [filtreProduitAct, setFiltreProduitAct] = useState("TOUS");
  const activite = useMemo(() => {
    const limite = Date.now() - 48 * 3600 * 1000;
    const all: { ev: HistoriqueEvent; c: CourrierIrd }[] = [];
    for (const c of courriers) {
      if (filtreProduitAct !== "TOUS" && (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") !== filtreProduitAct) continue;
      for (const ev of c.historique) {
        if (new Date(ev.date).getTime() >= limite) all.push({ ev, c });
      }
    }
    return all.sort((a, b) => b.ev.date.localeCompare(a.ev.date)).slice(0, 7);
  }, [courriers, filtreProduitAct]);

  /* ---------- Export CSV de la vue ---------- */
  const exporterCSV = () => exporterCsvDossiers(courriers, "pilotage-agence");

  /* ---------- Rendu des widgets transverses ---------- */
  const renderWidgetTransverse = (id: string): ReactNode => {
    switch (id) {
      case "alertes":
        return (
          <AlertesBlock
            nbCtnNonRecus={nbCtnNonRecus}
            dernierEnvoiCtn={dernierEnvoiCtn}
            nbSouffrance={nbSouffrance}
            nbEchues={nbEchues}
            nbSortis={nbSortis}
            replie={!!prefs.replie.alertes}
            onToggle={() => toggleReplie("alertes")}
            dragHandle={editMode ? dragHandleFor("alertes") : undefined}
            masquerBtn={editMode ? masquerBtnFor("alertes") : undefined}
          />
        );
      case "atraiter":
        return (
          <Card className="h-full flex flex-col">
            <div className="p-5 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <ListChecks size={15} className="text-orange-500" /> À traiter
                  <span className="bg-red-50 text-red-700 rounded-full px-2 text-xs font-bold">{aTraiter.length}</span>
                </div>
                <div className="relative z-20 flex items-center gap-1.5">
                  {editMode && dragHandleFor("atraiter")}
                  {editMode && masquerBtnFor("atraiter")}
                  <Link href="/listes/toutes" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:text-orange-600 grid place-items-center" title="Ouvrir la liste complète">
                    <Maximize2 size={13} />
                  </Link>
                  <ToggleBtn replie={!!prefs.replie.atraiter} onToggle={() => toggleReplie("atraiter")} />
                </div>
              </div>
              {!prefs.replie.atraiter && (
                <>
                  {/* Filtre produit — blocs cliquables */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <Filter size={12} className="text-gray-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mr-1">Produit</span>
                    {PRODUITS.map(p => {
                      const n = p.key === "TOUS"
                        ? courriers.filter(estATraiter).length
                        : courriers.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === p.key && estATraiter(c)).length;
                      if (!p.actif) {
                        return (
                          <span key={p.key} className="px-2.5 py-1 rounded-md text-[11px] border border-dashed border-gray-300 text-gray-400 cursor-not-allowed">
                            {p.label}
                          </span>
                        );
                      }
                      const active = filtreProduitATraiter === p.key;
                      return (
                        <button
                          key={p.key}
                          onClick={() => setFiltreProduitATraiter(p.key)}
                          className={clsx(
                            "px-2.5 py-1 rounded-md text-[11px] font-medium border transition",
                            active ? "border-orange-500 text-orange-600 bg-orange-50" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                          )}
                        >
                          {p.key === "TOUS" ? "Tous" : p.label} {n}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex-1 min-h-0 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Dossier</th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Statut et contexte métier</th>
                          <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2 pr-3">Montant</th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 pb-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aTraiter.slice(0, NB_A_TRAITER_AFFICHES).map(c => {
                          const isRetourDocs = retourDocumentsAFaire(c);
                          const isRetour = c.statut_workflow === "RETOUR_AGENCE" || c.statut_workflow === "RETOUR_CTN" || c.statut_workflow === "EN_CORRECTION";
                          return (
                            <tr
                              key={c.id}
                              className={clsx(
                                "border-b border-gray-100",
                                isRetour && "border-l-4 border-l-red-500",
                                isRetourDocs && "border-l-4 border-l-orange-500"
                              )}
                            >
                              <td className="py-2.5 pr-3 align-top">
                                <Link href={`/remises-doc/import/${c.id}`} className="font-medium text-orange-600 hover:underline">
                                  {c.reference_courrier}
                                </Link>
                                <div className="text-xs text-gray-700">{c.client ?? "—"}</div>
                                <div className="text-[11px] text-gray-400">{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}</div>
                              </td>
                              <td className="py-2.5 pr-3 align-top">
                                <span className={badgeForCourrierWorkflow(c.statut_workflow)}>{COURRIER_WORKFLOW_LABEL[c.statut_workflow]}</span>
                                <div className="text-xs text-gray-600 mt-1">
                                  {contexteMetier(c)}
                                  {isRetour && c.dernier_retour && ` — ${MOTIF_RETOUR_CENTRALISATION_LABEL[c.dernier_retour.motif]}`}
                                </div>
                              </td>
                              <td className="py-2.5 pr-3 align-top text-right whitespace-nowrap">
                                {c.montant != null ? (
                                  <>
                                    <div className="font-semibold text-gray-900">{c.montant.toLocaleString("fr-FR")}</div>
                                    <div className="text-[11px] text-gray-500">{c.devise}</div>
                                  </>
                                ) : <span className="text-gray-400">—</span>}
                              </td>
                              <td className="py-2.5 align-top whitespace-nowrap">
                                {isRetour ? (
                                  <button className="btn-primary text-xs h-8 px-3 inline-flex items-center gap-1" onClick={() => handleCorriger(c)}>
                                    <Pencil size={12} /> Corriger
                                  </button>
                                ) : isRetourDocs ? (
                                  <button
                                    className="btn-outline text-xs h-8 px-3 inline-flex items-center gap-1"
                                    onClick={() => router.push(`/remises-doc/import/${c.id}`)}
                                  >
                                    <Undo2 size={12} /> Traiter le retour
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          );
                        })}
                        {aTraiter.length === 0 && (
                          <tr><td colSpan={4} className="text-sm text-gray-400 text-center py-6">Aucune action à traiter.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs">
                    <span className="text-gray-500">{Math.min(NB_A_TRAITER_AFFICHES, aTraiter.length)} dossiers affichés sur {aTraiter.length}</span>
                    <Link href="/listes/toutes" className="text-orange-600 font-medium hover:underline">Voir tout →</Link>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      case "activite":
        return (
          <Card className="h-full flex flex-col">
            <div className="p-5 flex-1 min-h-0 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <Activity size={15} className="text-orange-500" /> Activité récente
                  <span className="text-[11px] text-gray-400 font-normal normal-case">48 h</span>
                </div>
                <div className="relative z-20 flex items-center gap-1.5">
                  {editMode && dragHandleFor("activite")}
                  {editMode && masquerBtnFor("activite")}
                  <FunnelFilter value={filtreProduitAct} onChange={setFiltreProduitAct} />
                  <ToggleBtn replie={!!prefs.replie.activite} onToggle={() => toggleReplie("activite")} />
                </div>
              </div>
              {!prefs.replie.activite && (
                <>
                  <div className="space-y-1 flex-1 min-h-0 overflow-auto">
                    {activite.map(({ ev, c }) => {
                      const isRetour = ev.type === "RETOUR_AGENCE" || ev.type === "RETOUR_CTN";
                      const dot = isRetour ? "bg-red-500"
                        : ev.type === "VALIDATION_AGENCE" || ev.type === "VALIDATION_CTN" ? "bg-green-500"
                        : ev.type === "TRANSMISSION_CTN" || ev.type === "ENVOI_CTN" ? "bg-blue-500"
                        : ev.type === "CORRECTION" ? "bg-amber-500"
                        : ev.type === "PAIEMENT" || ev.type === "RECEPTION_AGENCE" ? "bg-emerald-500"
                        : "bg-orange-500";
                      return (
                        <Link
                          key={ev.id}
                          href={`/remises-doc/import/${c.id}/historique`}
                          className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-orange-50/40 transition"
                        >
                          <span className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{ev.message}</div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              <span className="font-medium text-orange-600">{c.reference_courrier}</span>
                              {" · "}{PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"]}
                              {ev.acteur && <> · {ev.acteur}</>}
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 whitespace-nowrap shrink-0">
                            {new Date(ev.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })} {new Date(ev.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </Link>
                      );
                    })}
                    {activite.length === 0 && (
                      <div className="text-sm text-gray-400 text-center py-6">Aucune activité sur les 48 dernières heures.</div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Link href="/consultation/evenements" className="text-xs text-orange-600 font-medium hover:underline">
                      Tout l'historique →
                    </Link>
                  </div>
                </>
              )}
            </div>
          </Card>
        );
      case "echeances":
        return (
          <EcheancesCard
            items={courriers}
            replie={!!prefs.replie.echeances}
            onToggle={() => toggleReplie("echeances")}
            dragHandle={editMode ? dragHandleFor("echeances") : undefined}
            masquerBtn={editMode ? masquerBtnFor("echeances") : undefined}
          />
        );
      default: {
        const w = WIDGETS.find(x => x.id === id);
        if (!w?.placeholder) return null;
        return (
          <PlaceholderCard
            icon={id === "delais-traitement" ? Clock : ListChecks}
            titre={w.titre}
            replie={!!prefs.replie[id]}
            onToggle={() => toggleReplie(id)}
            dragHandle={editMode ? dragHandleFor(id) : undefined}
            masquerBtn={editMode ? masquerBtnFor(id) : undefined}
          />
        );
      }
    }
  };

  /* ---------- Rendu des widgets produit ---------- */
  const renderWidgetProduit = (id: string, items: CourrierIrd[]): ReactNode => {
    if (id === "anciennete") {
      return (
        <AncienneteCard
          items={items}
          replie={!!prefs.replie.anciennete}
          onToggle={() => toggleReplie("anciennete")}
          dragHandle={editMode ? dragHandleFor("anciennete") : undefined}
          masquerBtn={editMode ? masquerBtnFor("anciennete") : undefined}
        />
      );
    }
    const w = WIDGETS.find(x => x.id === id);
    if (!w?.placeholder) return null;
    return (
      <PlaceholderCard
        icon={ListChecks}
        titre={w.titre}
        replie={!!prefs.replie[id]}
        onToggle={() => toggleReplie(id)}
        dragHandle={editMode ? dragHandleFor(id) : undefined}
        masquerBtn={editMode ? masquerBtnFor(id) : undefined}
      />
    );
  };

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <div className="space-y-6">
        {/* ===== 1. En-tête pilotage ===== */}
        <PilotageHeader
          actif="pilotage"
          fil="Casablanca"
          actions={
            <>
              <ProductSelect value={produitFiltre} onChange={setProduitFiltre} counts={courriersAll.length} />
              <button
                onClick={toggleEditMode}
                className={clsx(
                  "btn-outline h-10 inline-flex items-center gap-2",
                  /* !important requis : .btn-outline est déclarée après les utilitaires
                     dans globals.css, sans « ! » ses couleurs l'emporteraient. */
                  editMode && "!border-orange-500 !bg-orange-50 !text-orange-600"
                )}
                title={editMode ? "Terminer la personnalisation" : "Réorganiser et masquer les widgets"}
              >
                <Settings2 size={15} /> Personnaliser
              </button>
              <AffichageMenu masques={prefs.masques} onToggle={toggleMasque} onReset={resetVue} />
              <button className="btn-outline h-10 inline-flex items-center gap-2" onClick={exporterCSV}>
                <Download size={15} /> Exporter
              </button>
              <Button onClick={nouveauCourrier}>
                <Mail size={16} /> Nouvelle centralisation
              </Button>
            </>
          }
        />

        {/* ===== Filtres (bouton dans le menu du haut) ===== */}
        {isFilterOpen && (
          <div className="card p-5 filter-panel-enter">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">PRODUIT</label>
                    <select className="input w-full" value={fProduit} onChange={e => setFProduit(e.target.value)}>
                      <option value="">Tous les produits</option>
                      <option value="REMISE_DOCUMENTAIRE_IMPORT">REMDOC Import</option>
                      <option disabled>Crédit documentaire — À venir</option>
                      <option disabled>REMDOC Export — À venir</option>
                      <option disabled>Financements — À venir</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label">CLIENT / TIRÉ</label>
                    <input className="input w-full" value={fClient} onChange={e => setFClient(e.target.value)} placeholder="Nom du client ou du tiré" />
                  </div>
                  <div>
                    <label className="text-label">AGENCE</label>
                    <select className="input w-full" value={fAgence} onChange={e => setFAgence(e.target.value)}>
                      <option value="">Casablanca</option>
                      {agences.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-label">STATUT</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(COURRIER_WORKFLOW_LABEL).map(([k, v]) => {
                      const active = fStatuts.includes(k as StatutCourrierWorkflow);
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setFStatuts(prev => prev.includes(k as StatutCourrierWorkflow) ? prev.filter(x => x !== k) : [...prev, k as StatutCourrierWorkflow])}
                          className={clsx(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                            active ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                          )}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">RÉFÉRENCE CENTRALISATION</label>
                    <input className="input w-full" value={fRef} onChange={e => setFRef(e.target.value)} placeholder="IRD26…" />
                  </div>
                  <div>
                    <label className="text-label">RÉFÉRENCE INTERNE</label>
                    <input className="input w-full" value={fRefInt} onChange={e => setFRefInt(e.target.value)} placeholder="INT/…" />
                  </div>
                  <div>
                    <label className="text-label">RÉFÉRENCE EXTERNE</label>
                    <input className="input w-full" value={fRefExt} onChange={e => setFRefExt(e.target.value)} placeholder="Référence du donneur d'ordre" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DATE DE RÉCEPTION — DU</label>
                    <input type="date" className="input w-full" value={fDateDeb} onChange={e => setFDateDeb(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DATE DE RÉCEPTION — AU</label>
                    <input type="date" className="input w-full" value={fDateFin} onChange={e => setFDateFin(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DERNIÈRE ACTION À PARTIR DU</label>
                    <input type="date" className="input w-full" value={fDerniereAction} onChange={e => setFDerniereAction(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DEVISE</label>
                    <select className="input w-full" value={fDevise} onChange={e => setFDevise(e.target.value)}>
                      <option value="">Toutes</option>
                      {DEVISES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-label">MONTANT MIN</label>
                    <input type="number" className="input w-full" value={fMontantMin} onChange={e => setFMontantMin(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-label">MONTANT MAX</label>
                    <input type="number" className="input w-full" value={fMontantMax} onChange={e => setFMontantMax(e.target.value)} placeholder="Sans limite" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">TYPE DE RETOUR</label>
                    <select className="input w-full" value={fTypeRetour} onChange={e => setFTypeRetour(e.target.value)}>
                      <option value="">Agence · CTN</option>
                      <option value="RETOUR_AGENCE">Retour Agence</option>
                      <option value="RETOUR_CTN">Retour CTN</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-label">MODALITÉ</label>
                    <select className="input w-full" value={fModalite} onChange={e => setFModalite(e.target.value)}>
                      <option value="">Toutes</option>
                      {Object.entries(MODALITE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-label">STATUT PAIEMENT</label>
                    <select className="input w-full" value={fStatutPaiement} onChange={e => setFStatutPaiement(e.target.value)}>
                      <option value="">Tous</option>
                      {Object.entries(STATUT_PAIEMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-label">DATE D'ÉCHÉANCE — DU</label>
                    <input type="date" className="input w-full" value={fEchDeb} onChange={e => setFEchDeb(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">DATE D'ÉCHÉANCE — AU</label>
                    <input type="date" className="input w-full" value={fEchFin} onChange={e => setFEchFin(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-label">ÉTAT DE L'ÉCHÉANCE</label>
                    <select className="input w-full" value={fEtatEch} onChange={e => setFEtatEch(e.target.value)}>
                      <option value="">À venir · Échue</option>
                      <option value="A_VENIR">À venir</option>
                      <option value="ECHUE">Échue</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 italic">Critères transverses + critères métier REMDOC Import</span>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={resetFilters}>Réinitialiser</button>
                  <button className="btn-ghost" onClick={() => setIsFilterOpen(false)}>Masquer</button>
                  <button className="btn-primary" onClick={applyFilters}>Appliquer les filtres</button>
                </div>
              </div>
            </div>
          )}

        {/* ===== Bandeau mode personnalisation ===== */}
        {editMode && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
            <span>
              Mode personnalisation — glissez les widgets pour les réordonner, ajustez largeur/hauteur,
              masquez ceux que vous n'utilisez pas. Vos préférences sont enregistrées automatiquement.
            </span>
            <span className="flex items-center gap-2">
              <button className="btn-ghost text-xs" onClick={resetVue}>Réinitialiser la vue</button>
              <button className="btn-primary text-xs h-8 px-3" onClick={toggleEditMode}>Terminé</button>
            </span>
          </div>
        )}

        {/* ===== 3. KPI transverses ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "À traiter", unit: "actions", value: nbATraiter, href: "/listes/toutes", icon: ListChecks, border: "border-b-red-500", text: "text-red-600" },
            { label: "À relancer", unit: "dossiers", value: nbARelancer, href: "/listes/relances", icon: BellRing, border: "border-b-orange-500", text: "text-orange-600" },
            { label: "Échéances à suivre", unit: "échéances", value: nbEcheances, href: "/echeancier", icon: CalendarClock, border: "border-b-orange-500", text: "text-orange-600" },
            { label: "Dossiers en cours", unit: "dossiers", value: nbEnCours, href: "/listes/en-cours", icon: Inbox, border: "border-b-slate-900", text: "text-slate-900" },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Link key={k.label} href={k.href}>
                <Card className={`border-b-[3px] ${k.border} hover:ring-2 hover:ring-orange-300 transition cursor-pointer h-full`}>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      <Icon size={13} /> {k.label}
                    </div>
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className={`text-3xl font-bold ${k.text}`}>{k.value}</span>
                      <span className="text-xs text-gray-500">{k.unit}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* ===== 4→6. Widgets — drag & drop dnd-kit (deux zones sortable) ===== */}
        <DndContext
          id="pilotage-dnd"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
        {/* ===== 4. Grille de widgets transverses — 12 colonnes, tailles en cellules ===== */}
        <SortableContext items={prefs.order} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:auto-rows-[minmax(200px,auto)] grid-flow-dense items-stretch">
          {prefs.order.filter(id => !prefs.masques.includes(id)).map(id => {
            const w = WIDGETS.find(x => x.id === id);
            if (!w || w.zone !== "transverse") return null;
            return (
              <WidgetShell
                key={id}
                id={id}
                taille={tailleDe(id, prefs)}
                replie={!!prefs.replie[id]}
                editMode={editMode}
              >
                {renderWidgetTransverse(id)}
              </WidgetShell>
            );
          })}
          {/* Carte « + Ajouter un widget » : mode personnaliser + au moins un widget masqué */}
          {editMode && prefs.masques.length > 0 && (
            <div className="lg:col-span-12 rounded-lg border-2 border-dashed border-gray-300 p-5 text-center">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                <Plus size={14} className="text-gray-400" /> Ajouter un widget
              </div>
              <div className="mt-3 space-y-2">
                {prefs.masques.map(id => {
                  const w = WIDGETS.find(x => x.id === id);
                  if (!w) return null;
                  return (
                    <div key={id} className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-600">{w.titre}</span>
                      <button className="btn-outline !text-xs" onClick={() => toggleMasque(id)}>
                        + Réafficher
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </SortableContext>

        {/* ===== 6. Sections produit ===== */}
        <div className="space-y-6">
          {PRODUITS.filter(p => p.key !== "TOUS" && (produitFiltre === "TOUS" || produitFiltre === p.key)).map(p => {
            if (!p.actif) {
              /* Produit non raccordé : section complète avec widgets squelettes
                 (même structure que REMDOC Import, placeholders hors registre). */
              const fakes = FAKE_WIDGETS_PRODUIT[p.key] ?? [];
              return (
                <div key={p.key} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-wider text-gray-400">Produit</span>
                    <span className="badge-gray">{p.label}</span>
                    <div className="flex-1 border-t border-gray-200" />
                    <span className="badge-gray">À venir</span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {fakes.map(f => (
                      <div key={f.titre} className="lg:col-span-6 min-h-[200px]">
                        <PlaceholderCard icon={f.icon} titre={f.titre} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            /* Produit raccordé : widgets alimentés par ses propres dossiers
               (courriersAll, pas courriers — la bande garde ses données en mode « Tous les produits ») */
            const items = courriersAll.filter(c => (c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT") === p.key);
            return (
              <div key={p.key} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-gray-400">Produit</span>
                  <span className="badge-produit">{PRODUIT_IRD_LABEL[p.key as ProduitIrd] ?? p.label}</span>
                  <span className="text-xs text-gray-500">{items.length} dossier{items.length > 1 ? "s" : ""}</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <SortableContext items={prefs.orderProduit} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:auto-rows-[minmax(200px,auto)] grid-flow-dense items-stretch">
                  {prefs.orderProduit.filter(id => !prefs.masques.includes(id)).map(id => {
                    const w = WIDGETS.find(x => x.id === id);
                    if (!w || w.zone !== "produit") return null;
                    return (
                      <WidgetShell
                        key={id}
                        id={id}
                        taille={tailleDe(id, prefs)}
                        replie={!!prefs.replie[id]}
                        editMode={editMode}
                      >
                        {renderWidgetProduit(id, items)}
                      </WidgetShell>
                    );
                  })}
                </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeDragId ? <WidgetGhost id={activeDragId} /> : null}
        </DragOverlay>
        </DndContext>

        {/* ===== Accès rapides — bouton d'action flottant ===== */}
        <AccesRapidesFab
          onNouveau={nouveauCourrier}
          nbEcheances={nbEcheances}
          nbARelancer={nbARelancer}
          nbEnCours={nbEnCours}
        />
      </div>
    </Shell>
  );
}

/* ---------- Sélecteur de produit global ---------- */
function ProductSelect({ value, onChange, counts }: { value: string; onChange: (v: string) => void; counts: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = PRODUITS.find(p => p.key === value);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-outline h-10 inline-flex items-center gap-2 min-w-[170px] justify-between"
      >
        <span className="text-sm">{current?.label ?? "Tous les produits"}</span>
        <ChevronRight size={14} className={clsx("transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
          {PRODUITS.map(p => (
            <button
              key={p.key}
              disabled={!p.actif}
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                !p.actif ? "text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700",
                value === p.key && "font-semibold text-orange-600"
              )}
            >
              <span>{p.label}{p.key === "REMISE_DOCUMENTAIRE_IMPORT" ? ` (${counts})` : ""}</span>
              {!p.actif && <span className="text-[10px] badge-gray">À venir</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Filtre produit entonnoir (local à un bloc) ---------- */
function FunnelFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const current = PRODUITS.find(p => p.key === value);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={clsx(
          "h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-xs border transition",
          value !== "TOUS"
            ? "text-orange-600 bg-orange-50 border-orange-200"
            : "text-gray-500 bg-white border-gray-200 hover:border-gray-300"
        )}
        title="Filtrer par produit"
      >
        <Filter size={12} />
        {value === "TOUS" ? "Tous produits" : current?.label}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Filtrer par produit</div>
          {PRODUITS.map(p => (
            <button
              key={p.key}
              disabled={!p.actif}
              onClick={() => { onChange(p.key); setOpen(false); }}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center justify-between",
                !p.actif ? "text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700",
                value === p.key && "font-semibold text-orange-600"
              )}
            >
              <span>{p.label}</span>
              {!p.actif && <span className="text-[10px] badge-gray">À venir</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Bloc Alertes opérationnelles ---------- */
function AlertesBlock({ nbCtnNonRecus, dernierEnvoiCtn, nbSouffrance, nbEchues, nbSortis, replie, onToggle, dragHandle, masquerBtn }: {
  nbCtnNonRecus: number; dernierEnvoiCtn?: string; nbSouffrance: number; nbEchues: number; nbSortis: number;
  replie: boolean; onToggle: () => void; dragHandle?: ReactNode; masquerBtn?: ReactNode;
}) {
  const [filtre, setFiltre] = useState("TOUS");
  const tuiles = [
    {
      n: nbCtnNonRecus,
      titre: "Envoyés CTN non reçus en agence",
      sub: dernierEnvoiCtn ? `Dernier envoi CTN : ${new Date(dernierEnvoiCtn).toLocaleDateString("fr-FR")}` : "Aucun envoi CTN",
      href: "/listes/ctn-non-recus",
      border: "border-l-blue-500", text: "text-blue-600",
    },
    {
      n: nbSouffrance,
      titre: "Remises en souffrance ≥ 30 j",
      sub: "Retour documents à effectuer",
      href: "/listes/retour-docs",
      border: "border-l-orange-500", text: "text-orange-600",
    },
    {
      n: nbEchues,
      titre: "Échéances échues < 45 j",
      sub: `${nbSortis} dossier${nbSortis > 1 ? "s" : ""} sorti${nbSortis > 1 ? "s" : ""} de l'indicateur (≥ J+45)`,
      href: "/listes/ech-echues",
      border: "border-l-red-500", text: "text-red-600",
    },
  ];
  return (
    <Card className="border-l-4 border-l-orange-500 h-full flex flex-col">
      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Alertes opérationnelles</span>
          </div>
          <div className="relative z-20 flex items-center gap-1.5">
            {dragHandle}
            {masquerBtn}
            <FunnelFilter value={filtre} onChange={setFiltre} />
            <ToggleBtn replie={replie} onToggle={onToggle} />
          </div>
        </div>
        {!replie && (
          <div className="flex-1 min-h-0 overflow-auto divide-y divide-gray-100">
            {tuiles.map(t => (
              <Link
                key={t.titre}
                href={t.href}
                className="flex items-center gap-3 py-2.5 px-1 -mx-1 rounded hover:bg-gray-50 transition"
              >
                <span className={`w-1 self-stretch rounded-full shrink-0 ${t.border.replace("border-l-", "bg-")}`} />
                <span className={`text-xl font-bold w-8 text-center shrink-0 ${t.text}`}>{t.n}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 leading-tight">{t.titre}</div>
                  <div className="text-[11px] text-gray-500 truncate">{t.sub}</div>
                </div>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ---------- Carte Échéances · 10 prochains jours (transverse, périmètre du sélecteur global) ---------- */
function EcheancesCard({ items, replie, onToggle, dragHandle, masquerBtn }: { items: CourrierIrd[]; replie: boolean; onToggle: () => void; dragHandle?: ReactNode; masquerBtn?: ReactNode }) {
  const nbAVenir = items.filter(c => etatEcheanceV5(c) === "A_VENIR").length;
  const nbEchues = items.filter(c => etatEcheanceV5(c) === "ECHUE").length;
  const buckets = useMemo(() => {
    const b = Array(11).fill(0);
    for (const c of items) {
      if (etatEcheanceV5(c) !== "A_VENIR") continue;
      const j = joursEcheance(c); // 0 = J0, négatif = J-n
      if (j != null && j <= 0 && j >= -10) b[-j] += 1;
    }
    return b as number[];
  }, [items]);
  const maxBucket = Math.max(1, ...buckets);
  return (
    <Card className="h-full flex flex-col">
      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <CardHeader
          icon={CalendarClock}
          titre="Échéances · 10 prochains jours"
          dragHandle={dragHandle}
          right={
            <>
              {masquerBtn}
              <Link href="/echeancier" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:text-orange-600 grid place-items-center" title="Ouvrir l'échéancier">
                <Maximize2 size={13} />
              </Link>
              <ToggleBtn replie={replie} onToggle={onToggle} />
            </>
          }
        />
        {!replie && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-700">{nbAVenir} échéance{nbAVenir > 1 ? "s" : ""} à venir</span>
              <Link href="/listes/ech-echues" className="badge-red">{nbEchues} échue{nbEchues > 1 ? "s" : ""} &lt; 45 j</Link>
            </div>
            <div className="flex items-end gap-1.5 h-24">
              {buckets.map((n, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[10px] text-gray-500">{n > 0 ? n : ""}</span>
                  <div
                    className={clsx(
                      "w-full rounded",
                      n === 0 ? "h-1 bg-gray-100" : i <= 2 ? "bg-red-500" : i <= 6 ? "bg-amber-500" : "bg-blue-500"
                    )}
                    style={n > 0 ? { height: `${Math.max(4, (n / maxBucket) * 90)}px` } : undefined}
                  />
                  <span className="text-[9px] text-gray-400">{i === 0 ? "J0" : `J-${i}`}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-gray-400 mt-2">Rouge J0 à J-2 · ambre J-3 à J-6 · bleu J-7 à J-10</div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------- Carte Ancienneté des remises (périmètre produit) ---------- */
function AncienneteCard({ items, replie, onToggle, dragHandle, masquerBtn }: { items: CourrierIrd[]; replie: boolean; onToggle: () => void; dragHandle?: ReactNode; masquerBtn?: ReactNode }) {
  const bandeStats = useMemo(() => {
    const s: Record<string, number> = { SURVEILLANCE: 0, RELANCE: 0, RETOUR_DOCS: 0 };
    for (const c of items) {
      const b = bandeRemise(c);
      if (b) s[b] += 1;
    }
    return s;
  }, [items]);
  const nbRemises = bandeStats.SURVEILLANCE + bandeStats.RELANCE + bandeStats.RETOUR_DOCS;
  return (
    <Card className="h-full flex flex-col">
      <div className="p-5 flex-1 min-h-0 flex flex-col">
        <CardHeader
          icon={Clock}
          titre="Ancienneté des remises"
          dragHandle={dragHandle}
          right={<>{masquerBtn}<ToggleBtn replie={replie} onToggle={onToggle} /></>}
        />
        {!replie && (
          <>
            <div className="h-2 rounded-full overflow-hidden flex mb-4">
              <div className="bg-blue-500" style={{ width: `${nbRemises ? (bandeStats.SURVEILLANCE / nbRemises) * 100 : 0}%` }} />
              <div className="bg-amber-500" style={{ width: `${nbRemises ? (bandeStats.RELANCE / nbRemises) * 100 : 0}%` }} />
              <div className="bg-orange-500" style={{ width: `${nbRemises ? (bandeStats.RETOUR_DOCS / nbRemises) * 100 : 0}%` }} />
            </div>
            <div className="space-y-1">
              {([
                { key: "SURVEILLANCE", label: "Moins de 20 jours", href: "/listes/surveillance", dot: "bg-blue-500", text: "text-blue-600" },
                { key: "RELANCE", label: "20 à 29 jours · relance client", href: "/listes/relance-remise", dot: "bg-amber-500", text: "text-amber-600" },
                { key: "RETOUR_DOCS", label: "30 jours et plus · retour documents", href: "/listes/retour-docs", dot: "bg-orange-500", text: "text-orange-600" },
              ]).map(r => {
                const n = bandeStats[r.key];
                const pct = nbRemises ? Math.round((n / nbRemises) * 100) : 0;
                return (
                  <Link key={r.key} href={r.href} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 transition">
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <span className={`w-2 h-2 rounded-full ${r.dot}`} />
                      {r.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {pct}% <span className={`font-semibold ${r.text}`}>{n}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
            <div className="text-[11px] text-gray-500 border-t border-gray-100 pt-2 mt-2">
              {nbRemises} dossier{nbRemises > 1 ? "s" : ""} avec documents reçus et remise non effectuée
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

/* ---------- Petits composants réutilisés dans les cartes ---------- */
function ToggleBtn({ replie, onToggle }: { replie: boolean; onToggle: () => void }) {
  return (
    <button
      className="h-7 w-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 grid place-items-center"
      onClick={onToggle}
      title={replie ? "Déplier" : "Replier"}
    >
      {replie ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
    </button>
  );
}

/* Bouton « masquer » affiché dans l'en-tête des widgets en mode personnaliser */
function MasquerBtn({ onMasquer }: { onMasquer: () => void }) {
  return (
    <button
      className="h-7 w-7 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 grid place-items-center"
      onClick={onMasquer}
      title="Masquer ce widget"
    >
      <EyeOff size={14} />
    </button>
  );
}

function CardHeader({ icon: Icon, titre, right, dragHandle }: { icon: typeof ListChecks; titre: string; right?: ReactNode; dragHandle?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-orange-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{titre}</span>
      </div>
      {(right || dragHandle) && <div className="relative z-20 flex items-center gap-1.5">{dragHandle}{right}</div>}
    </div>
  );
}

/* ---------- Menu « Affichage » des widgets ---------- */
const GROUPES_AFFICHAGE: { titre: string; zone: WidgetDef["zone"] }[] = [
  { titre: "Transverse", zone: "transverse" },
  { titre: "Produit — REMDOC Import", zone: "produit" },
];

function AffichageMenu({ masques, onToggle, onReset }: { masques: string[]; onToggle: (id: string) => void; onReset: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="btn-outline h-10 inline-flex items-center gap-2">
        <SlidersHorizontal size={15} /> Affichage
        <ChevronRight size={14} className={clsx("transition", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
          {GROUPES_AFFICHAGE.map(g => (
            <div key={g.zone}>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{g.titre}</div>
              {WIDGETS.filter(w => w.zone === g.zone).map(w => (
                <label key={w.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-orange-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!masques.includes(w.id)}
                    onChange={() => onToggle(w.id)}
                    className="accent-orange-500"
                  />
                  {w.titre}
                </label>
              ))}
            </div>
          ))}
          <div className="border-t border-gray-100 mt-1 px-3 pt-2 pb-1 space-y-1.5">
            <p className="text-[11px] text-gray-400">Ordre et affichage enregistrés automatiquement</p>
            <button className="text-xs text-orange-600 hover:underline" onClick={onReset}>
              Réinitialiser la vue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Coquille d'un widget (dnd-kit, drag actif en mode personnaliser) ---------- */
function WidgetShell({ id, taille, replie, editMode, children }: {
  id: string;
  taille: { w: number; h: number };
  /** replié → la carte n'occupe qu'une ligne (en-tête seul) */
  replie: boolean;
  editMode: boolean;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const h = replie ? 1 : taille.h;
  return (
    <div
      ref={setNodeRef}
      data-widget-id={id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx(
        "group relative rounded-lg h-full min-h-0",
        COL_SPAN[taille.w],
        ROW_SPAN[h],
        isDragging && "opacity-40",
        /* ring-dashed n'existe pas dans Tailwind : outline dashed rend le liseré pointillé */
        editMode && "outline outline-1 outline-dashed outline-orange-300 outline-offset-2"
      )}
    >
      {editMode ? (
        /* Mode édition : toute la carte est saisissable, les contrôles d'en-tête (relative z-20)
           restent cliquables au-dessus de l'overlay. */
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing rounded-lg"
        />
      ) : (
        /* Mode normal : poignée de déplacement dans la marge gauche, révélée au survol. */
        <button
          {...attributes}
          {...listeners}
          type="button"
          title="Déplacer le widget"
          className="absolute left-1 top-4 z-20 h-6 w-4 grid place-items-center rounded text-gray-300 hover:text-orange-500 hover:bg-orange-50 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
        >
          <GripVertical size={14} />
        </button>
      )}
      {children}
    </div>
  );
}

/* ---------- Fantôme rendu dans le DragOverlay pendant le déplacement ---------- */
function WidgetGhost({ id }: { id: string }) {
  const w = WIDGETS.find(x => x.id === id);
  if (!w) return null;
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-2xl ring-2 ring-orange-400 rotate-1 p-4">
      <div className="flex items-center gap-2">
        <GripVertical size={14} className="text-gray-300" />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">{w.titre}</span>
      </div>
    </div>
  );
}

/* ---------- Widget placeholder « À venir » (indicateur non raccordé) ----------
   replie/onToggle/dragHandle/masquerBtn optionnels : sans eux, la carte est un
   simple squelette (placeholders génériques des produits non raccordés). */
function PlaceholderCard({ icon, titre, replie, onToggle, dragHandle, masquerBtn }: {
  icon: typeof Clock; titre: string; replie?: boolean; onToggle?: () => void; dragHandle?: ReactNode; masquerBtn?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 h-full">
      <div className="p-5">
        <CardHeader
          icon={icon}
          titre={titre}
          dragHandle={dragHandle}
          right={
            <>
              {masquerBtn}
              <span className="badge-gray">À venir</span>
              {onToggle && <ToggleBtn replie={!!replie} onToggle={onToggle} />}
            </>
          }
        />
        {!replie && (
          <div className="space-y-2.5 pt-1">
            <div className="h-2.5 rounded bg-gray-100 w-full" />
            <div className="h-2.5 rounded bg-gray-100 w-[70%]" />
            <div className="h-2.5 rounded bg-gray-100 w-[45%]" />
            <p className="text-xs text-gray-400 pt-1">Indicateur disponible au raccordement</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Accès rapides : bouton d'action flottant + panneau ---------- */
function AccesRapidesFab({ onNouveau, nbEcheances, nbARelancer, nbEnCours }: {
  onNouveau: () => void; nbEcheances: number; nbARelancer: number; nbEnCours: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  /* fermeture au clic extérieur — même pattern que FunnelFilter */
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const lignes: { icon: typeof Plus; label: string; count: number | null; href?: string; onClick?: () => void }[] = [
    { icon: Plus, label: "Nouvelle centralisation", count: null, onClick: onNouveau },
    { icon: CalendarClock, label: "Échéancier", count: nbEcheances, href: "/echeancier" },
    { icon: BellRing, label: "Relances du jour", count: nbARelancer, href: "/listes/relances" },
    { icon: Inbox, label: "Tous les dossiers", count: nbEnCours, href: "/listes/en-cours" },
  ];
  return (
    <div ref={ref}>
      {open && (
        <Card className="fixed bottom-20 right-6 z-50 w-64 shadow-xl">
          <div className="p-4">
            <CardHeader icon={Zap} titre="Accès rapides" />
            <div>
              {lignes.map(r => {
                const Icon = r.icon;
                const inner = (
                  <>
                    <span className="flex items-center gap-2 text-sm text-gray-700">
                      <Icon size={15} className="text-gray-400" /> {r.label}
                    </span>
                    {r.count != null && <span className="text-xs text-gray-500">{r.count}</span>}
                  </>
                );
                const cls = "flex items-center justify-between py-2 px-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded transition";
                return r.href ? (
                  <Link key={r.label} href={r.href} className={cls}>{inner}</Link>
                ) : (
                  <button key={r.label} onClick={r.onClick} className={clsx(cls, "w-full text-left")}>{inner}</button>
                );
              })}
            </div>
          </div>
        </Card>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          "fixed bottom-6 right-6 z-50 h-12 rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/40 hover:bg-orange-600 transition inline-flex items-center gap-2 px-4",
          open && "bg-slate-900 hover:bg-slate-800 shadow-slate-900/30"
        )}
        title="Accès rapides"
      >
        <Zap size={18} />
        <span className="text-sm font-semibold">Accès rapides</span>
      </button>
    </div>
  );
}
