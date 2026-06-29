/* ============================================================
   TOM / IRD — Domain types
   Architecture: workflow-driven, event-driven, OCR async,
   extensible multi-produits. TI+ is NOT the master workflow.
   ============================================================ */

export type Produit = "IRD" | "ILC" | "CBR";

export type TypeEvenement =
  | "ENTREE_IRD"
  | "PAIEMENT"
  | "ACCEPTATION"
  | "ACCEPTATION_AVEC_AVAL"
  | "RETOUR_DOCUMENTS"
  | "ENVOI_EFFETS";

export type TypeCourrier = "DHL" | "UPS" | "FEDEX" | "ARAMEX" | "AMANA" | "INTERNE";

export type StatutCourrier = "EN_COURS_DEPOUILLEMENT" | "TERMINE";

/* Agency states (session de dépouillement) ----  BO states ---- terminaux */
export type StatutWorkflow =
  | "EN_PREPARATION"
  | "OCR_EN_COURS"
  | "A_CONTROLER"
  | "PRET_A_TRANSMETTRE"
  | "TRANSMIS_BO"
  | "EN_TRAITEMENT_BO"
  | "ENVOYE_TI_PLUS"
  | "DOSSIER_CREE"
  | "REJETE"
  | "CLOTURE";

/** States during which the dossier is still an agency session
 *  (not visible from BO file). */
export const AGENCY_SESSION_STATES: StatutWorkflow[] = [
  "EN_PREPARATION",
  "OCR_EN_COURS",
  "A_CONTROLER",
  "PRET_A_TRANSMETTRE",
];

/** States visible in the Back Office file. */
export const BO_VISIBLE_STATES: StatutWorkflow[] = [
  "TRANSMIS_BO",
  "EN_TRAITEMENT_BO",
  "ENVOYE_TI_PLUS",
  "DOSSIER_CREE",
];

export type StatutOcr = "NON_LANCE" | "EN_COURS" | "TERMINE" | "PARTIEL" | "ECHEC";

export type StatutCompletude = "NON_CONTROLE" | "COMPLET" | "AVEC_ECART" | "A_VERIFIER";

export type StatutPhysique =
  | "DOCS_RECUS_AGENCE"
  | "DOCS_RECUS_BO"
  | "DOCS_EN_TRANSFERT"
  | "DOCS_EN_AGENCE"
  | "DOCS_REMIS_CLIENT"
  | "DOCS_RETOUR_BO"
  | "DOCS_ARCHIVES";

export type TypeDocument =
  | "LETTRE_ACCOMPAGNEMENT"
  | "FACTURE"
  | "BL"
  | "CERTIFICAT_ORIGINE"
  | "TRAITE"
  | "EFFET"
  | "DHL"
  | "AUTRE";

export type StatutDetection = "ATTENDU" | "DETECTE" | "MANQUANT" | "EN_TROP";

export type TypeTache =
  | "CONTROLER_OCR_AGENCE"
  | "AFFECTER_DOSSIER"
  | "CONTROLER_DOSSIER_BO"
  | "INITIER_PAIEMENT"
  | "CONFIRMER_REMISE_CLIENT"
  | "PREPARER_ENVOI_EFFETS";

export type StatutTache = "A_FAIRE" | "EN_COURS" | "TERMINEE" | "ANNULEE";

export type EquipeActeur = "AGENCE" | "RESPONSABLE_AGENCE" | "BO_IRD" | "RESPONSABLE_BO" | "CTN_DEVISE" | "SYSTEM";

/* ---------- Centralisation des courriers IRD ---------- */

export type StatutCourrierWorkflow =
  | "EN_PREPARATION"
  | "EN_ATTENTE_VALIDATION_AGENCE"
  | "ENVOYE_CTN";

export type StatutOcrCourrier = "OCR_A_REALISER" | "OCR_ANALYSE";

export type LocalisationPhysique =
  | "AGENCE"
  | "EN_TRANSIT_CTN"
  | "CTN_DEVISE"
  | "CLIENT"
  | "ARCHIVE";

export type TeamTraitement = "TEAM_IRD";

export type TypeTransporteur = "DHL" | "UPS" | "FEDEX" | "ARAMEX" | "AUTRE";

export type ProduitIrd = "REMISE_DOCUMENTAIRE_IMPORT";

export type MotifRetourCtn =
  | "DOCUMENT_INCOMPLET"
  | "SCAN_ILLISIBLE"
  | "MAUVAIS_DOCUMENT"
  | "OCR_INCOHERENT"
  | "REFERENCE_INTROUVABLE";

/* ---------- Entities ---------- */

