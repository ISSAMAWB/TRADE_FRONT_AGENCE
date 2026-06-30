export type ProduitCode = "ILC" | "IRD" | "ELC" | "ERD";
export type StatutDossier = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";
export type StatutEvenement = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";
export type CanalEvenement = "SWIFT" | "MANUEL" | "TI+";

export type NatureEvenement =
  | "OUVERTURE"
  | "CENTRALISATION"
  | "MODIFICATION"
  | "ACCEPTATION"
  | "LEVEE_RESERVE"
  | "REGLEMENT"
  | "AVIS_SORT"
  | "MAINLEVEE"
  | "PROROGATION"
  | "CLOTURE";

export type FormatChamp = "texte" | "montant" | "date" | "datetime" | "badge";

export interface DocumentJoint {
  nom: string;
  type: string;
  taille?: string;
}

export interface ChampSchema {
  cle: string;
  label: string;
  format?: FormatChamp;
  pleineLargeur?: boolean;
}

export interface NatureSchema {
  code: NatureEvenement;
  libelle: string;
  icone: string;
  champsOperation: ChampSchema[];
  aide?: string;
}

export interface EvenementTrade {
  reference: string;
  nature: NatureEvenement;
  natureLibelle: string;
  montant: number | null;
  devise: string;
  dateCreation: string;
  statut: StatutEvenement;
  detailsGeneraux: {
    referenceOperation: string;
    dossierRattache: string;
    dateEcheance: string | null;
    canal: CanalEvenement;
    refSwift: string | null;
    emetteur: string;
    entite: string;
  };
  detailsOperation: Record<string, string | number | null>;
  notes?: string;
  documents: DocumentJoint[];
}

export interface DossierTrade {
  reference: string;
  produit: ProduitCode;
  produitLibelle: string;
  client: string;
  compte: string;
  ice: string;
  codeClient: string;
  montant: number;
  devise: string;
  dateCreation: string;
  dateEcheance: string;
  banqueCorrespondante: string;
  paysOrigine: string;
  statut: StatutDossier;
  evenements: EvenementTrade[];
}
