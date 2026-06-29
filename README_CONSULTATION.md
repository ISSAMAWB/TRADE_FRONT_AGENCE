# Module Consultation — Trade Portal

## Objectif
Module de consultation en **lecture seule** des dossiers Trade Finance pour les agents agence.

## Fichiers concernés
- `/src/mocks/dossiers.json` — données mockées
- `/src/mocks/eventsByProduct.json` — mapping produit → événements
- `/src/domain/consultation.ts` — types TypeScript
- `/src/app/consultation/` — pages Next.js
- `/src/components/Shell.tsx` — navigation sidebar

## Routes
- `/consultation` → redirect vers `/consultation/dossiers`
- `/consultation/dossiers` — vue consolidée (filtres + tableau)
- `/consultation/dossiers/:id` — détail dossier (2 onglets)
- `/consultation/evenements` — fil d'événements
- `/consultation/alertes` — alertes & échéances

## Ajouter un dossier au mock

Éditer `/src/mocks/dossiers.json` et ajouter un objet respectant le schéma suivant :

```json
{
  "id": "ILC-2026-00150",
  "produit": "ILC",
  "client": {
    "nom": "NOUVEAU CLIENT SARL",
    "compte": "007 780 0000 150",
    "ice": "002150150000078",
    "code": "CLI-0150"
  },
  "montant": 450000,
  "devise": "EUR",
  "dateCreation": "2026-04-10",
  "dateEcheance": "2026-07-15",
  "banqueCorrespondante": "BNP Paribas",
  "paysOrigine": "France",
  "statut": "En cours",
  "refCTN": "CTN-ILC-0150-26",
  "codeAgence": "AGC-CASA-01",
  "agentCTN": { "nom": "Benali", "prenom": "Karim", "code": "KB01" },
  "datePriseEnCharge": "2026-04-11",
  "statutOperationnel": "Docs en attente",
  "controleDocumentaire": "Aucune réserve",
  "encours": { "utilise": 450000, "autorise": 1000000, "devise": "EUR" },
  "commission": 0.12,
  "tauxChange": 10.65,
  "derniereInteraction": "2026-06-22",
  "canalInteraction": "mail",
  "notes": [
    { "date": "2026-06-22", "auteur": "K. Benali", "texte": "Relance client envoyée" }
  ],
  "evenements": [
    { "id": "EVT-001", "date": "2026-04-10", "type": "Ouverture", "statut": "Validé", "montant": 450000 }
  ]
}
```

### Règles
- `produit` doit être l'une des valeurs : `ILC`, `IRD`, `ERD`, `ELC`, `FSA`
- `statut` doit être l'une des valeurs : `En cours`, `Expiré`, `Annulé`
- `devise` doit être l'une des valeurs : `USD`, `EUR`, `GBP`, `MAD`, `JPY`, `CHF`
- `canalInteraction` doit être l'une des valeurs : `mail`, `tel`, `email`
- `evenementCourant` doit appartenir à la liste du produit dans `/src/mocks/eventsByProduct.json`
- `dateCreation` et `dateEcheance` au format ISO `YYYY-MM-DD`
- Recharger la page pour voir le nouveau dossier (pas d'API backend)

## Mapping événements
Le fichier `/src/mocks/eventsByProduct.json` définit les événements possibles par produit. Le filtre **Événement** de la vue consolidée est **cascadant** : il reste désactivé tant qu'aucun produit n'est sélectionné, puis liste l'union des événements des produits cochés, groupés par produit.

Pour ajouter un événement à un produit, ajoutez-le dans le tableau correspondant du fichier JSON.

## Recherche client avancée
Dans la vue consolidée, le bouton loupe à droite du champ Client/Compte ouvre une modale multi-critères :
- Raison sociale / Nom
- N° de compte
- ICE
- Code client
- Registre de commerce (RC)
- Ville / Agence

Les critères sont combinés en ET. Cliquer sur une ligne du tableau de résultats renseigne le filtre Client et ferme la modale.

## Charte graphique
- Couleur primaire : `#E8722A`
- Fond carte : `#FFFFFF`
- Bordure carte : `#E5E7EB`
- Badges statut :
  - En cours : `#E6F1FB` / `#185FA5`
  - Expiré : `#FCEBEB` / `#A32D2D`
  - Annulé : `#F1EFE8` / `#5F5E5A`
- Tags produit : `#F1EFE8` / `#5F5E5A`
