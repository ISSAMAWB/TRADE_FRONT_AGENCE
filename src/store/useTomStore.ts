"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type {
  Courrier, DossierTOM, DocumentGED, LigneControleDoc, Tache, TrackingEvent,
  HistoriqueEvent, TypeDocument, TypeEvenement, EquipeActeur, StatutWorkflow,
  StatutPhysique, OcrExtractionDossier, OcrExtractionCourrier,
  CourrierIrd, StatutCourrierWorkflow, TypeTransporteur,
  LocalisationPhysique, ClientReferentiel,
} from "@/domain/types";
import { WORKFLOWS, getAllowedTransitions } from "@/domain/workflow";

/* -------------- Mock OCR pool -------------- */
const FAKE_CLIENTS = [
  "ATLAS TEXTILE SARL", "MAGHREB STEEL", "DELICES DU SUD", "MEDITERRANEA TRADING",
  "OCEANIC SHIPPING", "ROYAL CERAMICS",
];
const FAKE_DEVISES = ["EUR", "USD", "MAD"];

export const REFERENTIEL_CLIENTS: ClientReferentiel[] = [
  { id: "C001", nom: "ATLAS TEXTILE SARL", identifiant: "ATL-2024-001", agence_rattachement: "Agence Casablanca" },
  { id: "C002", nom: "ATLAS TEXTILE EXPORT", identifiant: "ATL-2024-002", agence_rattachement: "Agence Casablanca" },
  { id: "C003", nom: "MAGHREB STEEL SA", identifiant: "MGS-2024-001", agence_rattachement: "Agence Casablanca" },
  { id: "C004", nom: "MAGHREB STEEL INTERNATIONAL", identifiant: "MGS-2024-002", agence_rattachement: "Agence Rabat" },
  { id: "C005", nom: "DELICES DU SUD SARL", identifiant: "DDS-2024-001", agence_rattachement: "Agence Marrakech" },
  { id: "C006", nom: "MEDITERRANEA TRADING CO", identifiant: "MTC-2024-001", agence_rattachement: "Agence Tanger" },
  { id: "C007", nom: "OCEANIC SHIPPING LTD", identifiant: "OSL-2024-001", agence_rattachement: "Agence Casablanca" },
  { id: "C008", nom: "ROYAL CERAMICS SA", identifiant: "RCS-2024-001", agence_rattachement: "Agence Fès" },
  { id: "C009", nom: "STE ABC IMPORT EXPORT", identifiant: "ABC-2024-001", agence_rattachement: "Agence Casablanca" },
  { id: "C010", nom: "GLOBAL TRADE MAROC", identifiant: "GTM-2024-001", agence_rattachement: "Agence Rabat" },
  { id: "C011", nom: "SAHARA LOGISTICS", identifiant: "SHL-2024-001", agence_rattachement: "Agence Agadir" },
  { id: "C012", nom: "TANGER MED FREIGHT", identifiant: "TMF-2024-001", agence_rattachement: "Agence Tanger" },
];
function rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)]; }

interface AppState {
  /* identity */
  acteurCourant: EquipeActeur;
  setActeur: (a: EquipeActeur) => void;

  /* data */
  courriers: Courrier[];
  dossiers: DossierTOM[];

  /* courrier */
  createCourrier: (c: Partial<Courrier>) => Courrier;

  /* dossier */
  createDossier: (courrierId: string, evt: TypeEvenement) => DossierTOM;
  updateDossier: (id: string, patch: Partial<DossierTOM>) => void;
  getDossier: (id: string) => DossierTOM | undefined;

  /* documents */
  addDocuments: (dossierId: string, docs: { type_document: TypeDocument; filename: string }[]) => void;
  removeDocument: (dossierId: string, docId: string) => void;

  /* workflow */
  applyTransition: (dossierId: string, action: string) => void;

  /* tasks */
  completeTache: (dossierId: string, tacheId: string, acteur: string) => void;
  assignGestionnaire: (dossierId: string, gestionnaire: string) => void;

  /* OCR async */
  lancerOcr: (dossierId: string) => void;

  /* TI+ */
  envoyerTiPlus: (dossierId: string) => void;

  /* tracking */
  addTracking: (dossierId: string, s: StatutPhysique, commentaire?: string) => void;

