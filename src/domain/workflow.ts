/* ============================================================
   Extensible workflow engine.
   Each "event" (ENTREE_IRD, PAIEMENT, ...) declares its own
   transitions and tasks. The UI is driven by config, never by
   hard-coded statuses.
   ============================================================ */

import type {
  TypeEvenement,
  StatutWorkflow,
  TypeTache,
  EquipeActeur,
} from "./types";

export interface TransitionRule {
  from: StatutWorkflow;
  to: StatutWorkflow;
  action: string;        // label of action button
  allowedFor: EquipeActeur[];
  spawnTasks?: { type_tache: TypeTache; equipe: EquipeActeur }[];
  guard?: string;        // free-form guard name (UI hint)
}

export interface WorkflowDefinition {
  type_evenement: TypeEvenement;
  label: string;
  initial: StatutWorkflow;
  transitions: TransitionRule[];
}

/* ---------- ENTREE_IRD (MVP) — progressive, async-OCR friendly ----------
   Agency session: EN_PREPARATION → (OCR_EN_COURS) → A_CONTROLER → PRET_A_TRANSMETTRE → TRANSMIS_BO
   BO side       : TRANSMIS_BO → EN_TRAITEMENT_BO → ENVOYE_TI_PLUS → DOSSIER_CREE
*/

const ENTREE_IRD: WorkflowDefinition = {
  type_evenement: "ENTREE_IRD",
  label: "Entrée IRD",
  initial: "EN_PREPARATION",
  transitions: [
    /* --- agency session --- */
    { from: "EN_PREPARATION",    to: "OCR_EN_COURS",      action: "Lancer OCR",                    allowedFor: ["AGENCE"] },
    { from: "OCR_EN_COURS",      to: "A_CONTROLER",       action: "Callback OCR (system)",         allowedFor: ["SYSTEM"],
      spawnTasks: [{ type_tache: "CONTROLER_OCR_AGENCE", equipe: "AGENCE" }] },

    // L'agence peut relancer OCR à tout moment
    { from: "A_CONTROLER",       to: "OCR_EN_COURS",      action: "Relancer OCR",                  allowedFor: ["AGENCE"] },
    { from: "PRET_A_TRANSMETTRE",to: "OCR_EN_COURS",      action: "Relancer OCR",                  allowedFor: ["AGENCE"] },

    // Marquer prêt / revenir au contrôle
    { from: "A_CONTROLER",       to: "PRET_A_TRANSMETTRE",action: "Marquer prêt à transmettre",    allowedFor: ["AGENCE"] },
    { from: "PRET_A_TRANSMETTRE",to: "A_CONTROLER",       action: "Revenir au contrôle",           allowedFor: ["AGENCE"] },

    // Transmission BO (verrouille la session)
    { from: "PRET_A_TRANSMETTRE",to: "TRANSMIS_BO",       action: "Transmettre au Back Office",    allowedFor: ["AGENCE"],
      spawnTasks: [{ type_tache: "AFFECTER_DOSSIER", equipe: "RESPONSABLE_BO" }] },

    /* --- BO side --- */
    { from: "TRANSMIS_BO",       to: "EN_TRAITEMENT_BO",  action: "Affecter gestionnaire",         allowedFor: ["RESPONSABLE_BO"],
      spawnTasks: [{ type_tache: "CONTROLER_DOSSIER_BO", equipe: "BO_IRD" }] },
    { from: "EN_TRAITEMENT_BO",  to: "ENVOYE_TI_PLUS",    action: "Envoyer vers TI+",              allowedFor: ["BO_IRD"] },
    { from: "ENVOYE_TI_PLUS",    to: "DOSSIER_CREE",      action: "Retour TI+ (system)",           allowedFor: ["SYSTEM"] },

    /* --- rejets --- */
    { from: "A_CONTROLER",       to: "REJETE", action: "Rejeter", allowedFor: ["AGENCE"] },
    { from: "EN_TRAITEMENT_BO",  to: "REJETE", action: "Rejeter", allowedFor: ["BO_IRD", "RESPONSABLE_BO"] },
  ],
};

/* ---------- Skeleton workflows (extensibility) ---------- */

const skeleton = (e: TypeEvenement, label: string): WorkflowDefinition => ({
  type_evenement: e,
  label,
  initial: "EN_PREPARATION",
  transitions: [
    { from: "EN_PREPARATION",    to: "OCR_EN_COURS",       action: "Lancer OCR",                 allowedFor: ["AGENCE"] },
    { from: "OCR_EN_COURS",      to: "A_CONTROLER",        action: "Callback OCR (system)",      allowedFor: ["SYSTEM"],
      spawnTasks: [{ type_tache: "CONTROLER_OCR_AGENCE", equipe: "AGENCE" }] },
    { from: "A_CONTROLER",       to: "PRET_A_TRANSMETTRE", action: "Marquer prêt à transmettre", allowedFor: ["AGENCE"] },
    { from: "PRET_A_TRANSMETTRE",to: "TRANSMIS_BO",        action: "Transmettre au Back Office", allowedFor: ["AGENCE"] },
    { from: "TRANSMIS_BO",       to: "CLOTURE",            action: "Clôturer",                   allowedFor: ["BO_IRD"] },
  ],
});

export const WORKFLOWS: Record<TypeEvenement, WorkflowDefinition> = {
  ENTREE_IRD,
  PAIEMENT:              skeleton("PAIEMENT", "Paiement"),
  ACCEPTATION:           skeleton("ACCEPTATION", "Acceptation"),
  ACCEPTATION_AVEC_AVAL: skeleton("ACCEPTATION_AVEC_AVAL", "Acceptation avec aval"),
  RETOUR_DOCUMENTS:      skeleton("RETOUR_DOCUMENTS", "Retour documents"),
  ENVOI_EFFETS:          skeleton("ENVOI_EFFETS", "Envoi effets"),
};

export function getAllowedTransitions(
  evt: TypeEvenement,
  current: StatutWorkflow,
  acteur: EquipeActeur
): TransitionRule[] {
  return WORKFLOWS[evt].transitions.filter(
    t => t.from === current && t.allowedFor.includes(acteur)
  );
}