export interface Courrier {
  id: string;
  reference_courrier: string;
  reference_transporteur?: string;
  type_courrier: TypeCourrier;
  numero_lot?: string;
  date_reception: string; // ISO
  date_scan?: string;
  entite_expediteur?: string;
  statut_courrier: StatutCourrier;
  dossierIds: string[]; // legacy (Gestion opérations IRD)
}

/** Courrier IRD enrichi (module Centralisation des courriers IRD).
 *  1 courrier = 1 future opération IRD. */
export interface CourrierIrd {
  id: string;
  reference_courrier: string;
  date_reception: string; // ISO
  agence_reception: string;
  reference_transporteur?: string;
  type_transporteur: TypeTransporteur;
  team_traitement: TeamTraitement; // TEAM_IRD (non modifiable MVP)

  // workflow
  statut_workflow: StatutCourrierWorkflow;
  statut_ocr: StatutOcrCourrier;
  statut_completude: StatutCompletude;
  localisation_physique: LocalisationPhysique;

  // documents scannés libres
  documents: DocumentGED[];

  // résultat OCR (renseigné après callback, modifiable)
  produit?: ProduitIrd;
  client?: string;
  client_referentiel_id?: string;
  client_referentiel_nom?: string;
  client_referentiel_agence?: string;
  montant?: number;
  devise?: string;
  reference_interne?: string;
  reference_externe?: string;
  controle_doc: LigneControleDoc[];
  score_completude?: number;
  /** Field names enriched by OCR (for green border indicator) */
  ocr_fields: string[];

  // validation agence
  responsable_validation?: string;
  date_validation_agence?: string;
  commentaire_retour_validation?: string;

  historique: HistoriqueEvent[];
  created_at: string;
  updated_at: string;
}

export const COURRIER_CORBEILLES = {
  EN_PREPARATION:     ["EN_PREPARATION"] as StatutCourrierWorkflow[],
  A_VALIDER_AGENCE:   ["EN_ATTENTE_VALIDATION_AGENCE"] as StatutCourrierWorkflow[],
  ENVOYES:            ["ENVOYE_CTN"] as StatutCourrierWorkflow[],
} as const;

export type StatutOcrDoc = "NON_LANCE" | "EN_COURS" | "TERMINE" | "ECHEC";

export interface DocumentGED {
  id: string;
  type_document: TypeDocument;
  filename: string;
  uploadedAt: string;
  // per-document OCR state (allows incremental analysis)
  statut_ocr: StatutOcrDoc;
  score_ocr?: number;
  nombre_detecte?: number;
}

export interface LigneControleDoc {
  type_document: TypeDocument;
  nombre_attendu: number;
  nombre_detecte: number;
  statut_detection: StatutDetection;
}

export interface OcrExtractionDossier {
  produit?: Produit;
  type_evenement?: TypeEvenement;
  client?: string;
  montant?: number;
  devise?: string;
  reference_interne?: string;
  reference_externe?: string;
}

export interface OcrExtractionCourrier {
  reference_transporteur?: string;
  type_courrier?: TypeCourrier;
  numero_lot?: string;
}

export interface Tache {
  id: string;
  type_tache: TypeTache;
  equipe: EquipeActeur;
  acteur?: string;
  statut: StatutTache;
  date_creation: string;
  date_echeance?: string;
  commentaire?: string;
}

export interface TrackingEvent {
  id: string;
  date: string;
  statut_physique: StatutPhysique;
  acteur?: string;
  commentaire?: string;
}

export interface HistoriqueEvent {
  id: string;
  date: string;
  acteur: string;
  type: string; // e.g. WORKFLOW_TRANSITION, OCR, TACHE, etc.
  message: string;
}

export interface ClientReferentiel {
  id: string;
  nom: string;
  identifiant: string;
  agence_rattachement: string;
}

export interface DossierTOM {
  id: string;
  reference_tom: string;
  reference_tiplus?: string;
  courrierId: string;

  produit: Produit;
  type_evenement: TypeEvenement;

  client?: string;
  montant?: number;
  devise?: string;
  agence?: string;

  reference_interne?: string;
  reference_externe?: string;

  statut_workflow: StatutWorkflow;
  statut_ocr: StatutOcr;
  statut_completude: StatutCompletude;
  statut_physique: StatutPhysique;

  ocr_dossier?: OcrExtractionDossier;
  ocr_courrier?: OcrExtractionCourrier;
  controle_doc: LigneControleDoc[];
  score_completude?: number;

  documents: DocumentGED[];
  taches: Tache[];
  tracking: TrackingEvent[];
  historique: HistoriqueEvent[];

  gestionnaire_bo?: string;
  created_at: string;
  updated_at: string;
}
