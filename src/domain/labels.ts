import type {
  StatutWorkflow, StatutOcr, StatutCompletude, StatutPhysique,
  TypeTache, TypeEvenement, TypeDocument,
  StatutCourrierWorkflow, StatutOcrCourrier, LocalisationPhysique, TypeTransporteur,
  MotifRetourCtn, ProduitIrd,
} from "./types";

export const WORKFLOW_LABEL: Record<StatutWorkflow, string> = {
  EN_PREPARATION: "En préparation",
  OCR_EN_COURS: "OCR en cours",
  A_CONTROLER: "À contrôler",
  PRET_A_TRANSMETTRE: "Prêt à transmettre",
  TRANSMIS_BO: "Transmis BO",
  EN_TRAITEMENT_BO: "En traitement — BO",
  ENVOYE_TI_PLUS: "Envoyé TI+",
  DOSSIER_CREE: "Dossier créé",
  REJETE: "Rejeté",
  CLOTURE: "Clôturé",
};

export const OCR_LABEL: Record<StatutOcr, string> = {
  NON_LANCE: "Non lancé",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  PARTIEL: "Partiel",
  ECHEC: "Échec",
};

export const COMPLETUDE_LABEL: Record<StatutCompletude, string> = {
  NON_CONTROLE: "Non contrôlé",
  COMPLET: "Complet",
  AVEC_ECART: "Avec écart",
  A_VERIFIER: "À vérifier",
};

export const PHYSIQUE_LABEL: Record<StatutPhysique, string> = {
  DOCS_RECUS_AGENCE: "Reçus agence",
  DOCS_RECUS_BO: "Reçus BO",
  DOCS_EN_TRANSFERT: "En transfert",
  DOCS_EN_AGENCE: "En agence",
  DOCS_REMIS_CLIENT: "Remis client",
  DOCS_RETOUR_BO: "Retour BO",
  DOCS_ARCHIVES: "Archivés",
};

export const TACHE_LABEL: Record<TypeTache, string> = {
  CONTROLER_OCR_AGENCE: "Contrôler OCR (agence)",
  AFFECTER_DOSSIER: "Affecter dossier",
  CONTROLER_DOSSIER_BO: "Contrôler dossier (BO)",
  INITIER_PAIEMENT: "Initier paiement",
  CONFIRMER_REMISE_CLIENT: "Confirmer remise client",
  PREPARER_ENVOI_EFFETS: "Préparer envoi effets",
};

export const EVENT_LABEL: Record<TypeEvenement, string> = {
  ENTREE_IRD: "Entrée IRD",
  PAIEMENT: "Paiement",
  ACCEPTATION: "Acceptation",
  ACCEPTATION_AVEC_AVAL: "Acceptation avec aval",
  RETOUR_DOCUMENTS: "Retour documents",
  ENVOI_EFFETS: "Envoi effets",
};

export const DOC_LABEL: Record<TypeDocument, string> = {
  LETTRE_ACCOMPAGNEMENT: "Lettre d'accompagnement",
  FACTURE: "Facture",
  BL: "Bill of Lading",
  CERTIFICAT_ORIGINE: "Certificat",
  TRAITE: "Traite",
  EFFET: "Effet",
  DHL: "DHL",
  AUTRE: "Autre",
};

export const COURRIER_WORKFLOW_LABEL: Record<StatutCourrierWorkflow, string> = {
  EN_PREPARATION:                "En préparation",
  EN_ATTENTE_VALIDATION_AGENCE:  "À valider agence",
  ENVOYE_CTN:                    "Envoyé CTN",
};

export function badgeForCourrierWorkflow(s: StatutCourrierWorkflow): string {
  switch (s) {
    case "EN_PREPARATION":               return "badge-gray";
    case "EN_ATTENTE_VALIDATION_AGENCE":  return "badge-amber";
    case "ENVOYE_CTN":                    return "badge-green";
  }
}

export const LOCALISATION_LABEL: Record<LocalisationPhysique, string> = {
  AGENCE:         "Agence",
  EN_TRANSIT_CTN: "En transit CTN",
  CTN_DEVISE:     "CTN devise",
  CLIENT:         "Client",
  ARCHIVE:        "Archive",
};

export const TRANSPORTEUR_LABEL: Record<TypeTransporteur, string> = {
  DHL: "DHL", UPS: "UPS", FEDEX: "FedEx", ARAMEX: "Aramex", AUTRE: "Autre",
};

export const MOTIF_RETOUR_LABEL: Record<MotifRetourCtn, string> = {
  DOCUMENT_INCOMPLET:     "Document incomplet",
  SCAN_ILLISIBLE:         "Scan illisible",
  MAUVAIS_DOCUMENT:       "Mauvais document",
  OCR_INCOHERENT:         "OCR incohérent",
  REFERENCE_INTROUVABLE:  "Référence introuvable",
};

export const PRODUIT_IRD_LABEL: Record<ProduitIrd, string> = {
  REMISE_DOCUMENTAIRE_IMPORT: "Remise documentaire import",
};

export function badgeForWorkflow(s: StatutWorkflow): string {
  switch (s) {
    case "EN_PREPARATION":     return "badge-gray";
    case "OCR_EN_COURS":       return "badge-blue";
    case "A_CONTROLER":        return "badge-amber";
    case "PRET_A_TRANSMETTRE": return "badge-orange";
    case "TRANSMIS_BO":        return "badge-orange";
    case "EN_TRAITEMENT_BO":   return "badge-orange";
    case "ENVOYE_TI_PLUS":     return "badge-blue";
    case "DOSSIER_CREE":       return "badge-green";
    case "REJETE":             return "badge-red";
    case "CLOTURE":            return "badge-gray";
  }
}

export function badgeForCompletude(s: StatutCompletude): string {
  switch (s) {
    case "COMPLET": return "badge-green";
    case "AVEC_ECART": return "badge-red";
    case "A_VERIFIER": return "badge-amber";
    case "NON_CONTROLE": return "badge-gray";
  }
}

export function badgeForOcr(s: StatutOcr): string {
  switch (s) {
    case "TERMINE": return "badge-green";
    case "EN_COURS": return "badge-blue";
    case "PARTIEL": return "badge-amber";
    case "ECHEC": return "badge-red";
    case "NON_LANCE": return "badge-gray";
  }
}

export const OCR_COURRIER_LABEL: Record<StatutOcrCourrier, string> = {
  OCR_A_REALISER: "OCR à réaliser",
  OCR_ANALYSE: "OCR analysé",
};

export function badgeForOcrCourrier(s: StatutOcrCourrier, ocrEnCours?: boolean): string {
  if (ocrEnCours) return "badge-blue";
  switch (s) {
    case "OCR_A_REALISER": return "badge-gray";
    case "OCR_ANALYSE": return "badge-green";
  }
}
