export type ProduitCode = "ILC" | "IRD" | "ELC" | "ERD";
export type StatutDossier = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";
export type StatutEvenement = "VALIDE" | "EN_COURS" | "EN_ATTENTE" | "REJETE";
export type CanalEvenement = "SWIFT" | "MANUEL" | "TI+";

export interface EvenementTrade {
  reference: string;
  nature: string;
  montant: number | null;
  devise: string;
  dateCreation: string;
  statut: StatutEvenement;
  description: string;
  canal: CanalEvenement;
  refSwift: string | null;
  emetteur: string;
  entite: string;
  dateEcheance: string | null;
  piecesJointes: number;
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
