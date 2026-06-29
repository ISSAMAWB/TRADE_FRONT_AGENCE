# TOM — Trade Operating Manager (MVP IRD)

MVP de la plateforme **TOM** orchestrant l'omnicanal IRD entre Agence, Bureau d'Ordre, Back Office IRD, TI+, OCR et GED.

## Architecture

- **workflow-driven** : moteur de transitions configurables (`src/domain/workflow.ts`), aucun statut codé en dur dans l'UI
- **event-driven** : un dossier TOM porte un `type_evenement` (`ENTREE_IRD`, `PAIEMENT`, `ACCEPTATION`, `ACCEPTATION_AVEC_AVAL`, `RETOUR_DOCUMENTS`, `ENVOI_EFFETS`)
- **OCR async** : `lancerOcr` simule un callback différé qui met à jour OCR, contrôle documentaire et crée la tâche `CONTROLER_OCR_AGENCE`
- **TI+ non maître** : le dossier TOM continue à vivre après création TI+ (`reference_tiplus` ajoutée, dossier visible)
- **Extensible multi-produits** : `produit: IRD | ILC | CBR`, workflows squelettes déjà déclarés

## Périmètre MVP

- Produit `IRD`, événement `ENTREE_IRD`
- Réception agence → Dépouillement → OCR async → Contrôle agence → Affectation BO → Contrôle BO → Envoi TI+ → Retour TI+
- Tracking physique multi-étapes
- Tâches workflow assignables

## Stack

Next.js 14 (app router) · React 18 · TypeScript · TailwindCSS · Zustand

## Démarrage

```bash
npm install
npm run dev
# http://localhost:3000
```

## Rôles (sélecteur en haut à droite)

- **Agent agence** : crée courrier, scanne, lance OCR, corrige, transmet BO
- **Responsable BO** : affecte les dossiers aux gestionnaires
- **Gestionnaire BO** : contrôle dossier, complète, envoie TI+

Les transitions disponibles dépendent du rôle courant — le moteur filtre automatiquement.

## Pages

- `/` — Tableau de bord KPI
- `/agence` — Écran dépouillement IRD (création courrier + dossier + OCR async)
- `/bo` — File Back Office (visible uniquement après OCR terminé)
- `/dossiers` — Liste tous dossiers TOM
- `/dossiers/[id]` — Détail dossier : aperçu, OCR, documents, tâches, tracking, historique
- `/tracking` — Vue tracking physique par statut

## Charte graphique

Orange `brand.500 = #F57C00` (alignée sur la capture fournie), typographie Inter, layout sidebar fixe.
