/* ============================================================
   Module Consultation — Types dédiés
   Vue read-only des dossiers Trade Finance pour l'agence
   ============================================================ */

export type ProduitTrade = "ILC" | "IRD" | "ERD" | "ELC" | "FIN";

export type StatutDossier = "En cours" | "Expiré" | "Annulé";

export type DeviseTrade = "USD" | "EUR" | "GBP" | "MAD" | "JPY" | "CHF";

export type CanalInteraction = "mail" | "tel" | "email";

export interface Client {
  nom: string;
  compte: string;
  ice: string;
  code: string;
}

export interface AgentCTN {
  nom: string;
  prenom: string;
  code: string;
}

export interface Encours {
  utilise: number;
  autorise: number;
  devise: DeviseTrade;
}

export interface NoteInterne {
  date: string;
  auteur: string;
  texte: string;
}

export interface Evenement {
  id: string;
  date: string;
  type: string;
  statut: string;
  montant: number | null;
}

export interface Dossier {
  id: string;
  produit: ProduitTrade;
  typeFinancement?: string;
  client: Client;
  montant: number;
  devise: DeviseTrade;
  dateCreation: string;
  dateEcheance: string;
  banqueCorrespondante: string;
  paysOrigine: string;
  statut: StatutDossier;
  evenementCourant?: string;

  // Vue agence
  refCTN: string;
  codeAgence: string;
  agentCTN: AgentCTN;
  datePriseEnCharge: string;
  statutOperationnel: string;
  controleDocumentaire: string;
  encours: Encours;
  commission: number;
  tauxChange: number;
  derniereInteraction: string;
  canalInteraction: CanalInteraction;
  notes: NoteInterne[];
  evenements: Evenement[];
}

export interface FiltresDossiers {
  produits: ProduitTrade[];
  client: string;
  evenementCourant: string[];
  montantMin: string;
  montantMax: string;
  devise: DeviseTrade | "";
  dateDebut: string;
  dateFin: string;
  statuts: StatutDossier[];
}