  /* ============================================
     MODULE « Centralisation des courriers IRD »
  ============================================ */
  courriersIrd: CourrierIrd[];
  createCourrierIrd: (input?: {
    reference_transporteur?: string;
    type_transporteur?: TypeTransporteur;
    agence_reception?: string;
  }) => CourrierIrd;
  updateCourrierIrd: (id: string, patch: Partial<CourrierIrd>) => void;
  addDocumentsCourrierIrd: (id: string, docs: { type_document: TypeDocument; filename: string }[]) => void;
  removeDocumentCourrierIrd: (id: string, docId: string) => void;
  lancerOcrCourrierIrd: (id: string) => void;
  applyCourrierIrdAction: (id: string, action: CourrierIrdAction, payload?: { commentaire?: string }) => void;

  /* seed */
  resetSeed: () => void;
}

export type CourrierIrdAction =
  | "VALIDER_CREATION"
  | "VALIDER_ET_ENVOYER"
  | "RETOURNER_CORRECTION";

function newRef(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`;
}

function nowIso() { return new Date().toISOString(); }

function pushHist(d: DossierTOM, h: Omit<HistoriqueEvent, "id" | "date">) {
  d.historique.push({ id: nanoid(8), date: nowIso(), ...h });
}

export const useTomStore = create<AppState>((set, get) => ({
  acteurCourant: "AGENCE",
  setActeur: (a) => set({ acteurCourant: a }),

  courriers: [],
  dossiers: [],

  createCourrier: (c) => {
    const courrier: Courrier = {
      id: nanoid(8),
      reference_courrier: c.reference_courrier ?? newRef("CRR"),
      reference_transporteur: c.reference_transporteur,
      type_courrier: c.type_courrier ?? "DHL",
      numero_lot: c.numero_lot,
      date_reception: c.date_reception ?? nowIso(),
      date_scan: c.date_scan,
      entite_expediteur: c.entite_expediteur,
      statut_courrier: "EN_COURS_DEPOUILLEMENT",
      dossierIds: [],
    };
    set(s => ({ courriers: [courrier, ...s.courriers] }));
    return courrier;
  },

  createDossier: (courrierId, evt) => {
    const wf = WORKFLOWS[evt];
    const d: DossierTOM = {
      id: nanoid(8),
      reference_tom: newRef("TOM"),
      courrierId,
      produit: "IRD",
      type_evenement: evt,
      statut_workflow: wf.initial,
      statut_ocr: "NON_LANCE",
      statut_completude: "NON_CONTROLE",
      statut_physique: "DOCS_RECUS_AGENCE",
      controle_doc: [],
      documents: [],
      taches: [],
      tracking: [{
        id: nanoid(8),
        date: nowIso(),
        statut_physique: "DOCS_RECUS_AGENCE",
        commentaire: "Réception documents agence",
      }],
      historique: [{
        id: nanoid(8), date: nowIso(), acteur: "system",
        type: "CREATION", message: `Session de dépouillement créée (${evt})`,
      }],
      agence: "Agence Casablanca",
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    set(s => ({
      dossiers: [d, ...s.dossiers],
      courriers: s.courriers.map(c =>
        c.id === courrierId ? { ...c, dossierIds: [...c.dossierIds, d.id] } : c
      ),
    }));
    return d;
  },

  updateDossier: (id, patch) =>
    set(s => ({
      dossiers: s.dossiers.map(d =>
        d.id === id ? { ...d, ...patch, updated_at: nowIso() } : d
      ),
    })),

  getDossier: (id) => get().dossiers.find(d => d.id === id),

  addDocuments: (dossierId, docs) => {
    set(s => ({
      dossiers: s.dossiers.map(d => {
        if (d.id !== dossierId) return d;
        const added: DocumentGED[] = docs.map(x => ({
          id: nanoid(8),
          type_document: x.type_document,
          filename: x.filename,
          uploadedAt: nowIso(),
          statut_ocr: "NON_LANCE",
        }));
        const next = { ...d, documents: [...d.documents, ...added], updated_at: nowIso() };
        pushHist(next, { acteur: get().acteurCourant, type: "DOCS",
          message: `${added.length} document(s) ajouté(s) à la session (auto-save)` });
        return next;
      }),
    }));
  },

  removeDocument: (dossierId, docId) => {
    set(s => ({
      dossiers: s.dossiers.map(d =>
        d.id === dossierId
          ? { ...d, documents: d.documents.filter(x => x.id !== docId), updated_at: nowIso() }
          : d
      ),
    }));
  },

  applyTransition: (dossierId, action) => {
    const acteur = get().acteurCourant;
    const dossier = get().getDossier(dossierId);
    if (!dossier) return;
    const t = getAllowedTransitions(dossier.type_evenement, dossier.statut_workflow, acteur)
      .find(x => x.action === action);
    if (!t) return;

    const next: DossierTOM = { ...dossier, statut_workflow: t.to, updated_at: nowIso() };

    // spawn tasks
    if (t.spawnTasks) {
      const newTasks: Tache[] = t.spawnTasks.map(x => ({
        id: nanoid(8),
        type_tache: x.type_tache,
        equipe: x.equipe,
        statut: "A_FAIRE",
        date_creation: nowIso(),
      }));
      next.taches = [...next.taches, ...newTasks];
    }

    // tracking on key transitions
    if (t.to === "TRANSMIS_BO" && next.statut_physique !== "DOCS_EN_TRANSFERT") {
      next.statut_physique = "DOCS_EN_TRANSFERT";
      next.tracking = [...next.tracking, {
        id: nanoid(8), date: nowIso(),
        statut_physique: "DOCS_EN_TRANSFERT",
        commentaire: "Transmission BO — transfert physique agence → BO",
      }];
    }
    if (t.to === "DOSSIER_CREE") {
      next.reference_tiplus = `TIP-${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`;
    }

    pushHist(next, {
      acteur,
      type: "WORKFLOW",
      message: `${dossier.statut_workflow} → ${t.to} (${action})`,
    });

    set(s => ({ dossiers: s.dossiers.map(d => d.id === dossierId ? next : d) }));
  },

  completeTache: (dossierId, tacheId, acteur) => {
    set(s => ({
      dossiers: s.dossiers.map(d => {
        if (d.id !== dossierId) return d;
        return {
          ...d,
          taches: d.taches.map(t =>
            t.id === tacheId ? { ...t, statut: "TERMINEE", acteur } : t
          ),
        };
      }),
    }));
  },

  assignGestionnaire: (dossierId, gestionnaire) => {
    set(s => ({
      dossiers: s.dossiers.map(d => {
        if (d.id !== dossierId) return d;
        const next: DossierTOM = {
          ...d,
          gestionnaire_bo: gestionnaire,
          // l'affectation fait avancer le workflow BO
          statut_workflow: d.statut_workflow === "TRANSMIS_BO" ? "EN_TRAITEMENT_BO" : d.statut_workflow,
          updated_at: nowIso(),
        };
        // close "AFFECTER_DOSSIER" task, spawn "CONTROLER_DOSSIER_BO"
        next.taches = next.taches.map(t =>
          t.type_tache === "AFFECTER_DOSSIER" && t.statut === "A_FAIRE"
            ? { ...t, statut: "TERMINEE", acteur: get().acteurCourant }
            : t
        );
        if (!next.taches.some(t => t.type_tache === "CONTROLER_DOSSIER_BO")) {
          next.taches.push({
            id: nanoid(8), type_tache: "CONTROLER_DOSSIER_BO",
            equipe: "BO_IRD", acteur: gestionnaire, statut: "A_FAIRE",
            date_creation: nowIso(),
          });
        }
        next.statut_physique = "DOCS_RECUS_BO";
        next.tracking.push({
          id: nanoid(8), date: nowIso(),
          statut_physique: "DOCS_RECUS_BO",
          commentaire: `Affectation au gestionnaire ${gestionnaire}`,
        });
        pushHist(next, {
          acteur: get().acteurCourant, type: "AFFECTATION",
          message: `Dossier affecté à ${gestionnaire}`,
        });
        return next;
      }),
    }));
  },

  /* ========================================================
     OCR ASYNCHRONE (non bloquant)
     - capture les docs candidats (NON_LANCE) au moment de l'appel
     - les marque EN_COURS immédiatement
     - workflow → OCR_EN_COURS si en état agence (l'utilisateur peut
       continuer à ajouter/retirer des documents)
     - callback différé enrichit progressivement le dossier sans
       écraser les corrections manuelles déjà faites par l'utilisateur
  ======================================================== */
  lancerOcr: (dossierId) => {
    const d = get().getDossier(dossierId);
    if (!d) return;
    const candidates = d.documents.filter(x => x.statut_ocr === "NON_LANCE");
    if (candidates.length === 0) return;
    const candidateIds = new Set(candidates.map(c => c.id));

    // Per-doc immediate update + global flag (non-blocking)
    set(s => ({
      dossiers: s.dossiers.map(x => {
        if (x.id !== dossierId) return x;
        const next: DossierTOM = {
          ...x,
          documents: x.documents.map(doc =>
            candidateIds.has(doc.id) ? { ...doc, statut_ocr: "EN_COURS" } : doc
          ),
          statut_ocr: "EN_COURS",
          // n'avance le statut workflow que depuis un état agence non terminal
          statut_workflow:
            x.statut_workflow === "EN_PREPARATION" ||
            x.statut_workflow === "A_CONTROLER" ||
            x.statut_workflow === "PRET_A_TRANSMETTRE"
              ? "OCR_EN_COURS"
              : x.statut_workflow,
          updated_at: nowIso(),
        };
        pushHist(next, {
          acteur: get().acteurCourant, type: "OCR",
          message: `OCR lancé (async) sur ${candidates.length} document(s)`,
        });
        return next;
      }),
    }));

    // ---- async callback ----
    const delay = 1800 + Math.random() * 1800;
    setTimeout(() => {
      const cur = get().getDossier(dossierId);
      if (!cur) return;

      // contrôle documentaire
      const expectedFromLAC: Partial<Record<TypeDocument, number>> = {
        FACTURE: 5, BL: 2, CERTIFICAT_ORIGINE: 1, TRAITE: 1,
      };
      const detected: Record<string, number> = {};
      for (const doc of cur.documents) {
        detected[doc.type_document] = (detected[doc.type_document] ?? 0) + 1;
      }
      const lignes: LigneControleDoc[] = [];
      const allTypes = new Set<TypeDocument>([
        ...(Object.keys(expectedFromLAC) as TypeDocument[]),
        ...(Object.keys(detected) as TypeDocument[]),
      ]);
      allTypes.delete("LETTRE_ACCOMPAGNEMENT");
      for (const t of allTypes) {
        const att = expectedFromLAC[t] ?? 0;
        const det = detected[t] ?? 0;
        const statut_detection =
          att === det ? "DETECTE" : det === 0 ? "MANQUANT" : det < att ? "MANQUANT" : "EN_TROP";
        lignes.push({ type_document: t, nombre_attendu: att, nombre_detecte: det, statut_detection });
      }
      const totalAtt = lignes.reduce((s, l) => s + l.nombre_attendu, 0) || 1;
      const totalDet = lignes.reduce((s, l) => s + Math.min(l.nombre_detecte, l.nombre_attendu), 0);
      const score = Math.round((totalDet / totalAtt) * 100);

      const ocr_courrier: OcrExtractionCourrier = {
        reference_transporteur: cur.ocr_courrier?.reference_transporteur
          ?? `TRK${Math.floor(Math.random() * 9e8 + 1e8)}`,
      };
      const ocr_dossier: OcrExtractionDossier = {
        produit: "IRD",
        type_evenement: cur.type_evenement,
        client: cur.ocr_dossier?.client ?? rand(FAKE_CLIENTS),
        montant: cur.ocr_dossier?.montant ?? Math.round((50_000 + Math.random() * 500_000) * 100) / 100,
        devise: cur.ocr_dossier?.devise ?? rand(FAKE_DEVISES),
        reference_externe: cur.ocr_dossier?.reference_externe ?? `EXT/${Math.floor(Math.random() * 9000 + 1000)}`,
        reference_interne: cur.ocr_dossier?.reference_interne ?? `INT/${Math.floor(Math.random() * 9000 + 1000)}`,
      };

      set(s => ({
        dossiers: s.dossiers.map(x => {
          if (x.id !== dossierId) return x;
          // refresh per-doc statuses for the snapshot we launched
          const docs = x.documents.map(doc =>
            candidateIds.has(doc.id) ? { ...doc, statut_ocr: "TERMINE" as const, score_ocr: 0.85 + Math.random() * 0.15 } : doc
          );
          const stillRunning = docs.some(d => d.statut_ocr === "EN_COURS");
          const next: DossierTOM = {
            ...x,
            documents: docs,
            statut_ocr: stillRunning ? "EN_COURS" : (score === 100 ? "TERMINE" : "PARTIEL"),
            // ne forçe pas la sortie de PRET_A_TRANSMETTRE si user a déjà avancé
            statut_workflow:
              x.statut_workflow === "OCR_EN_COURS" ? "A_CONTROLER" : x.statut_workflow,
            statut_completude: score === 100 ? "COMPLET" : "AVEC_ECART",
            score_completude: score,
            controle_doc: lignes,
            ocr_dossier,
            ocr_courrier,
            // n'écrase QUE si l'utilisateur n'a pas déjà saisi (enrichissement progressif)
            client: x.client ?? ocr_dossier.client,
            montant: x.montant ?? ocr_dossier.montant,
            devise: x.devise ?? ocr_dossier.devise,
            reference_externe: x.reference_externe ?? ocr_dossier.reference_externe,
            reference_interne: x.reference_interne ?? ocr_dossier.reference_interne,
            updated_at: nowIso(),
          };
          // spawn tâche de contrôle si pas déjà
          if (!next.taches.some(t => t.type_tache === "CONTROLER_OCR_AGENCE" && t.statut === "A_FAIRE")) {
            next.taches = [
              ...next.taches,
              { id: nanoid(8), type_tache: "CONTROLER_OCR_AGENCE", equipe: "AGENCE",
                statut: "A_FAIRE", date_creation: nowIso() },
            ];
          }
          pushHist(next, {
            acteur: "system", type: "OCR",
            message: `OCR terminé — score complétude ${score}%`,
          });
          return next;
        }),
      }));
    }, delay);
  },

  envoyerTiPlus: (dossierId) => {
    get().applyTransition(dossierId, "Envoyer vers TI+");
    // simulate TI+ callback
    setTimeout(() => {
      const prev = get().acteurCourant;
      set({ acteurCourant: "SYSTEM" });
      get().applyTransition(dossierId, "Retour TI+ (system)");
      set({ acteurCourant: prev });
    }, 1500);
  },

  addTracking: (dossierId, s, commentaire) => {
    set(state => ({
      dossiers: state.dossiers.map(d => {
        if (d.id !== dossierId) return d;
        const ev: TrackingEvent = { id: nanoid(8), date: nowIso(), statut_physique: s, commentaire };
        return { ...d, statut_physique: s, tracking: [...d.tracking, ev], updated_at: nowIso() };
      }),
    }));
  },

  /* =====================================================================
     MODULE « Centralisation des courriers IRD »
     ===================================================================== */
  courriersIrd: [],

  createCourrierIrd: (input) => {
    const ci: CourrierIrd = {
      id: nanoid(8),
      reference_courrier: newRef("CIR"),
      date_reception: nowIso(),
      agence_reception: input?.agence_reception ?? "Agence Casablanca",
      reference_transporteur: input?.reference_transporteur,
      type_transporteur: input?.type_transporteur ?? "AUTRE",
      team_traitement: "TEAM_IRD",
      statut_workflow: "EN_PREPARATION",
      statut_ocr: "OCR_A_REALISER",
      statut_completude: "NON_CONTROLE",
      localisation_physique: "AGENCE",
      documents: [],
      controle_doc: [],
      ocr_fields: [],
      historique: [{
        id: nanoid(8), date: nowIso(), acteur: get().acteurCourant,
        type: "CREATION", message: "Courrier IRD créé — EN_PREPARATION",
      }],
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    set(s => ({ courriersIrd: [ci, ...s.courriersIrd] }));
    return ci;
  },

  updateCourrierIrd: (id, patch) => {
    set(s => ({
      courriersIrd: s.courriersIrd.map(c =>
        c.id === id ? { ...c, ...patch, updated_at: nowIso() } : c
      ),
    }));
  },

  addDocumentsCourrierIrd: (id, docs) => {
    set(s => ({
      courriersIrd: s.courriersIrd.map(c => {
        if (c.id !== id) return c;
        const added: DocumentGED[] = docs.map(x => ({
          id: nanoid(8),
          type_document: x.type_document,
          filename: x.filename,
          uploadedAt: nowIso(),
          statut_ocr: "NON_LANCE",
        }));
        const next: CourrierIrd = {
          ...c,
          documents: [...c.documents, ...added],
          updated_at: nowIso(),
        };
        next.historique = [...next.historique, {
          id: nanoid(8), date: nowIso(), acteur: get().acteurCourant,
          type: "DOCS", message: `${added.length} document(s) ajouté(s) au courrier`,
        }];
        return next;
      }),
    }));
  },

  removeDocumentCourrierIrd: (id, docId) => {
    set(s => ({
      courriersIrd: s.courriersIrd.map(c =>
        c.id === id
          ? { ...c, documents: c.documents.filter(d => d.id !== docId), updated_at: nowIso() }
          : c
      ),
    }));
  },

  /* ---- OCR ASYNCHRONE (courrier IRD) ----
     Identique au pattern dossier : snapshot des docs NON_LANCE,
     callback différé, enrichissement progressif sans écrasement.
  */
  lancerOcrCourrierIrd: (id) => {
    const c = get().courriersIrd.find(x => x.id === id);
    if (!c) return;
    const candidates = c.documents.filter(d => d.statut_ocr === "NON_LANCE");
    if (candidates.length === 0) return;
    const candidateIds = new Set(candidates.map(x => x.id));

    // immediate non-blocking state change — docs go EN_COURS, courrier stays OCR_A_REALISER (data not available yet)
    set(s => ({
      courriersIrd: s.courriersIrd.map(x => {
        if (x.id !== id) return x;
        const next: CourrierIrd = {
          ...x,
          documents: x.documents.map(d =>
            candidateIds.has(d.id) ? { ...d, statut_ocr: "EN_COURS" } : d
          ),
          statut_ocr: x.statut_ocr, // keep current (OCR_A_REALISER)
          updated_at: nowIso(),
        };
        next.historique = [...next.historique, {
          id: nanoid(8), date: nowIso(), acteur: get().acteurCourant,
          type: "OCR", message: `OCR lancé (async) sur ${candidates.length} document(s)`,
        }];
        return next;
      }),
    }));

    // async callback
    const delay = 2000 + Math.random() * 2200;
    setTimeout(() => {
      const cur = get().courriersIrd.find(x => x.id === id);
      if (!cur) return;

      // contrôle documentaire indicatif
      const expectedFromLAC: Partial<Record<TypeDocument, number>> = {
        FACTURE: 3, BL: 1, CERTIFICAT_ORIGINE: 1,
      };
      const detected: Record<string, number> = {};
      for (const doc of cur.documents) {
        detected[doc.type_document] = (detected[doc.type_document] ?? 0) + 1;
      }
      delete detected["LETTRE_ACCOMPAGNEMENT"];

      set(s => ({
        courriersIrd: s.courriersIrd.map(x => {
          if (x.id !== id) return x;
          const docs = x.documents.map(d =>
            candidateIds.has(d.id) ? { ...d, statut_ocr: "TERMINE" as const, score_ocr: 0.85 + Math.random() * 0.15 } : d
          );

          // ---- merge complétude : ne jamais écraser les lignes saisies à la main ----
          const existing = x.controle_doc.map(l => ({ ...l }));
          const existingTypes = new Set(existing.map(l => l.type_document));
          // mettre à jour le nombre reçu (= nombre détecté OCR) sur les lignes existantes
          for (const l of existing) {
            const det = detected[l.type_document] ?? l.nombre_detecte;
            l.nombre_detecte = det;
            l.statut_detection =
              l.nombre_attendu === det ? "DETECTE"
              : det === 0 ? "MANQUANT"
              : det < l.nombre_attendu ? "MANQUANT"
              : "EN_TROP";
          }
          // ajouter les types nouvellement détectés non encore listés
          for (const [t, det] of Object.entries(detected) as [TypeDocument, number][]) {
            if (existingTypes.has(t)) continue;
            const att = expectedFromLAC[t] ?? 0;
            existing.push({
              type_document: t,
              nombre_attendu: att,
              nombre_detecte: det,
              statut_detection: att === det ? "DETECTE" : det === 0 ? "MANQUANT" : det < att ? "MANQUANT" : "EN_TROP",
            });
          }
          const lignes: LigneControleDoc[] = existing;

          // score basé sur attendus
          const totalAtt = lignes.reduce((s, l) => s + l.nombre_attendu, 0);
          const totalRecu = lignes.reduce((s, l) => s + Math.min(l.nombre_detecte, l.nombre_attendu), 0);
          const score = totalAtt === 0 ? 0 : Math.round((totalRecu / totalAtt) * 100);

          const stillRunning = docs.some(d => d.statut_ocr === "EN_COURS");

          // track which fields are enriched by OCR
          const newOcrFields = [...x.ocr_fields];
          const ocrClient = rand(FAKE_CLIENTS);
          const ocrMontant = Math.round((50_000 + Math.random() * 500_000) * 100) / 100;
          const ocrDevise = rand(FAKE_DEVISES);
          const ocrRefExt = `EXT/${Math.floor(Math.random() * 9000 + 1000)}`;
          const ocrRefInt = `INT/${Math.floor(Math.random() * 9000 + 1000)}`;
          if (!x.produit) newOcrFields.push("produit");
          if (!x.client) newOcrFields.push("client");
          if (x.montant == null) newOcrFields.push("montant");
          if (!x.devise) newOcrFields.push("devise");
          if (!x.reference_externe) newOcrFields.push("reference_externe");
          if (!x.reference_interne) newOcrFields.push("reference_interne");

          const next: CourrierIrd = {
            ...x,
            documents: docs,
            statut_ocr: stillRunning ? x.statut_ocr : "OCR_ANALYSE",
            statut_completude: totalAtt === 0 ? "NON_CONTROLE" : score === 100 ? "COMPLET" : "AVEC_ECART",
            score_completude: score,
            controle_doc: lignes,
            ocr_fields: [...new Set(newOcrFields)],
            // enrichissement progressif : n'écrase JAMAIS la saisie utilisateur
            produit: x.produit ?? "REMISE_DOCUMENTAIRE_IMPORT",
            client: x.client ?? ocrClient,
            montant: x.montant ?? ocrMontant,
            devise: x.devise ?? ocrDevise,
            reference_externe: x.reference_externe ?? ocrRefExt,
            reference_interne: x.reference_interne ?? ocrRefInt,
            updated_at: nowIso(),
          };
          next.historique = [...next.historique, {
            id: nanoid(8), date: nowIso(), acteur: "system",
            type: "OCR", message: `OCR terminé — score complétude ${score}%`,
          }];
          return next;
        }),
      }));
    }, delay);
  },

  applyCourrierIrdAction: (id, action, payload) => {
    const acteur = get().acteurCourant;
    set(s => ({
      courriersIrd: s.courriersIrd.map(x => {
        if (x.id !== id) return x;
        let next: CourrierIrd = { ...x, updated_at: nowIso() };
        switch (action) {
          case "VALIDER_CREATION":
            if (x.statut_workflow !== "EN_PREPARATION") return x;
            if (acteur !== "AGENCE") return x;
            next.statut_workflow = "EN_ATTENTE_VALIDATION_AGENCE";
            next.commentaire_retour_validation = undefined;
            break;
          case "VALIDER_ET_ENVOYER":
            if (x.statut_workflow !== "EN_ATTENTE_VALIDATION_AGENCE") return x;
            if (acteur !== "RESPONSABLE_AGENCE") return x;
            next.statut_workflow = "ENVOYE_CTN";
            next.responsable_validation = "Responsable agence Casablanca";
            next.date_validation_agence = nowIso();
            next.localisation_physique = "EN_TRANSIT_CTN";
            break;
          case "RETOURNER_CORRECTION":
            if (x.statut_workflow !== "EN_ATTENTE_VALIDATION_AGENCE") return x;
            if (acteur !== "RESPONSABLE_AGENCE") return x;
            next.statut_workflow = "EN_PREPARATION";
            next.commentaire_retour_validation = payload?.commentaire;
            break;
        }
        next.historique = [...next.historique, {
          id: nanoid(8), date: nowIso(), acteur,
          type: "WORKFLOW",
          message: `${x.statut_workflow} → ${next.statut_workflow} (${action})`
            + (payload?.commentaire ? ` — ${payload.commentaire}` : ""),
        }];
        return next;
      }),
    }));
  },

  resetSeed: () => {
    set({ courriers: [], dossiers: [], courriersIrd: [] });
    seedDemo();
  },
}));

/* ---------- Seed demo data ---------- */
function seedDemo() {
  const s = useTomStore.getState();

  // 1 courrier with one dossier déjà OCRé
  const c1 = s.createCourrier({
    reference_transporteur: "DHL5582019",
    type_courrier: "DHL",
    numero_lot: "LOT-2026-019",
    entite_expediteur: "BNP Paribas Paris",
  });
  const d1 = s.createDossier(c1.id, "ENTREE_IRD");
  s.addDocuments(d1.id, [
    { type_document: "LETTRE_ACCOMPAGNEMENT", filename: "LAC_BNP_001.pdf" },
    { type_document: "FACTURE", filename: "INV_001.pdf" },
    { type_document: "FACTURE", filename: "INV_002.pdf" },
    { type_document: "FACTURE", filename: "INV_003.pdf" },
    { type_document: "FACTURE", filename: "INV_004.pdf" },
    { type_document: "BL", filename: "BL_001.pdf" },
    { type_document: "BL", filename: "BL_002.pdf" },
    { type_document: "CERTIFICAT_ORIGINE", filename: "CO_001.pdf" },
  ]);
  useTomStore.getState().lancerOcr(d1.id);

  // 1 session vide en préparation (agence)
  const c2 = s.createCourrier({
    reference_transporteur: "UPS7732001",
    type_courrier: "UPS",
    entite_expediteur: "Société Générale Marseille",
  });
  const d2 = s.createDossier(c2.id, "ENTREE_IRD");
  s.addDocuments(d2.id, [
    { type_document: "LETTRE_ACCOMPAGNEMENT", filename: "LAC_SG_002.pdf" },
    { type_document: "FACTURE", filename: "INV_021.pdf" },
    { type_document: "FACTURE", filename: "INV_022.pdf" },
  ]);

  /* ===== Seed module Centralisation des courriers IRD ===== */
  // Courrier 1 — EN_PREPARATION (à OCRiser)
  const ci1 = s.createCourrierIrd({
    type_transporteur: "DHL",
    reference_transporteur: "DHL5582019",
  });
  s.addDocumentsCourrierIrd(ci1.id, [
    { type_document: "LETTRE_ACCOMPAGNEMENT", filename: "LAC_BNP_001.pdf" },
    { type_document: "FACTURE", filename: "INV_001.pdf" },
    { type_document: "FACTURE", filename: "INV_002.pdf" },
    { type_document: "BL", filename: "BL_001.pdf" },
  ]);

  // Courrier 2 — OCR_EN_COURS
  const ci2 = s.createCourrierIrd({
    type_transporteur: "UPS",
    reference_transporteur: "UPS7732001",
  });
  s.addDocumentsCourrierIrd(ci2.id, [
    { type_document: "LETTRE_ACCOMPAGNEMENT", filename: "LAC_SG.pdf" },
    { type_document: "FACTURE", filename: "INV_010.pdf" },
    { type_document: "FACTURE", filename: "INV_011.pdf" },
    { type_document: "FACTURE", filename: "INV_012.pdf" },
    { type_document: "CERTIFICAT_ORIGINE", filename: "CO_010.pdf" },
  ]);
  useTomStore.getState().lancerOcrCourrierIrd(ci2.id);

  // Courrier 3 — EN_ATTENTE_VALIDATION_AGENCE (prêt pour responsable)
  const ci3 = s.createCourrierIrd({
    type_transporteur: "FEDEX",
    reference_transporteur: "FX99204411",
  });
  s.addDocumentsCourrierIrd(ci3.id, [
    { type_document: "FACTURE", filename: "INV_300.pdf" },
    { type_document: "BL", filename: "BL_300.pdf" },
    { type_document: "CERTIFICAT_ORIGINE", filename: "CO_300.pdf" },
  ]);
  setTimeout(() => {
    useTomStore.getState().updateCourrierIrd(ci3.id, {
      statut_workflow: "EN_ATTENTE_VALIDATION_AGENCE",
      statut_ocr: "OCR_ANALYSE",
      statut_completude: "COMPLET",
      score_completude: 100,
      produit: "REMISE_DOCUMENTAIRE_IMPORT",
      client: "MEDITERRANEA TRADING",
      montant: 142_500,
      devise: "EUR",
      reference_interne: "INT/4421",
      reference_externe: "EXT/8842",
      localisation_physique: "AGENCE",
      ocr_fields: ["produit", "client", "montant", "devise", "reference_interne", "reference_externe"],
      controle_doc: [
        { type_document: "FACTURE", nombre_attendu: 1, nombre_detecte: 1, statut_detection: "DETECTE" },
        { type_document: "BL", nombre_attendu: 1, nombre_detecte: 1, statut_detection: "DETECTE" },
        { type_document: "CERTIFICAT_ORIGINE", nombre_attendu: 1, nombre_detecte: 1, statut_detection: "DETECTE" },
      ],
    });
  }, 200);

  // Courrier 4 — ENVOYE_CTN (validé et envoyé)
  const ci4 = s.createCourrierIrd({
    type_transporteur: "ARAMEX",
    reference_transporteur: "ARX2204188",
  });
  s.addDocumentsCourrierIrd(ci4.id, [
    { type_document: "FACTURE", filename: "INV_400.pdf" },
    { type_document: "BL", filename: "BL_400.pdf" },
  ]);
  setTimeout(() => {
    useTomStore.getState().updateCourrierIrd(ci4.id, {
      statut_workflow: "ENVOYE_CTN",
      statut_ocr: "OCR_ANALYSE",
      statut_completude: "COMPLET",
      score_completude: 100,
      produit: "REMISE_DOCUMENTAIRE_IMPORT",
      client: "OCEANIC SHIPPING",
      montant: 275_000,
      devise: "USD",
      reference_interne: "INT/5501",
      reference_externe: "EXT/7720",
      localisation_physique: "EN_TRANSIT_CTN",
      ocr_fields: ["produit", "client", "montant", "devise", "reference_interne", "reference_externe"],
      responsable_validation: "Responsable agence Casablanca",
      date_validation_agence: nowIso(),
      controle_doc: [
        { type_document: "FACTURE", nombre_attendu: 1, nombre_detecte: 1, statut_detection: "DETECTE" },
        { type_document: "BL", nombre_attendu: 1, nombre_detecte: 1, statut_detection: "DETECTE" },
      ],
    });
  }, 200);
}

if (typeof window !== "undefined" && useTomStore.getState().dossiers.length === 0) {
  seedDemo();
}
