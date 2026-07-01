import type { ProduitSchema, ProduitCode } from "@/domain/consultation-detail";

export const PRODUIT_SCHEMAS: ProduitSchema[] = [
  {
    code: "ILC",
    libelle: "Crédit documentaire import",
    blocs: [
      {
        titre: "Détails de l'opération",
        icone: "FileText",
        champs: [
          { cle: "referenceOperation", label: "Référence de l'opération" },
          { cle: "modeRealisation", label: "Mode de réalisation" },
          { cle: "creditConfirme", label: "Crédit confirmé", format: "badge-confirmation" },
          { cle: "natureOperation", label: "Nature de l'opération" },
        ],
      },
      {
        titre: "Parties impliquées",
        icone: "Building2",
        champs: [
          { cle: "donneurOrdre", label: "Donneur d'ordre (Importateur)", estClient: true },
          { cle: "beneficiaire", label: "Bénéficiaire" },
          { cle: "banqueNotification", label: "Banque de notification" },
          { cle: "banqueConfirmation", label: "Banque de confirmation" },
        ],
      },
      {
        titre: "Informations financières",
        icone: "Banknote",
        champs: [
          { cle: "montantCredit", label: "Montant du crédit", format: "montant" },
          { cle: "tolerance", label: "Tolérance" },
          { cle: "montantReclame", label: "Montant réclamé", format: "montant-declare" },
          { cle: "montantDisponible", label: "Montant disponible", format: "montant-emphase" },
          { cle: "typeFrais", label: "Type de frais" },
        ],
      },
      {
        titre: "Date et lieu d'expiration",
        icone: "Calendar",
        champs: [
          { cle: "dateExpiration", label: "Date d'expiration", format: "date" },
          { cle: "lieuExpiration", label: "Lieu d'expiration" },
        ],
      },
      {
        titre: "Informations complémentaires",
        icone: "Info",
        champs: [
          { cle: "referencesTitresImportation", label: "Titres d'importation", format: "multi-valeurs" },
        ],
      },
    ],
  },
  {
    code: "ELC",
    libelle: "Crédit documentaire export",
    blocs: [
      {
        titre: "Détails de l'opération",
        icone: "FileText",
        champs: [
          { cle: "referenceOperation", label: "Référence de l'opération" },
          { cle: "modeRealisation", label: "Mode de réalisation" },
          { cle: "operationConfirmee", label: "Opération confirmée ?", format: "badge-confirmation" },
          { cle: "natureOperation", label: "Nature de l'opération" },
        ],
      },
      {
        titre: "Parties impliquées",
        icone: "Building2",
        champs: [
          { cle: "client", label: "Bénéficiaire", estClient: true },
          { cle: "donneurOrdre", label: "Donneur d'ordre" },
          { cle: "banqueEmettrice", label: "Banque émettrice" },
          { cle: "banqueConfirmation", label: "Banque de confirmation" },
        ],
      },
      {
        titre: "Informations financières",
        icone: "Banknote",
        champs: [
          { cle: "montantCredit", label: "Montant du crédit", format: "montant" },
          { cle: "tolerance", label: "Tolérance" },
          { cle: "montantReclame", label: "Montant réclamé", format: "montant-declare" },
          { cle: "montantDisponible", label: "Montant disponible", format: "montant-emphase" },
          { cle: "typeFrais", label: "Type de frais" },
        ],
      },
      {
        titre: "Date et lieu d'expiration",
        icone: "Calendar",
        champs: [
          { cle: "dateExpiration", label: "Date d'expiration", format: "date" },
          { cle: "lieuExpiration", label: "Lieu d'expiration" },
        ],
      },
      {
        titre: "Informations complémentaires",
        icone: "Info",
        champs: [
          { cle: "referencesCourrier", label: "Références de courrier", format: "tableau-courriers" },
        ],
      },
    ],
  },
  {
    code: "IRD",
    libelle: "Remise documentaire import",
    blocs: [
      {
        titre: "Détails de l'opération",
        icone: "FileText",
        champs: [
          { cle: "referenceOperation", label: "Référence" },
          { cle: "conditionsRemiseDocuments", label: "Conditions de remise des documents" },
          { cle: "dateEcheance", label: "Date d'échéance", format: "date" },
        ],
      },
      {
        titre: "Parties impliquées",
        icone: "Building2",
        champs: [
          { cle: "client", label: "Tiré (Importateur)", estClient: true },
          { cle: "tireur", label: "Tireur" },
          { cle: "partieRemettante", label: "Partie remettante" },
        ],
      },
      {
        titre: "Informations financières",
        icone: "Banknote",
        champs: [
          { cle: "montantRemise", label: "Montant de la remise", format: "montant" },
          { cle: "encours", label: "Encours", format: "montant" },
          { cle: "typeFrais", label: "Type de frais" },
        ],
      },
      {
        titre: "Informations complémentaires",
        icone: "Info",
        champs: [
          { cle: "referencesTitresImportation", label: "Titres d'importation" },
        ],
      },
    ],
  },
  {
    code: "ERD",
    libelle: "Remise documentaire export",
    blocs: [
      {
        titre: "Détails de l'opération",
        icone: "FileText",
        champs: [
          { cle: "referenceOperation", label: "Référence" },
          { cle: "conditionsRemiseDocuments", label: "Conditions de remise des documents" },
          { cle: "dateEcheance", label: "Date d'échéance", format: "date" },
        ],
      },
      {
        titre: "Parties impliquées",
        icone: "Building2",
        champs: [
          { cle: "client", label: "Exportateur (Donneur d'ordre)", estClient: true },
          { cle: "tire", label: "Tiré (Importateur)" },
          { cle: "partieRemettante", label: "Partie présentatrice" },
        ],
      },
      {
        titre: "Informations financières",
        icone: "Banknote",
        champs: [
          { cle: "montantRemise", label: "Montant de la remise", format: "montant" },
          { cle: "encours", label: "Encours", format: "montant" },
          { cle: "typeFrais", label: "Type de frais" },
        ],
      },
      {
        titre: "Informations complémentaires",
        icone: "Info",
        champs: [
          { cle: "referencesCourrier", label: "Références de courrier", format: "tableau-courriers" },
        ],
      },
    ],
  },
  {
    code: "FIN",
    libelle: "Financement",
    blocs: [
      {
        titre: "Détails de l'opération",
        icone: "TrendingUp",
        champs: [
          { cle: "typeFinancement", label: "Type de financement" },
          { cle: "referenceFinancement", label: "Référence du financement" },
          { cle: "referenceDossierFinance", label: "Référence du dossier financé" },
        ],
      },
      {
        titre: "Parties impliquées",
        icone: "Building2",
        champs: [
          { cle: "client", label: "Bénéficiaire du financement", estClient: true },
          { cle: "partieDebitee", label: "Partie débitée" },
          { cle: "contrepartie", label: "Contrepartie (Fournisseur en import / Acheteur en export)" },
        ],
      },
      {
        titre: "Informations financières",
        icone: "Banknote",
        champs: [
          { cle: "montantFinancement", label: "Montant du financement", format: "montant" },
          { cle: "montantFinance", label: "Montant financé", format: "montant" },
          { cle: "encoursRestant", label: "Encours restant", format: "montant-emphase" },
          { cle: "montantTotalRembourser", label: "Montant total à rembourser", format: "montant" },
          { cle: "montantInterets", label: "Montant des intérêts", format: "montant" },
          { cle: "tauxInteret", label: "Taux d'intérêt" },
        ],
      },
      {
        titre: "Dates & échéances",
        icone: "Calendar",
        champs: [
          { cle: "dateMiseEnPlace", label: "Date de mise en place", format: "date" },
          { cle: "dateEcheance", label: "Date d'échéance", format: "date" },
        ],
      },
    ],
  },
];

export function getProduitSchema(code: ProduitCode): ProduitSchema | undefined {
  return PRODUIT_SCHEMAS.find((p) => p.code === code);
}
