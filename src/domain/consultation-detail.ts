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

export interface SwiftMessage {
  reference: string;
  type: string;
  dateEmission: string;
  contenu: string;
  fichier?: string;
}

export interface EcritureComptable {
  compte: string;
  libelle: string;
  montant: number;
  devise: string;
  sens: "DR" | "CR";
  dateValeur: string;
}

export interface FraisCommission {
  type: string;
  description: string;
  devise: string;
  montant: number;
  supportePar: "Tiré" | "Tireur";
  statut: string;
  dateReglement: string;
}

export interface DemandeRetour {
  origine: string;
  dateDemande: string;
  motif: string;
  description: string;
}

export interface ReponseRetour {
  origine: string;
  dateReponse: string;
  raison: string;
  description: string;
}

export interface PersonneAutorisee {
  nomPrenom: string;
  cin: string;
  instructionClient: string;
}

export interface RetourDocument {
  typeDemande: "Demande" | "Réponse" | "Retour";
  demande?: DemandeRetour;
  reponse?: ReponseRetour;
  personneAutorisee?: PersonneAutorisee;
}

export interface DocumentCentralisation {
  type: string;
  nombreAttendu: number;
  nombreRecu: number;
  ecart: number;
  statut: string;
}

export interface CentralisationDocument {
  referenceCentralisation: string;
  produit: string;
  client: string;
  montant: number;
  devise: string;
  referenceInterne: string;
  referenceExterne: string;
  documents: DocumentCentralisation[];
}

export interface SuiviEtape {
  titre: string;
  statut: "Terminé" | "Reçu" | "Non reçu";
  champs: { label: string; valeur: string }[];
}

export interface FraisDetail {
  type: string;
  description?: string;
  montant: number;
  devise: string;
  supportePar: string;
  statut: string;
}

export interface DocumentRecu {
  type: string;
  premierEnvoi: number;
  deuxiemeEnvoi: number;
  total: number;
}

export interface PaiementDetail {
  montant: number;
  devise: string;
  typeTraite: string;
  dateEcheance: string | null;
}

export interface Intervenant {
  role: string;
  nom: string;
  adresse: string;
  pays: string;
}

export interface ReceptionRemise {
  dateEcheance: string;
  paiementMultiple: boolean;
  codeAgence: string;
  natureOfficeChanges: string;
  changementDomiciliation: string;
  retourRemise: string;
  escompteDemande: string;
  financement: string;
  descriptionMarchandises: string;
  referenceTransporteur: string;
  lieuExpedition: string;
  lieuDestination: string;
  dateExpeditionPrevue: string;
  navireAvion: string;
  montantDocumentsPresentes: number;
  totalFrais: number;
  intervenants: Intervenant[];
  paiements: PaiementDetail[];
  frais: FraisDetail[];
  documentsRecus: DocumentRecu[];
  suivi: SuiviEtape[];
  accuseReception?: {
    emetteur: string;
    numeroCourrier: string;
    dateEnvoi: string;
    heureEnvoi: string;
    receptionEffectueePar: string;
    dateHeureReception: string;
    statut: string;
    observation: string;
  };
}

export interface AccuseReceptionInfo {
  emetteur: string;
  numeroCourrier: string;
  dateEnvoi: string;
  typeEvenement: string;
  motif: string;
  commentaire: string;
  receptionEffectueePar: string;
  dateHeureReception: string;
  statutReception: string;
  commentaireReception: string;
}

export interface ExpirationInfo {
  libelleEvenement: string;
  referenceCorrespondant: string;
  montantDocuments: number;
  montantPaye: number;
  montantRestant: number;
  frais: FraisCommission[];
  documentsAttaches?: { nom: string }[];
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
  swifts?: SwiftMessage[];
  ecrituresComptables?: EcritureComptable[];
  fraisCommissions?: FraisCommission[];
  fraisMaroc?: string;
  fraisEtranger?: string;
  retourDocument?: RetourDocument;
  centralisationDocument?: CentralisationDocument;
  expiration?: ExpirationInfo;
  accuseReception?: AccuseReceptionInfo;
  receptionRemise?: ReceptionRemise;
  suivi?: SuiviEtape[];
  saisieAgence?: { commentaire?: string; effet?: "Avec aval" | "Sans aval"; dateEcheance?: string; motif?: string; destinataire?: string; datePaiement?: string; dateEvenement?: string };
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
