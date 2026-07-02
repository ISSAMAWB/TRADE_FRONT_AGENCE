export type ProduitCode = "ILC" | "IRD" | "ELC" | "ERD" | "FIN";
export type StatutDossier = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";
export type StatutEvenement = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";

export type FormatChamp =
  | "montant"
  | "montant-declare"
  | "montant-emphase"
  | "montant-avec-attente"
  | "date"
  | "badge-confirmation"
  | "texte"
  | "tableau-paiements"
  | "tableau-courriers"
  | "multi-valeurs"
  | "multi-valeurs-ird";

export interface Paiement {
  uetr: string;
  montant: number;
  devise: string;
  datePaiement: string;
}

export interface Courrier {
  reference: string;
  dateEnvoi: string;
}

export interface ClientInfo {
  raisonSociale: string;
  numeroCompte: string;
  ice: string;
  codeClient: string;
  agenceRattachement: string;
  roleOperation: string;
}

export interface AgenceInfo {
  referenceCTN: string;
  agenceTraitante: string;
  gestionnaire: string;
  datePriseEnCharge: string;
  statutOperationnel: string;
  controleDocumentaire: string;
  prochaineAction: string;
  noteInterne: string;
}

export interface ChampSchema {
  cle: string;
  label: string;
  format?: FormatChamp;
  estClient?: boolean;
}

export interface BlocSchema {
  titre: string;
  icone: string;
  champs: ChampSchema[];
}

export interface ProduitSchema {
  code: ProduitCode;
  libelle: string;
  blocs: BlocSchema[];
}

export interface EvenementTrade {
  reference: string;
  nature: string;
  montant: number | null;
  devise: string;
  dateCreation: string;
  statut: StatutEvenement;
  uetr?: string;
  datePaiement?: string;
}

export type MontantAvecDevise = { valeur: number; devise: string };

export interface DossierTrade {
  reference: string;
  produit: ProduitCode;
  produitLibelle: string;
  client: string;
  statut: StatutDossier;
  dateMiseAJour?: string;
  clientInfo?: ClientInfo;
  agenceInfo?: AgenceInfo;
  donnees: Record<string, string | number | null | string[] | MontantAvecDevise | Paiement[] | Courrier[]>;
  evenements: EvenementTrade[];
}
