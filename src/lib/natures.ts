import type { NatureEvenement, NatureSchema } from "@/domain/consultation-detail";

export const NATURE_SCHEMAS: Record<NatureEvenement, NatureSchema> = {
  OUVERTURE: {
    code: "OUVERTURE",
    libelle: "Ouverture du dossier",
    icone: "ti-folder-plus",
    champsOperation: [
      { cle: "typeRemise", label: "Type de remise" },
      { cle: "donneurOrdre", label: "Donneur d'ordre" },
      { cle: "beneficiaire", label: "Bénéficiaire" },
      { cle: "banquePresentatrice", label: "Banque présentatrice" },
      { cle: "conditionsRemise", label: "Conditions de remise" },
      { cle: "instructionsReglement", label: "Instructions de règlement" },
    ],
    aide: "Création du dossier de remise documentaire avec les conditions de remise et les instructions de règlement.",
  },
  CENTRALISATION: {
    code: "CENTRALISATION",
    libelle: "Centralisation des courriers",
    icone: "ti-inbox",
    champsOperation: [
      { cle: "referenceCourrier", label: "Référence courrier" },
      { cle: "dateReception", label: "Date de réception", format: "date" },
      { cle: "nbDocuments", label: "Nombre de documents reçus" },
      { cle: "modeReception", label: "Mode de réception" },
      { cle: "conformite", label: "Conformité", format: "badge" },
    ],
  },
  MODIFICATION: {
    code: "MODIFICATION",
    libelle: "Modification",
    icone: "ti-edit",
    champsOperation: [
      { cle: "champModifie", label: "Champ modifié" },
      { cle: "valeurAvant", label: "Valeur avant" },
      { cle: "valeurApres", label: "Valeur après" },
      { cle: "motif", label: "Motif", pleineLargeur: true },
      { cle: "demandeur", label: "Demandeur" },
    ],
  },
  ACCEPTATION: {
    code: "ACCEPTATION",
    libelle: "Acceptation",
    icone: "ti-writing-sign",
    champsOperation: [
      { cle: "tireCorrespondant", label: "Tiré / Correspondant" },
      { cle: "dateAcceptation", label: "Date d'acceptation", format: "date" },
      { cle: "echeanceAcceptee", label: "Échéance acceptée", format: "date" },
      { cle: "montantAccepte", label: "Montant accepté", format: "montant" },
    ],
  },
  LEVEE_RESERVE: {
    code: "LEVEE_RESERVE",
    libelle: "Levée de réserve",
    icone: "ti-shield-check",
    champsOperation: [
      { cle: "reserves", label: "Réserve(s) concernée(s)" },
      { cle: "dateLevee", label: "Date de levée", format: "date" },
      { cle: "decision", label: "Décision", format: "badge" },
      { cle: "montantConcerne", label: "Montant concerné", format: "montant" },
      { cle: "validePar", label: "Validé par" },
    ],
  },
  REGLEMENT: {
    code: "REGLEMENT",
    libelle: "Règlement / Paiement",
    icone: "ti-cash",
    champsOperation: [
      { cle: "montantRegle", label: "Montant réglé", format: "montant" },
      { cle: "dateValeur", label: "Date de valeur", format: "date" },
      { cle: "modeReglement", label: "Mode de règlement" },
      { cle: "compteDebite", label: "Compte débité" },
      { cle: "compteCredite", label: "Compte crédité" },
      { cle: "coursChange", label: "Cours de change" },
      { cle: "commissions", label: "Commissions", format: "montant" },
    ],
  },
  AVIS_SORT: {
    code: "AVIS_SORT",
    libelle: "Avis de sort",
    icone: "ti-mail-forward",
    champsOperation: [
      { cle: "sort", label: "Sort", format: "badge" },
      { cle: "dateAvis", label: "Date de l'avis", format: "date" },
      { cle: "motif", label: "Motif", pleineLargeur: true },
    ],
  },
  MAINLEVEE: {
    code: "MAINLEVEE",
    libelle: "Mainlevée des documents",
    icone: "ti-file-check",
    champsOperation: [
      { cle: "beneficiaireDocuments", label: "Bénéficiaire des documents" },
      { cle: "dateRemise", label: "Date de remise", format: "date" },
      { cle: "documentsRemis", label: "Documents remis" },
      { cle: "contrepartie", label: "Contrepartie" },
    ],
  },
  PROROGATION: {
    code: "PROROGATION",
    libelle: "Prorogation d'échéance",
    icone: "ti-calendar-clock",
    champsOperation: [
      { cle: "ancienneEcheance", label: "Ancienne échéance", format: "date" },
      { cle: "nouvelleEcheance", label: "Nouvelle échéance", format: "date" },
      { cle: "motif", label: "Motif", pleineLargeur: true },
    ],
  },
  CLOTURE: {
    code: "CLOTURE",
    libelle: "Clôture / Annulation",
    icone: "ti-folder-x",
    champsOperation: [
      { cle: "motifCloture", label: "Motif de clôture", pleineLargeur: true },
      { cle: "dateCloture", label: "Date de clôture", format: "date" },
      { cle: "soldeResiduel", label: "Solde résiduel", format: "montant" },
    ],
  },
};

export function getNatureSchema(nature: NatureEvenement): NatureSchema | undefined {
  return NATURE_SCHEMAS[nature];
}
