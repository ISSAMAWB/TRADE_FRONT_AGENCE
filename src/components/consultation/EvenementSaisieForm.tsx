"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Trash2, Plus, Paperclip, FileText, FileCheck, Eye } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import { genererAccuseReceptionPDF } from "@/lib/accuseReception";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import type { DossierTrade, DocumentAttacheAgence, EvenementTrade, MontantAvecDevise, TypeDocumentAttacheAgence, BlocageProvisionAgence } from "@/domain/consultation-detail";

function isMontantAvecDevise(v: unknown): v is MontantAvecDevise {
  return !!v && typeof v === "object" && "valeur" in (v as object) && "devise" in (v as object);
}

interface EvenementSaisieFormProps {
  dossier: DossierTrade;
  nature: string;
  evenement?: EvenementTrade;
  onCancel: () => void;
  onSaved: (reference: string) => void;
}

// Bloc « Information de la partie à notifier » masqué sur demande — repasser à true pour le réafficher
const AFFICHER_PARTIE_A_NOTIFIER = false;

export default function EvenementSaisieForm({ dossier, nature, evenement, onCancel, onSaved }: EvenementSaisieFormProps) {
  const ajouterEvenementDossier = useTomStore((s) => s.ajouterEvenementDossier);
  const upsertEvenementDossier = useTomStore((s) => s.upsertEvenementDossier);

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const encours = dossier.donnees["encours"];
  const encoursOk = isMontantAvecDevise(encours) ? encours : null;
  const montantRemise = dossier.donnees["montantRemise"];
  const montantRemiseOk = isMontantAvecDevise(montantRemise) ? montantRemise : null;
  const deviseDossier = encoursOk?.devise ?? montantRemiseOk?.devise ?? "";
  const conditionsRemiseAutre = String(dossier.donnees["conditionsRemiseDocuments"] ?? "").trim().toLowerCase() === "autre";
  // Lecture seule : événement soumis, ou retour des documents généré côté système (libellé porté par expiration)
  const lectureSeule = evenement?.statut === "SOUMIS" || (nature === "Retour des documents" && !!evenement?.expiration?.libelleEvenement);

  const s = evenement?.saisieAgence;
  const p = s?.paiement;
  const [identiteCompteSelectionne, setIdentiteCompteSelectionne] = useState<{ numeroCompte: string; raisonSociale: string } | null>(p?.identiteCompteDebite ?? null);

  const fichierInputRef = useRef<HTMLInputElement>(null);
  const isAcceptation = nature === "Acceptation & Aval de la traite";
  const typesDocuments: TypeDocumentAttacheAgence[] = isAcceptation
    ? ["Effet accepté", "Autre"]
    : ["Ordre de paiement", "Titre d'importation", "Autre"];
  const [typeDocument, setTypeDocument] = useState<TypeDocumentAttacheAgence | "">("");
  const [erreurDocumentsObligatoires, setErreurDocumentsObligatoires] = useState(false);
  const [documentsAttaches, setDocumentsAttaches] = useState<DocumentAttacheAgence[]>(s?.documentsAttaches ?? []);
  const DOCUMENTS_OBLIGATOIRES: TypeDocumentAttacheAgence[] = isAcceptation ? ["Effet accepté"] : ["Ordre de paiement"];
  const documentsObligatoiresManquants = DOCUMENTS_OBLIGATOIRES.filter(type =>
    !documentsAttaches.some(document => document.categorie === type && document.fichier?.size > 0)
  );
  const joindreDocuments = (files: FileList | null) => {
    if (!files?.length || !typeDocument) return;
    const documents = Array.from(files).map(fichier => ({
      id: crypto.randomUUID(),
      nom: fichier.name,
      taille: fichier.size,
      type: fichier.type,
      categorie: typeDocument,
      fichier,
    }));
    setDocumentsAttaches(current => [...current, ...documents]);
    if (fichierInputRef.current) fichierInputRef.current.value = "";
  };

  const DEFAUT_PAIEMENT_RECU_DE = "GLAXO DELICES DU SUD SARL";
  const DEFAUT_ADRESSE_PAIEMENT_RECU_DE = "42-44 ANGLE BLD RACHIDI ET\nABOU HAMED EL GHAZALI\n20100 CASABLANCA\nMAROC";

  const BANQUES = [
    { nom: "Société Générale Paris", pays: "France", ville: "Paris", bic: "SOGEFRPP", adresse: "29 Bd Haussmann, 75009 Paris, France" },
    { nom: "BNP Paribas", pays: "France", ville: "Paris", bic: "BNPAFRPP", adresse: "16 Bd des Italiens, 75009 Paris, France" },
    { nom: "Crédit Agricole", pays: "France", ville: "Montrouge", bic: "AGRIFRPP", adresse: "12 Pl. des États-Unis, 92120 Montrouge, France" },
    { nom: "Commerzbank AG", pays: "Allemagne", ville: "Frankfurt am Main", bic: "COBADEFF", adresse: "Kaiserstraße, 60311 Frankfurt am Main, Allemagne" },
    { nom: "Deutsche Bank", pays: "Allemagne", ville: "Frankfurt am Main", bic: "DEUTDEFF", adresse: "Taunusanlage 12, 60325 Frankfurt am Main, Allemagne" },
    { nom: "UniCredit", pays: "Italie", ville: "Milano", bic: "UNCRITMM", adresse: "Piazza Gae Aulenti 3, 20154 Milano, Italie" },
    { nom: "Banco Santander", pays: "Espagne", ville: "Madrid", bic: "BSCHESMM", adresse: "Av. de Cantabria, 28660 Boadilla del Monte, Madrid, Espagne" },
    { nom: "HSBC Bank plc", pays: "Royaume-Uni", ville: "London", bic: "HBUKGB4B", adresse: "8 Canada Square, London E14 5HQ, Royaume-Uni" },
    { nom: "Attijariwafa Bank", pays: "Maroc", ville: "Casablanca", bic: "BCMAMAMC", adresse: "2 Bd Moulay Youssef, 20100 Casablanca, Maroc" },
    { nom: "Banque Populaire", pays: "Maroc", ville: "Casablanca", bic: "BCPOMAMC", adresse: "101 Bd Mohamed Zerktouni, 20100 Casablanca, Maroc" },
    { nom: "BMCE Bank", pays: "Maroc", ville: "Casablanca", bic: "BMCEMAMC", adresse: "140 Av. Hassan II, 20070 Casablanca, Maroc" },
  ];

  const PAYS = [
    "Maroc", "France", "Espagne", "Italie", "Allemagne", "Belgique", "Suisse", "Pays-Bas", "Royaume-Uni",
    "Tunisie", "Algérie", "Mauritanie", "Sénégal", "Côte d'Ivoire", "Turquie", "Émirats arabes unis",
    "États-Unis", "Canada", "Chine", "Japon",
  ];

  const CLIENTS: { nom: string; compte: string }[] = [];
  const vus = new Set<string>();
  for (const d of dossiersDetail as DossierTrade[]) {
    const nom = d.clientInfo?.raisonSociale ?? d.client;
    const compte = d.clientInfo?.numeroCompte ?? "";
    if (nom && !vus.has(nom)) {
      vus.add(nom);
      CLIENTS.push({ nom, compte });
    }
  }

  const comptesDisponibles: { nom: string; compte: string; devise: string }[] = [];
  const comptesVus = new Set<string>();
  for (const d of dossiersDetail as DossierTrade[]) {
    const nom = (d.clientInfo?.raisonSociale ?? d.client ?? "").trim();
    const compte = (d.clientInfo?.numeroCompte ?? "").trim();
    const encoursD = d.donnees?.["encours"];
    const montantD = d.donnees?.["montantRemise"];
    const devise = (isMontantAvecDevise(encoursD) ? encoursD.devise : undefined)
      ?? (isMontantAvecDevise(montantD) ? montantD.devise : undefined)
      ?? "";
    const cle = JSON.stringify([nom, compte.replace(/\s/g, ""), devise]);
    if (nom && compte && !comptesVus.has(cle)) {
      comptesVus.add(cle);
      comptesDisponibles.push({ nom, compte, devise });
    }
  }
  const comptesDevises: { nom: string; compte: string; devise: string }[] = [
    { nom: "SOCIETE NOUVELLE HYDRAULIQUE-SNH", compte: "007 780 0000 104", devise: "EUR" },
    { nom: "STE VIVO ENERGY MAROC", compte: "007 780 0000 215", devise: "USD" },
    { nom: "STE IMPORT MAROC SARL", compte: "007 780 0000 377", devise: "EUR" },
    { nom: "AGRO EXPORT MAROC", compte: "007 780 0000 548", devise: "GBP" },
    { nom: "OCEANIC SHIPPING SARL", compte: "007 780 0000 062", devise: "USD" },
    { nom: "MEDITERRANEA TRADING CO", compte: "007 780 0000 141", devise: "TND" },
    { nom: "ATLAS TEXTILE SARL", compte: "007 780 0000 226", devise: "EUR" },
    { nom: "ROYAL CERAMICS SA", compte: "007 780 0000 368", devise: "CNY" },
    { nom: "TANGER MED FREIGHT", compte: "007 780 0000 401", devise: "USD" },
    { nom: "ATLANTIC SHIPPING LTD", compte: "007 780 0000 767", devise: "EUR" },
    { nom: "SAHARA LOGISTICS", compte: "007 780 0000 290", devise: "CNY" },
    { nom: "NORTH AFRICA IMPORT", compte: "007 780 0000 658", devise: "TND" },
  ];
  for (const c of comptesDevises) {
    const cle = JSON.stringify([c.nom, c.compte.replace(/\s/g, ""), c.devise]);
    if (!comptesVus.has(cle)) {
      comptesVus.add(cle);
      comptesDisponibles.push(c);
    }
  }
  const [popupCompte, setPopupCompte] = useState(false);
  const [rechCompteRaisonSociale, setRechCompteRaisonSociale] = useState("");
  const [rechCompteNumero, setRechCompteNumero] = useState("");
  const [rechCompteDevise, setRechCompteDevise] = useState("");
  const normaliserRaisonSociale = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const comptesFiltres = comptesDisponibles.filter(compte =>
    normaliserRaisonSociale(compte.nom).includes(normaliserRaisonSociale(rechCompteRaisonSociale)) &&
    compte.compte.replace(/\s/g, "").toLowerCase().includes(rechCompteNumero.replace(/\s/g, "").toLowerCase()) &&
    (rechCompteDevise === "" || compte.devise === rechCompteDevise)
  );
  const fermerPopupCompte = () => { setPopupCompte(false); setRechCompteRaisonSociale(""); setRechCompteNumero(""); setRechCompteDevise(""); };
  const choisirCompte = (compte: { nom: string; compte: string; devise: string }) => {
    setPaiementForm(form => ({ ...form, compteDebite: compte.compte }));
    setIdentiteCompteSelectionne({ numeroCompte: compte.compte.replace(/\s/g, ""), raisonSociale: compte.nom });
    fermerPopupCompte();
  };

  const [popupBanque, setPopupBanque] = useState<"banque" | "partie" | "payeur" | null>(null);
  const [popupTire, setPopupTire] = useState(false);
  const [rechTireNom, setRechTireNom] = useState("");
  const [rechTireCompte, setRechTireCompte] = useState("");
  const tiresFiltres = CLIENTS.filter(c =>
    c.nom.toLowerCase().includes(rechTireNom.toLowerCase()) &&
    c.compte.toLowerCase().includes(rechTireCompte.toLowerCase())
  );
  const fermerPopupTire = () => { setPopupTire(false); setRechTireNom(""); setRechTireCompte(""); };

  const [montantAVue, setMontantAVue] = useState("");

  // Choix de la ligne de paiement dont le montant à payer est saisissable
  const [lignesPaiementChoisies, setLignesPaiementChoisies] = useState({
    contreAcceptation: p != null && String(p.montantPaye ?? "") !== "",
    aVue: false,
  });

  const titresDossier = (dossier.donnees["referencesTitresImportation"] as string[] | undefined) ?? [];
  // Titres d'importation : page vide par défaut, alimentée uniquement par ajout utilisateur
  const [titresImputation, setTitresImputation] = useState<{ ref: string; montant: string }[]>([]);
  const [ongletPieces, setOngletPieces] = useState<"titres" | "documents">("titres");
  const [pageTitres, setPageTitres] = useState(1);
  const titresParPage = 10;
  const nombrePagesTitres = Math.max(1, Math.ceil(titresImputation.length / titresParPage));
  const pageTitresCourante = Math.min(pageTitres, nombrePagesTitres);
  const titresPage = titresImputation.slice((pageTitresCourante - 1) * titresParPage, pageTitresCourante * titresParPage);
  useEffect(() => {
    setPageTitres(page => Math.min(page, nombrePagesTitres));
  }, [nombrePagesTitres]);
  const supprimerTitre = (ref: string) => setTitresImputation(t => t.filter(x => x.ref !== ref));

  const TITRES_DISPONIBLES = Array.from(new Set([
    ...titresDossier,
    "TI-2025-09703", "TI-2025-09704", "TI-2025-09812", "TI-2025-09940", "TI-2026-00107",
  ])).map(ref => ({ ref, montantDisponible: 325000, devise: ref === "TI-2026-00107" ? "USD" : deviseDossier }));
  const [popupTitre, setPopupTitre] = useState(false);
  const [rechTitre, setRechTitre] = useState("");
  const [rechTitreDevise, setRechTitreDevise] = useState("");
  const titresFiltres = TITRES_DISPONIBLES.filter(t =>
    t.ref.toLowerCase().includes(rechTitre.toLowerCase()) &&
    t.devise.toLowerCase().includes(rechTitreDevise.toLowerCase()) &&
    !titresImputation.some(x => x.ref === t.ref)
  );
  const fermerPopupTitre = () => { setPopupTitre(false); setRechTitre(""); setRechTitreDevise(""); };
  // Contrepartie du montant à réserver exprimée en devise du dossier (conversion via le cours appliqué si la devise du titre diffère)
  const contrepartieTitreValeur = (t: { ref: string; montant: string }) => {
    const titre = TITRES_DISPONIBLES.find(x => x.ref === t.ref);
    const cours = Number(paiementForm.coursApplique) || 0;
    const montant = Number(t.montant) || 0;
    return titre && titre.devise !== deviseDossier && cours > 0 ? montant * cours : montant;
  };
  const contrepartieTitre = (t: { ref: string; montant: string }) => {
    if (!t.montant.trim()) return "—";
    return `${contrepartieTitreValeur(t).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${deviseDossier}`;
  };
  // Consultation du détail d'un titre d'importation ajouté (œil dans le tableau)
  const [titreConsulte, setTitreConsulte] = useState<{ ref: string; montant: string } | null>(null);
  const detailTitreConsulte = titreConsulte ? TITRES_DISPONIBLES.find(t => t.ref === titreConsulte.ref) ?? null : null;
  const ajouterTitre = (ref: string) => {
    setTitresImputation(t => [...t, { ref, montant: "" }]);
    setPageTitres(Math.ceil((titresImputation.length + 1) / titresParPage));
    fermerPopupTitre();
  };
  const [rechNom, setRechNom] = useState("");
  const [rechBic, setRechBic] = useState("");
  const [rechPays, setRechPays] = useState("");
  const banquesFiltrees = BANQUES.filter(b =>
    b.nom.toLowerCase().includes(rechNom.toLowerCase()) &&
    b.bic.toLowerCase().includes(rechBic.toLowerCase()) &&
    b.pays.toLowerCase().includes(rechPays.toLowerCase())
  );
  const fermerPopupBanque = () => { setPopupBanque(null); setRechNom(""); setRechBic(""); setRechPays(""); };

  const [popupPays, setPopupPays] = useState(false);
  const [rechPaysChoix, setRechPaysChoix] = useState("");
  const paysFiltres = PAYS.filter(p => p.toLowerCase().includes(rechPaysChoix.toLowerCase()));
  const fermerPopupPays = () => { setPopupPays(false); setRechPaysChoix(""); };
  const choisirPays = (pays: string) => {
    setPaiementForm(f => ({ ...f, paysBanqueBeneficiaire: pays }));
    fermerPopupPays();
  };
  const choisirBanque = (b: { nom: string; adresse: string; ville: string; pays: string }) => {
    if (popupBanque === "partie") {
      setPaiementForm(f => ({ ...f, partieAPayer: b.nom, adressePartieAPayer: b.adresse, villePartieAPayer: b.ville, paysPartieAPayer: b.pays }));
    } else if (popupBanque === "payeur") {
      setPaiementForm(f => ({ ...f, paiementRecuDe: b.nom, adressePaiementRecuDe: b.adresse, villePaiementRecuDe: b.ville, paysPaiementRecuDe: b.pays }));
    } else {
      setPaiementForm(f => ({ ...f, banqueBeneficiaire: b.nom, adresseBanqueBeneficiaire: b.adresse, villeBanqueBeneficiaire: b.ville, paysBanqueBeneficiaire: b.pays }));
    }
    fermerPopupBanque();
  };

  const [dateEvenement, setDateEvenement] = useState(s?.dateEvenement ?? aujourdhui);

  const [montant, setMontant] = useState(
    evenement?.montant
    ?? (nature === "Paiement" ? (encoursOk?.valeur ?? 0)
      : nature === "Acceptation & Aval de la traite" ? (montantRemiseOk?.valeur ?? 0)
      : 0)
  );
  const [datePaiement, setDatePaiement] = useState(s?.datePaiement ?? aujourdhui);
  const [effet, setEffet] = useState<"Avec aval" | "Sans aval">(s?.effet ?? "Avec aval");
  const echDossier = dossier.donnees["dateEcheance"];
  const [dateEcheanceEvt, setDateEcheanceEvt] = useState(
    s?.dateEcheance ?? (nature === "Acceptation & Aval de la traite" && echDossier ? String(echDossier).slice(0, 10) : "")
  );
  const [motif, setMotif] = useState(s?.motif ?? "Refus de paiement");
  const [destinataire, setDestinataire] = useState(s?.destinataire ?? dossier.client ?? "");

  // États pour Retour des documents
  const [typeDemande, setTypeDemande] = useState(s?.typeDemande ?? "Demande");
  const [initiateur, setInitiateur] = useState(s?.initiateur ?? "Agence C200");
  const [dateCreationRetour, setDateCreationRetour] = useState(s?.dateCreationRetour ?? aujourdhui);
  const [commentaireRetour, setCommentaireRetour] = useState(s?.commentaireRetour ?? "");
  const [retourEffectuePar, setRetourEffectuePar] = useState(s?.retourEffectuePar ?? "Préposé A");
  const [dateHeureEnvoi, setDateHeureEnvoi] = useState(s?.dateHeureEnvoi ?? "15/05/2026 09:15:00");
  const [numeroCourrierRetour, setNumeroCourrierRetour] = useState(s?.numeroCourrierRetour ?? "");
  const [documentsEnvoyes, setDocumentsEnvoyes] = useState(s?.documentsEnvoyes ?? false);
  const [ongletRetour, setOngletRetour] = useState<"detail" | "tracking">("detail");
  const [ongletPaiementTop, setOngletPaiementTop] = useState<"detail" | "tracking">("detail");
  const [ongletAcceptationTop, setOngletAcceptationTop] = useState<"detail" | "tracking">("detail");
  const [remiseEffectueePar, setRemiseEffectueePar] = useState(s?.remiseEffectueePar ?? "Préposé A");
  const [dateHeureRemise, setDateHeureRemise] = useState(s?.dateHeureRemise ?? "15/05/2026 09:15:00");
  const [numeroCourrierEnvoi, setNumeroCourrierEnvoi] = useState(s?.numeroCourrierEnvoi ?? "");
  const [documentsRemis, setDocumentsRemis] = useState(s?.documentsRemis ?? false);

  // États pour Demande de remise des documents
  const [nomPrenomPersonne, setNomPrenomPersonne] = useState(s?.nomPrenomPersonne ?? "");
  const [cinPersonne, setCinPersonne] = useState(s?.cinPersonne ?? "");
  const [instructionClient, setInstructionClient] = useState(s?.instructionClient ?? "");

  const [paiementForm, setPaiementForm] = useState({

    partieOriginePaiement: p?.partieOriginePaiement ?? "Client/Tiré",
    paiementRecuDe: p?.paiementRecuDe ?? DEFAUT_PAIEMENT_RECU_DE,
    adressePaiementRecuDe: p?.adressePaiementRecuDe ?? DEFAUT_ADRESSE_PAIEMENT_RECU_DE,
    villePaiementRecuDe: p?.villePaiementRecuDe ?? "Casablanca",
    paysPaiementRecuDe: p?.paysPaiementRecuDe ?? "Maroc",
    dateReception: p?.dateReception ?? aujourdhui,
    naturePartieAPayer: p?.naturePartieAPayer ?? "Banque étrangère",
    partieAPayer: p?.partieAPayer ?? BANQUES[0].nom,
    adressePartieAPayer: p?.adressePartieAPayer ?? BANQUES[0].adresse,
    villePartieAPayer: p?.villePartieAPayer ?? BANQUES[0].ville,
    paysPartieAPayer: p?.paysPartieAPayer ?? BANQUES[0].pays,

    modePaiement: p?.modePaiement ?? "Payer",
    referenceFinancement: p?.referenceFinancement ?? "",
    banqueBeneficiaire: p?.banqueBeneficiaire ?? "",
    adresseBanqueBeneficiaire: p?.adresseBanqueBeneficiaire ?? "",
    villeBanqueBeneficiaire: p?.villeBanqueBeneficiaire ?? "",
    paysBanqueBeneficiaire: p?.paysBanqueBeneficiaire ?? "",
    signatureConforme: p?.signatureConforme ?? false,
    titreImportationNonRequis: p?.titreImportationNonRequis ?? false,
    compteBeneficiaire: p?.compteBeneficiaire ?? "",

    coursApplique: p?.coursApplique != null ? String(p.coursApplique) : "10.55",
    montantPaye: p?.montantPaye != null ? String(p.montantPaye) : "",
    montantTotalPayer: p?.montantPaye != null ? String(p.montantPaye) : String(montantRemiseOk?.valeur ?? ""),


    dateValeur: p?.dateValeur ?? aujourdhui,
    compteDebite: p?.compteDebite ?? "",
    agenceDomiciliation: p?.agenceDomiciliation ?? "",
  });

  const ac = s?.acceptation;
  // Intervenants repris du dernier évènement de remise les portant (Réception, Modification, Ajustement…)
  const intervenantsRemise = useMemo(() => {
    const evenements = [...(dossier.evenements ?? [])].filter(e => e.receptionRemise?.intervenants?.length);
    const dernier = evenements.find(e => e.nature === "Réception de la remise") ?? evenements[evenements.length - 1];
    return dernier?.receptionRemise?.intervenants ?? [];
  }, [dossier]);
  // Partie à notifier reprise de la remise (partie remettante en priorité)
  const intervenantNotifie = useMemo(() => {
    return intervenantsRemise.find(i => i.role === "Partie remettante")
      ?? intervenantsRemise.find(i => i.role.includes("Tireur"))
      ?? intervenantsRemise.find(i => i.role.includes("Tiré"));
  }, [intervenantsRemise]);
  // Acceptant (client/tiré) repris de la remise
  const intervenantAcceptant = useMemo(() => {
    return intervenantsRemise.find(i => i.role.includes("Tiré") && !i.role.includes("Tireur"));
  }, [intervenantsRemise]);
  const naturePartieNotifiee = intervenantNotifie?.role === "Partie remettante" ? "Banque remettante"
    : intervenantNotifie?.role.includes("Tireur") ? "Tireur"
    : intervenantNotifie ? "Tiré" : "";
  const villeDe = (adresse?: string) => adresse?.split(",").pop()?.trim() || "";
  const villeFallback = dossier.clientInfo?.agenceRattachement?.replace(/^Agence\s+/i, "") || "";
  const [acceptationForm, setAcceptationForm] = useState({
    acceptant: ac?.acceptant ?? intervenantAcceptant?.nom ?? dossier.clientInfo?.raisonSociale ?? dossier.client ?? "",
    adresseAcceptant: ac?.adresseAcceptant ?? intervenantAcceptant?.adresse ?? dossier.clientInfo?.agenceRattachement ?? "",
    villeAcceptant: ac?.villeAcceptant ?? (villeDe(intervenantAcceptant?.adresse) || villeFallback),
    paysAcceptant: ac?.paysAcceptant ?? intervenantAcceptant?.pays ?? "Maroc",
    dateReception: ac?.dateReception ?? aujourdhui,
    referenceAval: ac?.referenceAval ?? "",
    naturePartieANotifier: ac?.naturePartieANotifier ?? naturePartieNotifiee ?? "Tiré",
    partieANotifier: ac?.partieANotifier ?? intervenantNotifie?.nom ?? dossier.clientInfo?.raisonSociale ?? dossier.client ?? "",
    adressePartieANotifier: ac?.adressePartieANotifier ?? intervenantNotifie?.adresse ?? dossier.clientInfo?.agenceRattachement ?? "",
    villePartieANotifier: ac?.villePartieANotifier ?? (villeDe(intervenantNotifie?.adresse) || villeFallback),
    paysPartieANotifier: ac?.paysPartieANotifier ?? intervenantNotifie?.pays ?? "Maroc",
    instructionEnvoi: ac?.instructionEnvoi ?? "",
    referenceNotification: ac?.referenceNotification ?? "",
    titreImportationNonRequis: ac?.titreImportationNonRequis ?? false,
  });
  const [ongletAcceptation, setOngletAcceptation] = useState<"titres" | "attaches">("titres");
  const setA = (k: keyof typeof acceptationForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setAcceptationForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  // Lignes reprises de l'évènement « Réception de la remise » (échéancier de la remise)
  // Évènement de remise source : « Réception de la remise » en priorité, sinon tout évènement portant des paiements (Modification, Ajustement…)
  const evenementReception = useMemo(() => {
    const evenements = dossier.evenements ?? [];
    return evenements.find(e => e.nature === "Réception de la remise" && (e.receptionRemise?.paiements?.length || e.receptionRemise?.intervenants?.length))
      ?? [...evenements].reverse().find(e => e.receptionRemise?.paiements?.length || e.receptionRemise?.intervenants?.length);
  }, [dossier]);
  const paiementsReception = evenementReception?.receptionRemise?.paiements ?? [];
  const dateReceptionRemise = evenementReception?.dateCreation ? String(evenementReception.dateCreation).slice(0, 10) : "";
  const [paiementsAAccepter, setPaiementsAAccepter] = useState<{ montant: string; periode: string; dateBase: string; maturite: string; accepte: boolean; avalise: boolean }[]>(
    ac?.paiementsAAccepter?.map((l, i) => ({
      montant: l.montant != null ? String(l.montant) : "",
      periode: l.periode || paiementsReception[i]?.typeTraite || "",
      dateBase: l.dateBase ?? "",
      maturite: l.maturite ?? "",
      accepte: l.accepte ?? true,
      avalise: l.avalise ?? false,
    })) ?? (paiementsReception.length > 0
      ? paiementsReception.map(p => ({
          montant: String(p.montant),
          periode: p.typeTraite ?? "",
          dateBase: (p.typeTraite ?? "").toLowerCase().includes("vue") ? "" : dateReceptionRemise,
          maturite: p.dateEcheance ? String(p.dateEcheance).slice(0, 10) : "",
          accepte: false,
          avalise: false,
        }))
      : [{ montant: montantRemiseOk ? String(montantRemiseOk.valeur) : "", periode: "", dateBase: "", maturite: s?.dateEcheance ?? (echDossier ? String(echDossier).slice(0, 10) : ""), accepte: true, avalise: false }])
  );
  const montantAccepteTotal = paiementsAAccepter.reduce((sum, l) => sum + (l.accepte ? Number(l.montant) || 0 : 0), 0);

  const majPaiementAAccepter = (i: number, patch: Partial<(typeof paiementsAAccepter)[number]>) =>
    setPaiementsAAccepter(l => l.map((x, j) => j === i ? { ...x, ...patch } : x));
  const compteDebiteNormalise = paiementForm.compteDebite.replace(/\s/g, "");
  const compteCorrespondantFictif = comptesDisponibles.find(compte => compte.compte.replace(/\s/g, "") === compteDebiteNormalise);
  const montantsCompteFictifs = compteDebiteNormalise && compteCorrespondantFictif
    ? { solde: 125000, disponible: 100000, devise: compteCorrespondantFictif.devise || "MAD" }
    : undefined;
  const comptesCorrespondants = comptesDisponibles.filter(compte => compte.compte.replace(/\s/g, "") === compteDebiteNormalise);
  const clientCompteDebite = !compteDebiteNormalise ? undefined
    : identiteCompteSelectionne?.numeroCompte === compteDebiteNormalise ? identiteCompteSelectionne
    : compteDebiteNormalise === dossier.clientInfo?.numeroCompte?.replace(/\s/g, "") ? dossier.clientInfo
    : comptesCorrespondants.length === 1 ? { raisonSociale: comptesCorrespondants[0].nom }
    : undefined;
  const setP = (k: keyof typeof paiementForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setPaiementForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const montantRequis = nature === "Paiement" || nature === "Acceptation & Aval de la traite";
  const montantAPayerTotal = (Number(paiementForm.montantTotalPayer) || 0) + (Number(montantAVue) || 0);
  const totalContrepartieTitres = titresImputation.reduce((s, t) => s + contrepartieTitreValeur(t), 0);
  const montantRestantRegler = montantRemiseOk ? montantRemiseOk.valeur - montantAPayerTotal : null;
  const coursApplique = Number(paiementForm.coursApplique);
  const contrevaleurBrute = montantAPayerTotal * coursApplique;
  const contrevaleurDirhams = (paiementForm.montantTotalPayer.trim() !== "" || montantAVue.trim() !== "")
    && paiementForm.coursApplique.trim() !== ""
    && Number.isFinite(montantAPayerTotal) && montantAPayerTotal >= 0
    && Number.isFinite(coursApplique) && coursApplique > 0
    && Number.isFinite(contrevaleurBrute)
    ? Number(contrevaleurBrute.toFixed(2))
    : undefined;
  const memeDeviseComptePaiement = montantsCompteFictifs?.devise === deviseDossier;
  const montantABloquer = montantsCompteFictifs && deviseDossier
    ? (memeDeviseComptePaiement ? montantAPayerTotal : contrevaleurDirhams)
    : undefined;
  const deviseMontantABloquer = memeDeviseComptePaiement ? deviseDossier : "MAD";
  const [blocageProvision, setBlocageProvision] = useState<BlocageProvisionAgence | null>(p?.blocageProvision ?? null);
  const peutBloquerProvision = Boolean(montantsCompteFictifs) && Number.isFinite(montantAPayerTotal) && montantAPayerTotal > 0
    && montantABloquer != null && Number.isFinite(montantABloquer) && montantABloquer > 0;
  const blocageActif = peutBloquerProvision && blocageProvision?.numeroCompte === compteDebiteNormalise && blocageProvision.montant === montantABloquer && blocageProvision.devise === deviseMontantABloquer
    ? blocageProvision
    : null;
  useEffect(() => {
    setBlocageProvision(current => current && (!peutBloquerProvision || current.numeroCompte !== compteDebiteNormalise || current.montant !== montantABloquer || current.devise !== deviseMontantABloquer) ? null : current);
  }, [compteDebiteNormalise, montantABloquer, deviseMontantABloquer, peutBloquerProvision]);


  const [erreurSoumission, setErreurSoumission] = useState<string[]>([]);

  function enregistrer(nouveauStatut: "ENREGISTRE" | "SOUMIS") {
    if (nouveauStatut === "SOUMIS") {
      const manquants: string[] = [];
      if (nature === "Paiement") {
        if (!paiementForm.compteDebite.trim()) manquants.push("Compte à débiter");
        if (!(montantAPayerTotal > 0)) manquants.push("Montant à payer");
        if (!paiementForm.signatureConforme) manquants.push("Signature conforme");
        if (documentsObligatoiresManquants.length > 0) {
          setErreurDocumentsObligatoires(true);
          setOngletPieces("documents");
          manquants.push(`Documents obligatoires : ${documentsObligatoiresManquants.join(", ")}`);
        }
      }
      if (isAcceptation) {
        if (!acceptationForm.acceptant.trim()) manquants.push("Acceptant (Client/tiré)");
        if (!acceptationForm.dateReception.trim()) manquants.push("Date de réception");
        if (!(montantAccepteTotal > 0)) manquants.push("Montant accepté");
        if (documentsObligatoiresManquants.length > 0) {
          setErreurDocumentsObligatoires(true);
          manquants.push(`Documents obligatoires : ${documentsObligatoiresManquants.join(", ")}`);
        }
      }
      if (montantRequis && (isAcceptation ? montantAccepteTotal : montant) <= 0) manquants.push("Montant");
      if (nature === "Retour des documents" && !motif) manquants.push("Motif");
      if (manquants.length > 0) { setErreurSoumission(manquants); return; }
    }
    setErreurSoumission([]);
    const saisie = {
      nature,
      montant: montantRequis ? (isAcceptation ? montantAccepteTotal : montant) : null,
      devise: deviseDossier,
      saisieAgence: {
        dateEvenement,
        documentsAttaches: nature === "Paiement" || isAcceptation || nature === "Retour des documents" || nature === "Demande de remise des documents" ? documentsAttaches : s?.documentsAttaches,

        datePaiement: nature === "Paiement" ? datePaiement : undefined,
        effet: nature === "Acceptation & Aval de la traite" ? effet : undefined,
        dateEcheance: nature === "Acceptation & Aval de la traite" && dateEcheanceEvt ? dateEcheanceEvt : undefined,
        motif: nature === "Retour des documents" ? motif : undefined,
        destinataire: nature === "Demande de remise des documents" ? destinataire : undefined,
        typeDemande: nature === "Retour des documents" ? typeDemande : undefined,
        nomPrenomPersonne: nature === "Demande de remise des documents" ? nomPrenomPersonne : undefined,
        cinPersonne: nature === "Demande de remise des documents" ? cinPersonne : undefined,
        instructionClient: nature === "Demande de remise des documents" ? instructionClient : undefined,
        initiateur: nature === "Retour des documents" ? initiateur : undefined,
        dateCreationRetour: nature === "Retour des documents" ? dateCreationRetour : undefined,
        commentaireRetour: nature === "Retour des documents" ? commentaireRetour : undefined,
        retourEffectuePar: nature === "Retour des documents" ? retourEffectuePar : undefined,
        dateHeureEnvoi: nature === "Retour des documents" ? dateHeureEnvoi : undefined,
        numeroCourrierRetour: nature === "Retour des documents" ? numeroCourrierRetour : undefined,
        documentsEnvoyes: nature === "Retour des documents" ? documentsEnvoyes : undefined,
        remiseEffectueePar: nature === "Paiement" || isAcceptation ? remiseEffectueePar : undefined,
        dateHeureRemise: nature === "Paiement" || isAcceptation ? dateHeureRemise : undefined,
        numeroCourrierEnvoi: nature === "Paiement" || isAcceptation ? numeroCourrierEnvoi : undefined,
        documentsRemis: nature === "Paiement" || isAcceptation ? documentsRemis : undefined,
        paiement: nature === "Paiement" ? {

          partieOriginePaiement: paiementForm.partieOriginePaiement || undefined,
          paiementRecuDe: paiementForm.paiementRecuDe || undefined,
          adressePaiementRecuDe: paiementForm.adressePaiementRecuDe || undefined,
          villePaiementRecuDe: paiementForm.villePaiementRecuDe || undefined,
          paysPaiementRecuDe: paiementForm.paysPaiementRecuDe || undefined,
          dateReception: paiementForm.dateReception || undefined,
          naturePartieAPayer: paiementForm.naturePartieAPayer || undefined,
          partieAPayer: paiementForm.partieAPayer || undefined,
          adressePartieAPayer: paiementForm.adressePartieAPayer || undefined,
          villePartieAPayer: paiementForm.villePartieAPayer || undefined,
          paysPartieAPayer: paiementForm.paysPartieAPayer || undefined,

          modePaiement: paiementForm.modePaiement || undefined,
          referenceFinancement: paiementForm.referenceFinancement || undefined,
          banqueBeneficiaire: paiementForm.banqueBeneficiaire || undefined,
          adresseBanqueBeneficiaire: paiementForm.adresseBanqueBeneficiaire || undefined,
          villeBanqueBeneficiaire: paiementForm.villeBanqueBeneficiaire || undefined,
          paysBanqueBeneficiaire: paiementForm.paysBanqueBeneficiaire || undefined,
          signatureConforme: paiementForm.signatureConforme,
          titreImportationNonRequis: paiementForm.titreImportationNonRequis,
          compteBeneficiaire: paiementForm.compteBeneficiaire || undefined,
          coursApplique: paiementForm.coursApplique ? Number(paiementForm.coursApplique) : undefined,
          montantPaye: montantAPayerTotal || undefined,
          contrevaleurDirhams,

          montantRestant: montantRestantRegler ?? undefined,
          dateValeur: paiementForm.dateValeur || undefined,
          compteDebite: paiementForm.compteDebite || undefined,
          identiteCompteDebite: clientCompteDebite ? { numeroCompte: compteDebiteNormalise, raisonSociale: clientCompteDebite.raisonSociale } : undefined,
          blocageProvision: blocageActif ?? undefined,
          agenceDomiciliation: paiementForm.agenceDomiciliation || undefined,
        } : undefined,
        acceptation: isAcceptation ? {
          acceptant: acceptationForm.acceptant || undefined,
          adresseAcceptant: acceptationForm.adresseAcceptant || undefined,
          villeAcceptant: acceptationForm.villeAcceptant || undefined,
          paysAcceptant: acceptationForm.paysAcceptant || undefined,
          dateReception: acceptationForm.dateReception || undefined,
          referenceAval: acceptationForm.referenceAval || undefined,
          montantAccepte: montantAccepteTotal || undefined,
          naturePartieANotifier: acceptationForm.naturePartieANotifier || undefined,
          partieANotifier: acceptationForm.partieANotifier || undefined,
          adressePartieANotifier: acceptationForm.adressePartieANotifier || undefined,
          villePartieANotifier: acceptationForm.villePartieANotifier || undefined,
          paysPartieANotifier: acceptationForm.paysPartieANotifier || undefined,
          titreImportationNonRequis: acceptationForm.titreImportationNonRequis,
          instructionEnvoi: acceptationForm.instructionEnvoi || undefined,
          referenceNotification: acceptationForm.referenceNotification || undefined,
          paiementsAAccepter: paiementsAAccepter.map(l => ({
            montant: Number(l.montant) || undefined,
            periode: l.periode || undefined,
            dateBase: l.dateBase || undefined,
            maturite: l.maturite || undefined,
            accepte: l.accepte,
            avalise: l.avalise,
          })),
        } : undefined,
      },
    };
    if (evenement) {
      upsertEvenementDossier(dossier.reference, { ...evenement, ...saisie, reference: evenement.reference, statut: nouveauStatut, dateCreation: evenement.dateCreation });
      onSaved(evenement.reference);
    } else {
      const ev = ajouterEvenementDossier(dossier.reference, saisie, nouveauStatut);
      onSaved(ev.reference);
    }
  }

  const [popupAccuse, setPopupAccuse] = useState(false);
  const [popupSignature, setPopupSignature] = useState(false);

  const renderDocumentsAttaches = () => (
    <>
      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div className="rounded-lg border border-[#e5e8ec] px-4 py-3 w-full sm:w-auto sm:min-w-[260px]">
          <div className="text-label mb-2">Documents à joindre</div>
          <div className="flex flex-col gap-2">
            {typesDocuments.map(type => {
              const joint = documentsAttaches.some(document => document.categorie === type && document.fichier?.size > 0);
              return (
                <label key={type} className="flex items-center gap-2 text-sm text-[#0f172a] cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    checked={joint}
                    onChange={() => {
                      if (!joint) {
                        setTypeDocument(type);
                        setTimeout(() => fichierInputRef.current?.click(), 0);
                      }
                    }}
                  />
                  {type} {DOCUMENTS_OBLIGATOIRES.includes(type) && <span className="text-red-500">*</span>}
                </label>
              );
            })}
          </div>
          <div className="text-xs text-[#94a3b8] mt-2"><span className="text-red-500">*</span> obligatoire</div>
        </div>
        <button type="button" className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" disabled={!typeDocument} onClick={() => fichierInputRef.current?.click()}>
          <Paperclip size={15} /> Joindre des documents
        </button>
        <input ref={fichierInputRef} type="file" multiple disabled={!typeDocument} className="hidden" aria-label="Joindre des documents" onChange={e => joindreDocuments(e.target.files)} />
      </div>
      <p className="text-xs text-[#64748b] mb-3">
        {isAcceptation
          ? "La traite acceptée est obligatoire pour enregistrer l'acceptation."
          : "L'ordre de paiement et le titre d'importation sont obligatoires pour enregistrer le paiement."}
      </p>
      {erreurDocumentsObligatoires && documentsObligatoiresManquants.length > 0 && (
        <p role="alert" className="text-sm text-red-600 mb-3">Veuillez joindre un fichier non vide pour chaque document obligatoire manquant : {documentsObligatoiresManquants.join(", ")}.</p>
      )}
      <p className="text-xs text-[#64748b] mb-3">Les fichiers sont conservés pendant la session uniquement, sans envoi au serveur.</p>
      {documentsAttaches.length === 0 ? (
        <div className="py-4 text-center text-sm text-[#94a3b8]">Aucun document attaché.</div>
      ) : (
        <ul className="divide-y divide-[#e5e8ec]">
          {documentsAttaches.map(document => (
            <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={16} className="text-[#64748b] shrink-0" />
                <span className="text-sm text-[#0f172a] break-all">{document.nom}</span>
                <span className="text-xs text-[#64748b] whitespace-nowrap">{(document.taille / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko</span>
              </div>
              <div className="flex items-center gap-3">
                <select className="input w-full sm:w-auto" aria-label={`Type du document ${document.nom}`} value={document.categorie ?? ""}
                  onChange={event => {
                    const categorie = (event.target.value || undefined) as TypeDocumentAttacheAgence | undefined;
                    setDocumentsAttaches(current => current.map(item => item.id === document.id ? { ...item, categorie } : item));
                  }}>
                  <option value="">Sélectionner un type</option>
                  {typesDocuments.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <button type="button" className="text-[#94a3b8] hover:text-[#dc2626] transition shrink-0" title={`Retirer ${document.nom}`} aria-label={`Retirer ${document.nom}`} onClick={() => setDocumentsAttaches(current => current.filter(item => item.id !== document.id))}>
                  <Trash2 size={14} />
                </button>
              </div>
              {document.categorie === "Autre" && (
                <input
                  type="text"
                  className="input w-full mt-1"
                  aria-label={`Description du document ${document.nom}`}
                  placeholder="Description du document"
                  value={document.description ?? ""}
                  onChange={event => setDocumentsAttaches(current => current.map(item => item.id === document.id ? { ...item, description: event.target.value } : item))}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );

  const fmtDateDoc = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("fr-FR") : "");
  const fmtHeureDoc = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";

  function editerAccuse() {
    setPopupAccuse(false);
    const maintenant = new Date();
    const bicBeneficiaire = BANQUES.find(b => b.nom === paiementForm.banqueBeneficiaire)?.bic ?? "";
    void genererAccuseReceptionPDF({
      referenceBordereau: evenement ? `AR-${evenement.reference}` : "",
      referenceRDI: dossier.reference,
      dateRemise: fmtDateDoc(dossier.dateMiseAJour),
      referenceCorrespondant: String(dossier.donnees["referenceCorrespondant"] ?? ""),
      referenceOperation: String(dossier.donnees["referenceOperation"] ?? ""),
      nomPayeur: clientCompteDebite?.raisonSociale ?? dossier.clientInfo?.raisonSociale ?? dossier.client ?? "",
      numeroCompteDebit: paiementForm.compteDebite,
      identifiantClient: dossier.clientInfo?.codeClient ?? "",
      typeOrdre: "Ordre de paiement",
      montantPaiement: montantAPayerTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      devisePaiement: deviseDossier,
      dateOrdre: fmtDateDoc(paiementForm.dateReception),
      dateValeur: fmtDateDoc(paiementForm.dateValeur),
      nomBeneficiaire: String(dossier.donnees["tireur"] ?? ""),
      nomBanqueBeneficiaire: paiementForm.banqueBeneficiaire,
      bicBeneficiaire,
      referenceOrdrePaiement: evenement?.reference ?? "",
      ordrePaiementRecu: documentsAttaches.some(d => d.categorie === "Ordre de paiement"),
      titreImportationRecu: documentsAttaches.some(d => d.categorie === "Titre d'importation"),
      autresDocuments: documentsAttaches.filter(d => d.categorie === "Autre").map(d => d.nom),
      nombrePieces: documentsAttaches.length,
      observations: "",
      referenceEvenement: evenement?.reference ?? "",
      nomPrepose: "",
      matriculePrepose: "",
      dateReception: fmtDateDoc(evenement?.dateCreation),
      heureReception: fmtHeureDoc(evenement?.dateCreation),
      dateGeneration: maintenant.toLocaleDateString("fr-FR"),
      heureGeneration: maintenant.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      nomBanque: "Attijariwafa Bank",
      nomAgence: dossier.clientInfo?.agenceRattachement ?? "",
      codeAgence: "",
      adresseAgence: "",
    });
  }

  return (
    <div>
      {evenement?.statut === "SOUMIS" && (
        <div className="flex justify-end mb-3">
          <button type="button" className="h-9 inline-flex items-center gap-2 px-4 rounded-md bg-orange-600 border border-orange-600 text-white text-sm hover:bg-orange-700" onClick={() => setPopupAccuse(true)}>
            <FileCheck size={15} /> Accusé de réception
          </button>
        </div>
      )}
      <div className="bg-[#FAEEDA] text-[#854F0B] text-xs rounded-lg p-2 mb-4">
        {evenement
          ? "L'événement reste dans l'onglet En cours. L'encours et le dossier seront mis à jour après validation."
          : "L'événement sera créé dans l'onglet En cours : statut « Enregistré » via le bouton Enregistrer, « Soumis » via Soumettre."}
      </div>

      {/* Onglets pour Paiement et Retour des documents */}
      {nature === "Paiement" && (
        <div className="flex flex-wrap border-b border-gray-200 mb-4">
          {[
            { id: "detail", label: "Détail de l'événement" },
            { id: "tracking", label: "Tracking de l'envoi des documents" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOngletPaiementTop(t.id as "detail" | "tracking")}
              className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                ongletPaiementTop === t.id
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {isAcceptation && (
        <div className="flex flex-wrap border-b border-gray-200 mb-4">
          {[
            { id: "detail", label: "Détail de l'événement" },
            { id: "tracking", label: "Tracking de l'envoi des documents" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOngletAcceptationTop(t.id as "detail" | "tracking")}
              className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                ongletAcceptationTop === t.id
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {nature === "Retour des documents" && (
        <div className="flex flex-wrap border-b border-gray-200 mb-4">
          {[
            { id: "detail", label: "Détail de l'événement" },
            { id: "tracking", label: "Tracking de l'envoi des documents" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setOngletRetour(t.id as "detail" | "tracking")}
              className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                ongletRetour === t.id
                  ? "border-orange-600 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <fieldset disabled={lectureSeule} className="contents champs-saisie">
      {!(nature === "Paiement" && ongletPaiementTop === "tracking") && !(nature === "Retour des documents" && ongletRetour === "tracking") && !(isAcceptation && ongletAcceptationTop === "tracking") && (
      <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
          <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
          <div className="text-sm font-semibold text-[#0f172a]">Informations générales</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-5">
        <div>
          <label className="text-label">Référence de la remise</label>
          <input className="input w-full bg-gray-100 text-gray-500" value={dossier.reference} readOnly />
        </div>
        <div>
          <label className="text-label">Date de création de la remise</label>
          <input
            className="input w-full bg-gray-100 text-gray-500"
            value={dossier.evenements[0]?.dateCreation ? new Date(dossier.evenements[0].dateCreation).toLocaleDateString("fr-FR") : "—"}
            readOnly
          />
        </div>
        <div>
          <label className="text-label">Conditions de remise des documents</label>
          <input className="input w-full bg-gray-100 text-gray-500" value={String(dossier.donnees["conditionsRemiseDocuments"] ?? "—")} readOnly />
        </div>

        {(nature === "Réception de la remise" || nature === "Paiement" || isAcceptation) && (
          <div>
            <span className="text-label invisible block" aria-hidden="true">Paiement multiple</span>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-60 h-10">
              <input type="checkbox" disabled checked={evenementReception?.receptionRemise?.paiementMultiple ?? false} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Paiement multiple</span>
            </label>
          </div>
        )}

        </div>
      </div>
      )}

      {/* ===== Blocs Retour des documents ===== */}
      {nature === "Retour des documents" && ongletRetour === "detail" && (
        <div className="space-y-6 mb-4">
          {/* Bloc 2: Détail du retour des documents */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détail du retour des documents</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Initiateur</label>
                <input className="input w-full bg-gray-100 text-gray-500" value={initiateur} readOnly />
              </div>
              <div>
                <label className="text-label">Date de création</label>
                <input className="input w-full bg-gray-100 text-gray-500" value={dateCreationRetour} readOnly />
              </div>
              <div>
                <label className="text-label">Motif <span className="text-red-500">*</span></label>
                <select className="input w-full" value={motif} onChange={(e) => setMotif(e.target.value)} disabled={lectureSeule}>
                  <option>Client non présenté</option>
                  <option>Documents en souffrance</option>
                  <option>Erreur d'affectation</option>
                  <option>Remise non payée</option>
                  <option>Autre</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-label">Commentaire</label>
                <textarea className="input w-full" rows={3} value={commentaireRetour} onChange={(e) => setCommentaireRetour(e.target.value)} placeholder="Commentaire..." disabled={lectureSeule} />
              </div>
            </div>
          </div>

          {/* Bloc 3: Documents attachés */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Documents attachés</div>
            </div>
            {!lectureSeule && (
              <div
                className="mt-4 border-2 border-dashed border-[#e5e8ec] rounded-md p-6 text-center hover:border-orange-400 hover:bg-orange-50/40 transition cursor-pointer"
                onClick={() => document.getElementById("file-upload-retour")?.click()}
              >
                <input
                  id="file-upload-retour"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach(file => {
                      setDocumentsAttaches(current => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          nom: file.name,
                          taille: file.size,
                          type: file.type,
                          fichier: file,
                          categorie: undefined,
                          description: undefined,
                        },
                      ]);
                    });
                    e.target.value = "";
                  }}
                />
                <Plus className="mx-auto text-[#94a3b8] mb-2" size={22} />
                <div className="text-sm text-[#64748b]">Cliquez pour ajouter des documents</div>
                <div className="text-xs text-[#94a3b8] mt-1">PDF, images (JPG, PNG…)</div>
              </div>
            )}
            {documentsAttaches.length === 0 ? (
              <div className="py-4 text-center text-sm text-[#94a3b8]">Aucun document attaché.</div>
            ) : (
              <ul className="divide-y divide-[#e5e8ec] mt-4">
                {documentsAttaches.map(document => (
                  <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={16} className="text-[#64748b] shrink-0" />
                      <span className="text-sm text-[#0f172a] break-all">{document.nom}</span>
                      <span className="text-xs text-[#64748b] whitespace-nowrap">{(document.taille / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko</span>
                    </div>
                    {!lectureSeule && (
                      <button type="button" className="text-[#94a3b8] hover:text-[#dc2626] transition shrink-0" title={`Retirer ${document.nom}`} aria-label={`Retirer ${document.nom}`} onClick={() => setDocumentsAttaches(current => current.filter(item => item.id !== document.id))}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ===== Blocs Demande de remise des documents ===== */}
      {nature === "Demande de remise des documents" && (
        <div className="space-y-6 mb-4">
          {/* Détails de la personne autorisée à récupérer les documents */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails de la personne autorisée à récupérer les documents</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Nom &amp; Prénom</label>
                <input className="input w-full" value={nomPrenomPersonne} onChange={(e) => setNomPrenomPersonne(e.target.value)} disabled={lectureSeule} placeholder="Nom et prénom de la personne autorisée" />
              </div>
              <div>
                <label className="text-label">N° CIN</label>
                <input className="input w-full" value={cinPersonne} onChange={(e) => setCinPersonne(e.target.value)} disabled={lectureSeule} placeholder="Numéro de CIN" />
              </div>
              <div className="md:col-span-2">
                <label className="text-label">Instruction du client</label>
                <textarea className="input w-full" rows={4} value={instructionClient} onChange={(e) => setInstructionClient(e.target.value)} disabled={lectureSeule} placeholder="Instruction du client..." />
              </div>
            </div>
          </div>

          {/* Documents attachés */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Documents attachés</div>
            </div>
            {!lectureSeule && (
              <div
                className="mt-4 border-2 border-dashed border-[#e5e8ec] rounded-md p-6 text-center hover:border-orange-400 hover:bg-orange-50/40 transition cursor-pointer"
                onClick={() => document.getElementById("file-upload-demande")?.click()}
              >
                <input
                  id="file-upload-demande"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,image/*"
                  onChange={e => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach(file => {
                      setDocumentsAttaches(current => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          nom: file.name,
                          taille: file.size,
                          type: file.type,
                          fichier: file,
                          categorie: undefined,
                          description: undefined,
                        },
                      ]);
                    });
                    e.target.value = "";
                  }}
                />
                <Plus className="mx-auto text-[#94a3b8] mb-2" size={22} />
                <div className="text-sm text-[#64748b]">Cliquez pour ajouter des documents</div>
                <div className="text-xs text-[#94a3b8] mt-1">PDF, images (JPG, PNG…)</div>
              </div>
            )}
            {documentsAttaches.length === 0 ? (
              <div className="py-4 text-center text-sm text-[#94a3b8]">Aucun document attaché.</div>
            ) : (
              <ul className="divide-y divide-[#e5e8ec] mt-4">
                {documentsAttaches.map(document => (
                  <li key={document.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={16} className="text-[#64748b] shrink-0" />
                      <span className="text-sm text-[#0f172a] break-all">{document.nom}</span>
                      <span className="text-xs text-[#64748b] whitespace-nowrap">{(document.taille / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Ko</span>
                    </div>
                    {!lectureSeule && (
                      <button type="button" className="text-[#94a3b8] hover:text-[#dc2626] transition shrink-0" title={`Retirer ${document.nom}`} aria-label={`Retirer ${document.nom}`} onClick={() => setDocumentsAttaches(current => current.filter(item => item.id !== document.id))}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ===== Tracking de l'envoi des documents — Retour des documents ===== */}
      {nature === "Retour des documents" && ongletRetour === "tracking" && (
        <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
            <div className="w-1 h-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
            <div className="text-sm font-semibold text-[#0f172a]">Tracking de l'envoi des documents</div>
          </div>
          <div className="relative pl-4">
            {/* Point 1 - Documents reçus (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Documents reçus</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminé</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Reçu au niveau</p>
                      <p className="text-sm font-semibold text-gray-900">CTN-DEVISES</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date de création</p>
                      <p className="text-sm font-semibold text-gray-900">05/05/2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 2 - Documents transmis à l'agence (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Documents transmis à l'agence</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminé</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Emetteur</p>
                      <p className="text-sm font-semibold text-gray-900">Bureau d'ordre - CTN-Devises</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date et heure d'envoi</p>
                      <p className="text-sm font-semibold text-gray-900">06/05/2026 09:15:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Numéro du courrier</p>
                      <p className="text-sm font-semibold text-gray-900">COUR-2026-0405</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 3 - Accusé de réception des documents (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Accusé de réception des documents</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Reçu</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Réception effectuée par</p>
                      <p className="text-sm font-semibold text-gray-900">Préposé A</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Statut</p>
                      <p className="text-sm font-semibold text-gray-900">Reçu</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date et heure de réception</p>
                      <p className="text-sm font-semibold text-gray-900">07/05/2026 14:30:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Observation</p>
                      <p className="text-sm font-semibold text-gray-900">Documents reçus en agence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 4 - Retour des documents (éditable) */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Retour des documents</h3>
                    {(evenement?.statut === "SOUMIS" || evenement?.statut === "VALIDE") && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminé</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-label">Retour effectué par</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={retourEffectuePar} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Date et heure d'envoi</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={dateHeureEnvoi} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Numéro du courrier</label>
                      <input className="input w-full" value={numeroCourrierRetour} onChange={(e) => setNumeroCourrierRetour(e.target.value)} disabled={lectureSeule} placeholder="COUR-YYYY-XXXX" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="documents-envoyes" checked={documentsEnvoyes} onChange={(e) => setDocumentsEnvoyes(e.target.checked)} disabled={lectureSeule} className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                      <label htmlFor="documents-envoyes" className="text-sm text-gray-700 cursor-pointer">Documents envoyés</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Blocs Acceptation & Aval de la traite — mêmes blocs que la page de consultation ===== */}
      {isAcceptation && ongletAcceptationTop === "detail" && (
        <div className="space-y-6 mb-4">

          {/* Détails de l'acceptation et aval */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails de l'acceptation et aval</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Acceptant (Client/tiré)</label>
                <input className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.acceptant} readOnly />
                <textarea
                  className="input w-full mt-1.5 bg-gray-100 text-gray-500"
                  rows={3}
                  value={acceptationForm.adresseAcceptant}
                  placeholder="Adresse"
                  aria-label="Adresse de l'acceptant"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.villeAcceptant} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.paysAcceptant} readOnly />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-label">Date de réception <span className="text-red-500">*</span></label>
                <input type="date" className="input w-full" value={acceptationForm.dateReception} onChange={setA("dateReception")} />
              </div>
              <div>
                <label className="text-label">Référence de l'aval</label>
                <input className="input w-full" value={acceptationForm.referenceAval} onChange={setA("referenceAval")} />
              </div>
            </div>
          </div>

          {/* Information de la partie à notifier — masqué : remettre AFFICHER_PARTIE_A_NOTIFIER à true pour réafficher */}
          {AFFICHER_PARTIE_A_NOTIFIER && (
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Information de la partie à notifier</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Nature de la partie à notifier</label>
                <select className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.naturePartieANotifier} disabled>
                  <option>Tiré</option>
                  <option>Tireur</option>
                  <option>Banque remettante</option>
                  <option>Autre</option>
                </select>
                <input
                  type="text"
                  className="input w-full mt-2 bg-gray-100 text-gray-500"
                  value={acceptationForm.partieANotifier}
                  placeholder="Nom de la partie à notifier"
                  aria-label="Partie à notifier"
                  readOnly
                />
                <textarea
                  className="input w-full mt-2 bg-gray-100 text-gray-500"
                  rows={3}
                  value={acceptationForm.adressePartieANotifier}
                  placeholder="Adresse"
                  aria-label="Adresse de la partie à notifier"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.villePartieANotifier} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={acceptationForm.paysPartieANotifier} readOnly />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-label">Référence</label>
                <input className="input w-full" value={acceptationForm.referenceNotification} onChange={setA("referenceNotification")} />
              </div>
              <div>
                <label className="text-label">Instruction d'envoi</label>
                <textarea className="input w-full" rows={3} value={acceptationForm.instructionEnvoi} onChange={setA("instructionEnvoi")} />
              </div>
            </div>
          </div>
          )}

          {/* Paiements à accepter */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Paiements à accepter</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e5e8ec]">
                    <th className="text-center py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider w-10">N°</th>
                    <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant <span className="text-red-500">*</span></th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Condition de remise des documents</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de base</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Maturité</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Statut</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Accepté</th>
                    <th className="text-center py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Avalisé</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsAAccepter.map((ligne, i) => (
                    <tr key={i} className="border-b border-[#e5e8ec]">
                      <td className="py-2 px-3 text-center text-[#64748b] font-mono text-xs">{i + 1}</td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input w-full min-w-0 text-right font-mono tabular-nums bg-gray-100 text-gray-500"
                            value={ligne.montant}
                            aria-label={`Montant du paiement à accepter ligne ${i + 1}`}
                            readOnly
                          />
                          <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input className="input w-full bg-gray-100 text-gray-500" value={ligne.periode.toLowerCase().includes("acceptation") ? "Document contre acceptation" : ligne.periode} aria-label={`Condition de remise ligne ${i + 1}`} readOnly />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className={`input w-full bg-gray-100 text-gray-500 ${ligne.periode.toLowerCase().includes("vue") ? "text-center text-[#64748b]" : ""}`}
                          value={ligne.periode.toLowerCase().includes("vue") ? "—" : (ligne.dateBase ? new Date(`${ligne.dateBase}T00:00:00`).toLocaleDateString("fr-FR") : "")}
                          aria-label={`Date de base ligne ${i + 1}`}
                          readOnly
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className={`input w-full bg-gray-100 text-gray-500 ${ligne.periode.toLowerCase().includes("vue") ? "text-center text-[#64748b]" : ""}`}
                          value={ligne.periode.toLowerCase().includes("vue") ? "—" : (ligne.maturite ? new Date(`${ligne.maturite}T00:00:00`).toLocaleDateString("fr-FR") : "")}
                          aria-label={`Maturité ligne ${i + 1}`}
                          readOnly
                        />
                      </td>
                      <td className="py-2 px-3 text-[#64748b] text-xs">En attente de paiement</td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          checked={ligne.accepte}
                          disabled={ligne.periode.toLowerCase().includes("vue")}
                          onChange={(e) => majPaiementAAccepter(i, e.target.checked ? { accepte: true } : { accepte: false, avalise: false })}
                          aria-label={`Paiement accepté ligne ${i + 1}`}
                          title={ligne.periode.toLowerCase().includes("vue") ? "Non acceptable : paiement à vue" : "Accepter le paiement"}
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          checked={ligne.avalise}
                          disabled={!ligne.periode.toLowerCase().includes("aval")}
                          onChange={(e) => majPaiementAAccepter(i, e.target.checked ? { avalise: true, accepte: true } : { avalise: false })}
                          aria-label={`Paiement avalisé ligne ${i + 1}`}
                          title={ligne.periode.toLowerCase().includes("aval") ? "Avaliser le paiement" : "Non avalisable : réservé aux paiements pour aval"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#e5e8ec] text-sm font-semibold text-[#0f172a]">
              <span>Montant total accepté :</span>
              <span className="font-mono tabular-nums text-[#e8632b]">
                {montantAccepteTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}
              </span>
            </div>
          </div>

          {/* Titres d'importation / Documents attachés */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div role="tablist" aria-label="Pièces de l'acceptation" className="flex flex-wrap border-b border-gray-200 mb-5">
              {([
                { id: "titres", label: "Titres d'importation" },
                { id: "attaches", label: "Documents attachés" },
              ] as const).map(tab => (
                <button key={tab.id} type="button" role="tab" id={`onglet-acceptation-${tab.id}`} aria-selected={ongletAcceptation === tab.id}
                  onClick={() => setOngletAcceptation(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${ongletAcceptation === tab.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id="panneau-acceptation-titres" aria-labelledby="onglet-acceptation-titres" hidden={ongletAcceptation !== "titres"}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed" checked={acceptationForm.titreImportationNonRequis}
                    onChange={event => {
                      const checked = event.target.checked;
                      setAcceptationForm(f => ({ ...f, titreImportationNonRequis: checked }));
                      if (checked) setTitresImputation([]);
                    }} />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Titre d'importation non requis</span>
                </label>
                <button
                  type="button"
                  className="h-7 w-7 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#64748b] disabled:hover:border-[#e5e8ec]"
                  disabled={acceptationForm.titreImportationNonRequis}
                  onClick={() => setPopupTitre(true)}
                  title={acceptationForm.titreImportationNonRequis ? "Titre d'importation non requis" : "Ajouter un titre d'importation"}
                  aria-label="Ajouter un titre d'importation"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#e5e8ec]">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-[#e5e8ec]">
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à réserver</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Contrepartie en devise du dossier</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">N° Enregistrement</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant disponible</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de validité</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titresImputation.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 px-3 text-center text-sm text-[#94a3b8]">Aucun titre d'importation.</td>
                      </tr>
                    )}
                    {titresPage.map(t => (
                      <tr key={t.ref} className="border-b border-[#e5e8ec]">
                        <td className="py-2 px-3 text-left">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="input w-full min-w-0 text-left font-mono tabular-nums"
                              value={t.montant}
                              onChange={(e) => setTitresImputation(ts => ts.map(x => x.ref === t.ref ? { ...x, montant: e.target.value } : x))}
                            />
                            <span className="shrink-0 text-xs font-mono text-[#64748b]">{TITRES_DISPONIBLES.find(x => x.ref === t.ref)?.devise ?? deviseDossier}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">{contrepartieTitre(t)}</td>
                        <td className="py-2 px-3 text-left font-mono text-[11px] text-[#64748b]">{t.ref}</td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">
                          {montantRemiseOk
                            ? `${(montantRemiseOk.valeur / Math.max(1, titresImputation.length)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}`
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-left text-[#64748b]">—</td>
                        <td className="py-2 px-3 text-left">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-[#94a3b8] hover:text-[#e8632b] transition"
                              onClick={() => setTitreConsulte(t)}
                              title={`Consulter ${t.ref}`}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="text-[#94a3b8] hover:text-[#dc2626] transition"
                              onClick={() => supprimerTitre(t.ref)}
                              title={`Supprimer ${t.ref}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-semibold text-[#0f172a]">
                <span>Nombre Total : {titresImputation.length}</span>
                <span>
                  Montant total réservé : {totalContrepartieTitres.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}
                </span>
                <span>
                  Montant restant à réserver : <span className={montantAccepteTotal - totalContrepartieTitres > 0 ? "text-red-600" : undefined}>{(montantAccepteTotal - totalContrepartieTitres).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="text-xs text-[#64748b]">{titresImputation.length} titre(s) - Page {pageTitresCourante} sur {nombrePagesTitres}</p>
                <nav aria-label="Pagination des titres d'importation" className="flex flex-wrap items-center gap-1">
                  <button type="button" disabled={pageTitresCourante === 1} onClick={() => setPageTitres(pageTitresCourante - 1)} className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed">Précédent</button>
                  {Array.from({ length: nombrePagesTitres }, (_, index) => index + 1).map(page => (
                    <button key={page} type="button" aria-label={`Page ${page}`} aria-current={page === pageTitresCourante ? "page" : undefined} onClick={() => setPageTitres(page)} className={`px-3 py-1 text-xs border rounded ${page === pageTitresCourante ? "bg-orange-600 border-orange-600 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button type="button" disabled={pageTitresCourante === nombrePagesTitres} onClick={() => setPageTitres(pageTitresCourante + 1)} className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed">Suivant</button>
                </nav>
              </div>
            </div>

            <div role="tabpanel" id="panneau-acceptation-attaches" aria-labelledby="onglet-acceptation-attaches" hidden={ongletAcceptation !== "attaches"}>
              {renderDocumentsAttaches()}
            </div>
          </div>
        </div>
      )}

      {/* ===== Blocs Paiement — mêmes blocs que la page de consultation ===== */}
      {nature === "Paiement" && ongletPaiementTop === "detail" && (
        <div className="space-y-6 mb-4">

          {/* Origine du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Origine du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Partie à l'origine du paiement</label>
                <select className="input w-full bg-gray-100 text-gray-500" value={paiementForm.partieOriginePaiement} onChange={setP("partieOriginePaiement")} disabled>
                  <option>Client/Tiré</option>
                  <option>Tireur</option>
                  <option>Banque remettante</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-label" htmlFor="compte-a-debiter-recu">Compte à débiter <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input id="compte-a-debiter-recu" className="input w-full pr-9" value={paiementForm.compteDebite} onChange={setP("compteDebite")} />
                  <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition" onClick={() => setPopupCompte(true)} title="Rechercher un compte" aria-label="Rechercher un compte">
                    <Search size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-label">Date de réception</label>
                <input type="date" className="input w-full" value={paiementForm.dateReception} onChange={setP("dateReception")} />
              </div>
              <div>
                <span className="text-label invisible block" aria-hidden="true">Paiement reçu de</span>
                <div className="relative">
                  <input type="text" className="input w-full pr-9 bg-gray-100 text-gray-500" value={paiementForm.paiementRecuDe} readOnly placeholder="Nom du payeur" />
                  <button
                    type="button"
                    disabled
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] transition disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={() => paiementForm.partieOriginePaiement === "Banque remettante" ? setPopupBanque("payeur") : setPopupTire(true)}
                    title={paiementForm.partieOriginePaiement === "Banque remettante" ? "Rechercher la banque remettante" : "Rechercher le tiré"}
                  >
                    <Search size={15} />
                  </button>
                </div>
                <textarea
                  className="input w-full mt-1.5 bg-gray-100 text-gray-500"
                  rows={4}
                  value={paiementForm.adressePaiementRecuDe}
                  readOnly
                  placeholder="Adresse"
                  aria-label="Adresse du payeur"
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={paiementForm.villePaiementRecuDe} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100 text-gray-500" value={paiementForm.paysPaiementRecuDe} readOnly />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="w-full rounded-lg border border-[#e5e8ec]">
                  <table className="w-full table-fixed text-xs" aria-label="Informations du compte à débiter">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-[#e5e8ec]">
                        <th scope="col" className="w-[30%] px-3 py-2 text-left font-semibold text-[#64748b]">Intitulé compte</th>
                        <th scope="col" className="w-[20%] px-3 py-2 text-left font-semibold text-[#64748b]">Solde</th>
                        <th scope="col" className="w-[20%] px-3 py-2 text-left font-semibold text-[#64748b]">Disponible</th>
                        <th scope="col" className="w-[20%] px-3 py-2 text-left font-semibold text-[#64748b]">Identité</th>
                        <th scope="col" className="w-[10%] px-3 py-2 text-center font-semibold text-[#64748b]">Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top bg-gray-50/70">
                        <td className="px-3 py-3 text-[#475569] break-words">
                          <div className="font-mono break-all">{paiementForm.compteDebite.trim() || "—"}</div>
                          {clientCompteDebite && <div className="mt-1">{clientCompteDebite.raisonSociale}</div>}
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums text-[#475569]">
                          {montantsCompteFictifs ? `${montantsCompteFictifs.solde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${montantsCompteFictifs.devise}` : "—"}
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums text-[#475569]">
                          {montantsCompteFictifs ? `${montantsCompteFictifs.disponible.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${montantsCompteFictifs.devise}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-[#475569] break-words">{clientCompteDebite?.raisonSociale || "—"}</td>
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            className="text-[#94a3b8] hover:text-[#e8632b] transition disabled:opacity-40 disabled:cursor-not-allowed"
                            onClick={() => setPopupSignature(true)}
                            title="Consulter la signature du client"
                            aria-label="Consulter la signature du client"
                            disabled={!clientCompteDebite}
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.signatureConforme} onChange={setP("signatureConforme")} />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Signature conforme <span className="text-red-500">*</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* Liste des paiements */}
          {conditionsRemiseAutre && (
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Liste des paiements disponibles</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#e5e8ec]">
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">N.Paiement</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Type de paiement</th>
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de paiement</th>
                    <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant réclamé</th>
                    <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Encours</th>
                    <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à payer <span className="text-red-500">*</span></th>
                    <th className="text-center py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider w-10">Choix</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#e5e8ec]">
                    <td className="py-2 px-3 text-[#0f172a]">1</td>
                    <td className="py-2 px-3 text-[#64748b]">Contre acceptation</td>
                    <td className="py-2 px-3 text-[#64748b]">{datePaiement ? new Date(datePaiement).toLocaleDateString("fr-FR") : "—"}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0f172a]">
                      {montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0f172a]">
                      {encoursOk
                        ? `${Math.max(0, encoursOk.valeur - (Number(paiementForm.montantPaye) || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${encoursOk.devise}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className={"input w-full min-w-0 text-right font-mono tabular-nums" + (lignesPaiementChoisies.contreAcceptation ? "" : " bg-gray-100 text-gray-500")}
                          aria-label={`Montant à payer ligne 1 ${deviseDossier}`}
                          value={paiementForm.montantPaye}
                          onChange={setP("montantPaye")}
                          disabled={!lignesPaiementChoisies.contreAcceptation}
                        />
                        <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#e8632b] disabled:opacity-40 disabled:cursor-not-allowed"
                        checked={lignesPaiementChoisies.contreAcceptation}
                        disabled={lignesPaiementChoisies.aVue}
                        onChange={(e) => {
                          const coche = e.target.checked;
                          setLignesPaiementChoisies(l => ({ ...l, contreAcceptation: coche }));
                          setPaiementForm(f => ({ ...f, montantPaye: coche ? String(montantRemiseOk?.valeur ?? "") : "" }));
                        }}
                        title="Choisir cette ligne pour saisir le montant à payer"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[#e5e8ec]">
                    <td className="py-2 px-3 text-[#0f172a]">2</td>
                    <td className="py-2 px-3 text-[#64748b]">A vue</td>
                    <td className="py-2 px-3 text-[#94a3b8]">—</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0f172a]">
                      {montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}` : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-[#0f172a]">
                      {encoursOk
                        ? `${Math.max(0, encoursOk.valeur - (Number(montantAVue) || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${encoursOk.devise}`
                        : "—"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className={"input w-full min-w-0 text-right font-mono tabular-nums" + (lignesPaiementChoisies.aVue ? "" : " bg-gray-100 text-gray-500")}
                          aria-label={`Montant à payer ligne 2 ${deviseDossier}`}
                          value={montantAVue}
                          onChange={(e) => setMontantAVue(e.target.value)}
                          disabled={!lignesPaiementChoisies.aVue}
                        />
                        <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-[#e8632b] disabled:opacity-40 disabled:cursor-not-allowed"
                        checked={lignesPaiementChoisies.aVue}
                        disabled={lignesPaiementChoisies.contreAcceptation}
                        onChange={(e) => {
                          const coche = e.target.checked;
                          setLignesPaiementChoisies(l => ({ ...l, aVue: coche }));
                          setMontantAVue(coche ? String(montantRemiseOk?.valeur ?? "") : "");
                        }}
                        title="Choisir cette ligne pour saisir le montant à payer"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#e5e8ec] text-sm font-semibold text-[#0f172a]">
              <span>Montant total à payer :</span>
              <span className="font-mono tabular-nums text-[#e8632b]">
                {Number.isFinite(montantAPayerTotal) && (paiementForm.montantTotalPayer.trim() !== "" || montantAVue.trim() !== "")
                  ? `${montantAPayerTotal.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${deviseDossier}`
                  : `0,00 ${deviseDossier}`}
              </span>
            </div>
          </div>
          )}

          {/* Détails du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant des documents présentés</label>
                  <input className="input w-full bg-gray-100 text-gray-500" value={montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR")} ${montantRemiseOk.devise}` : "—"} readOnly />
                </div>
                <div>
                  <label className="text-label">Montant restant à régler</label>
                  <input type="text" className="input w-full bg-gray-100 text-gray-500" value={montantRestantRegler != null ? `${montantRestantRegler.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${deviseDossier}` : ""} readOnly />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant total à payer</label>
                  {conditionsRemiseAutre ? (
                    <input type="text" className="input w-full bg-gray-100 text-gray-500" value={Number.isFinite(montantAPayerTotal) && (paiementForm.montantTotalPayer.trim() !== "" || montantAVue.trim() !== "") ? `${montantAPayerTotal.toLocaleString("fr-FR")} ${deviseDossier}`.trim() : ""} readOnly />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="number" className="input w-full min-w-0 text-right font-mono tabular-nums" value={paiementForm.montantTotalPayer} onChange={setP("montantTotalPayer")} aria-label={`Montant total à payer ${deviseDossier}`} />
                      <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-label">Contrevaleur estimative en dirhams</label>
                  <input type="number" step="0.01" className="input w-full bg-gray-100 text-gray-500" value={contrevaleurDirhams != null ? contrevaleurDirhams.toFixed(2) : ""} readOnly />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Référence de l'aval</label>
                  <input className="input w-full bg-gray-100 text-gray-500" value={paiementForm.compteDebite} readOnly />
                </div>
              </div>
            </div>
          </div>

          {/* Bénéficiaire du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Bénéficiaire du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5 items-start">
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Nature de la partie à payer</label>
                  <select className="input w-full bg-gray-100 text-gray-500" value={paiementForm.naturePartieAPayer} onChange={setP("naturePartieAPayer")} disabled>
                    <option>Banque étrangère</option>
                    <option>Tireur</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input w-full bg-gray-100 text-gray-500 ${paiementForm.naturePartieAPayer === "Banque étrangère" ? "pr-9" : ""}`}
                      value={paiementForm.partieAPayer}
                      onChange={setP("partieAPayer")}
                      placeholder="Nom de la partie à payer"
                      aria-label="Partie à payer"
                      readOnly
                    />
                    {paiementForm.naturePartieAPayer === "Banque étrangère" && (
                      <button
                        type="button"
                        disabled
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={() => setPopupBanque("partie")}
                        title="Rechercher une banque"
                      >
                        <Search size={15} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="input w-full mt-2 bg-gray-100 text-gray-500"
                    rows={4}
                    value={paiementForm.adressePartieAPayer}
                    readOnly
                    placeholder="Adresse"
                    aria-label="Adresse de la partie à payer"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-label">Ville</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={paiementForm.villePartieAPayer} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Pays</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={paiementForm.paysPartieAPayer} readOnly />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Numéro de compte du bénéficiaire</label>
                  <input className="input w-full" value={paiementForm.compteBeneficiaire} onChange={setP("compteBeneficiaire")} />
                </div>
                <div>
                  <label className="text-label">Banque du bénéficiaire</label>
                  <div className="relative">
                    <input className="input w-full pr-9" value={paiementForm.banqueBeneficiaire} onChange={(e) => {
                      const v = e.target.value;
                      setPaiementForm(f => v.trim() === ""
                        ? { ...f, banqueBeneficiaire: "", adresseBanqueBeneficiaire: "", villeBanqueBeneficiaire: "", paysBanqueBeneficiaire: "" }
                        : { ...f, banqueBeneficiaire: v });
                    }} />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                      onClick={() => setPopupBanque("banque")}
                      title="Rechercher une banque"
                    >
                      <Search size={15} />
                    </button>
                  </div>
                  <textarea
                    className="input w-full mt-2"
                    rows={4}
                    value={paiementForm.adresseBanqueBeneficiaire}
                    onChange={setP("adresseBanqueBeneficiaire")}
                    placeholder="Adresse"
                    aria-label="Adresse de la banque du bénéficiaire"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-label">Ville</label>
                      <input className="input w-full" value={paiementForm.villeBanqueBeneficiaire} onChange={setP("villeBanqueBeneficiaire")} />
                    </div>
                    <div>
                      <label className="text-label">Pays</label>
                      <div className="relative">
                        <input className="input w-full pr-9" value={paiementForm.paysBanqueBeneficiaire} onChange={setP("paysBanqueBeneficiaire")} />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                          onClick={() => setPopupPays(true)}
                          title="Rechercher un pays"
                          aria-label="Rechercher un pays"
                        >
                          <Search size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Mode de paiement <span className="text-red-500">*</span></label>
                  <select className="input w-full" value={paiementForm.modePaiement} onChange={setP("modePaiement")}>
                    <option>Payer</option>
                    <option>Paiement avec financement</option>
                    <option>Offre de financement</option>
                  </select>
                </div>
                {paiementForm.modePaiement === "Paiement avec financement" && (
                  <div>
                    <label className="text-label">Référence du financement</label>
                    <input className="input w-full" value={paiementForm.referenceFinancement} onChange={setP("referenceFinancement")} placeholder="Référence de financement" disabled={lectureSeule} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Titres d'importation */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div role="tablist" aria-label="Pièces du paiement" className="flex flex-wrap border-b border-gray-200 mb-5">
              {([
                { id: "titres", label: "Titres d'importation" },
                { id: "documents", label: "Documents attachés" },
              ] as const).map(tab => (
                <button key={tab.id} type="button" role="tab" id={`onglet-pieces-${tab.id}`} aria-controls={`panneau-pieces-${tab.id}`} aria-selected={ongletPieces === tab.id} tabIndex={ongletPieces === tab.id ? 0 : -1}
                  onClick={() => setOngletPieces(tab.id)}
                  onKeyDown={event => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const suivant = event.key === "Home" ? "titres" : event.key === "End" ? "documents" : ongletPieces === "titres" ? "documents" : "titres";
                    setOngletPieces(suivant);
                    document.getElementById(`onglet-pieces-${suivant}`)?.focus();
                  }}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${ongletPieces === tab.id ? "border-orange-600 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" id="panneau-pieces-titres" aria-labelledby="onglet-pieces-titres" hidden={ongletPieces !== "titres"}>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" disabled className="w-4 h-4 rounded border-gray-300 text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed" checked={paiementForm.titreImportationNonRequis}
                    onChange={event => {
                      const checked = event.target.checked;
                      setPaiementForm(f => ({ ...f, titreImportationNonRequis: checked }));
                      if (checked) setTitresImputation([]);
                    }} />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Titre d'importation non requis</span>
                </label>
                <button
                  type="button"
                  className="h-7 w-7 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#64748b] disabled:hover:border-[#e5e8ec]"
                  disabled={paiementForm.titreImportationNonRequis}
                  onClick={() => setPopupTitre(true)}
                  title={paiementForm.titreImportationNonRequis ? "Titre d'importation non requis" : "Ajouter un titre d'importation"}
                  aria-label="Ajouter un titre d'importation"
                >
                  <Plus size={15} />
                </button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#e5e8ec]">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-[#e5e8ec]">
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à réserver</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Contrepartie en devise du dossier</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">N° Enregistrement</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant disponible</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de validité</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titresImputation.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-4 px-3 text-center text-sm text-[#94a3b8]">Aucun titre d'importation.</td>
                      </tr>
                    )}
                    {titresPage.map(t => (
                      <tr key={t.ref} className="border-b border-[#e5e8ec]">
                        <td className="py-2 px-3 text-left">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="input w-full min-w-0 text-left font-mono tabular-nums"
                              value={t.montant}
                              onChange={(e) => setTitresImputation(ts => ts.map(x => x.ref === t.ref ? { ...x, montant: e.target.value } : x))}
                            />
                            <span className="shrink-0 text-xs font-mono text-[#64748b]">{TITRES_DISPONIBLES.find(x => x.ref === t.ref)?.devise ?? deviseDossier}</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">{contrepartieTitre(t)}</td>
                        <td className="py-2 px-3 text-left font-mono text-[11px] text-[#64748b]">{t.ref}</td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">
                          {montantRemiseOk
                            ? `${(montantRemiseOk.valeur / Math.max(1, titresImputation.length)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}`
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-left text-[#64748b]">—</td>
                        <td className="py-2 px-3 text-left">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="text-[#94a3b8] hover:text-[#e8632b] transition"
                              onClick={() => setTitreConsulte(t)}
                              title={`Consulter ${t.ref}`}
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              type="button"
                              className="text-[#94a3b8] hover:text-[#dc2626] transition"
                              onClick={() => supprimerTitre(t.ref)}
                              title={`Supprimer ${t.ref}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-semibold text-[#0f172a]">
                <span>Nombre Total : {titresImputation.length}</span>
                <span>
                  Montant total réservé : {totalContrepartieTitres.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}
                </span>
                <span>
                  Montant restant à réserver : <span className={montantAPayerTotal - totalContrepartieTitres > 0 ? "text-red-600" : undefined}>{(montantAPayerTotal - totalContrepartieTitres).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                <p className="text-xs text-[#64748b]">{titresImputation.length} titre(s) - Page {pageTitresCourante} sur {nombrePagesTitres}</p>
                <nav aria-label="Pagination des titres d'importation" className="flex flex-wrap items-center gap-1">
                  <button type="button" disabled={pageTitresCourante === 1} onClick={() => setPageTitres(pageTitresCourante - 1)} className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed">Précédent</button>
                  {Array.from({ length: nombrePagesTitres }, (_, index) => index + 1).map(page => (
                    <button key={page} type="button" aria-label={`Page ${page}`} aria-current={page === pageTitresCourante ? "page" : undefined} onClick={() => setPageTitres(page)} className={`px-3 py-1 text-xs border rounded ${page === pageTitresCourante ? "bg-orange-600 border-orange-600 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>{page}</button>
                  ))}
                  <button type="button" disabled={pageTitresCourante === nombrePagesTitres} onClick={() => setPageTitres(pageTitresCourante + 1)} className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded disabled:opacity-40 disabled:cursor-not-allowed">Suivant</button>
                </nav>
              </div>
            </div>

            <div role="tabpanel" id="panneau-pieces-documents" aria-labelledby="onglet-pieces-documents" hidden={ongletPieces !== "documents"}>
              {renderDocumentsAttaches()}
            </div>
          </div>
        </div>
      )}

      {/* ===== Tracking de l'envoi des documents — Paiement / Acceptation ===== */}
      {((nature === "Paiement" && ongletPaiementTop === "tracking") || (isAcceptation && ongletAcceptationTop === "tracking")) && (
        <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
            <div className="w-1 h-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
            <div className="text-sm font-semibold text-[#0f172a]">Tracking de l'envoi des documents</div>
          </div>
          <div className="relative pl-4">
            {/* Point 1 - Documents reçus (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Documents reçus</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminé</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Reçu au niveau</p>
                      <p className="text-sm font-semibold text-gray-900">CTN-DEVISES</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date de création</p>
                      <p className="text-sm font-semibold text-gray-900">05/05/2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 2 - Documents transmis à l'agence (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Documents transmis à l'agence</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Terminé</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Emetteur</p>
                      <p className="text-sm font-semibold text-gray-900">Bureau d'ordre - CTN-Devises</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date et heure d'envoi</p>
                      <p className="text-sm font-semibold text-gray-900">06/05/2026 09:15:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Numéro du courrier</p>
                      <p className="text-sm font-semibold text-gray-900">COUR-2026-0405</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 3 - Accusé de réception des documents (grisé) */}
            <div className="relative pb-8">
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Accusé de réception des documents</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Reçu</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Réception effectuée par</p>
                      <p className="text-sm font-semibold text-gray-900">Préposé A</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Statut</p>
                      <p className="text-sm font-semibold text-gray-900">Reçu</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Date et heure de réception</p>
                      <p className="text-sm font-semibold text-gray-900">07/05/2026 14:30:00</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Observation</p>
                      <p className="text-sm font-semibold text-gray-900">Documents reçus en agence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Point 4 - Remise des documents au client (éditable) */}
            <div className="relative">
              <div className="flex items-start gap-4">
                <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
                <div className="flex-1 -mt-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900">Remise des documents au client</h3>
                    {(evenement?.statut === "SOUMIS" || evenement?.statut === "VALIDE") && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Remis</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-label">Remise effectuée par</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={remiseEffectueePar} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Date et heure de la remise</label>
                      <input className="input w-full bg-gray-100 text-gray-500" value={dateHeureRemise} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Numéro du courrier</label>
                      <input className="input w-full" value={numeroCourrierEnvoi} onChange={(e) => setNumeroCourrierEnvoi(e.target.value)} disabled={lectureSeule} placeholder="COUR-YYYY-XXXX" />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="documents-remis" checked={documentsRemis} onChange={(e) => setDocumentsRemis(e.target.checked)} disabled={lectureSeule} className="w-4 h-4 rounded border-gray-300 text-teal-600" />
                      <label htmlFor="documents-remis" className="text-sm text-gray-700 cursor-pointer">Documents remis</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </fieldset>

      {erreurSoumission.length > 0 && (
        <p role="alert" className="text-sm text-red-600 mb-3">
          Champs obligatoires manquants : {erreurSoumission.join(" · ")}.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>{lectureSeule ? "Fermer" : "Annuler"}</button>
        {!lectureSeule && (
          <>
            <button className="btn-primary" onClick={() => enregistrer("ENREGISTRE")}>
              Enregistrer
            </button>
            <button className="btn-primary" onClick={() => enregistrer("SOUMIS")}>
              Soumettre
            </button>
          </>
        )}
      </div>

      {/* Popup signature du client */}
      {popupSignature && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setPopupSignature(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Signature du client</div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={() => setPopupSignature(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <div className="text-label">Signataire</div>
                <div className="text-sm font-semibold text-[#0f172a]">{clientCompteDebite?.raisonSociale ?? dossier.client}</div>
              </div>
              <div>
                <div className="text-label">Signature</div>
                <div className="mt-2 rounded-lg border border-[#e5e8ec] bg-[#fafbfc] h-28 flex items-center justify-center">
                  <span className="text-3xl italic font-semibold text-[#334155]" style={{ fontFamily: "cursive" }}>{clientCompteDebite?.raisonSociale ?? dossier.client}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#e5e8ec]">
              <button type="button" className="btn-secondary" onClick={() => setPopupSignature(false)}>Fermer</button>
            </div>
          </div>
        </>
      )}

      {/* Popup accusé de réception */}
      {popupAccuse && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setPopupAccuse(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Accusé de réception</div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={() => setPopupAccuse(false)}
                aria-label="Fermer l'accusé de réception"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-[#334155]">
              <p>Souhaitez-vous imprimer l'accusé de réception de l'événement <span className="font-mono font-medium">{evenement?.reference}</span> ?</p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-[#e5e8ec]">
              <button type="button" className="btn-secondary" onClick={() => setPopupAccuse(false)}>Fermer</button>
              <button type="button" className="btn-primary" onClick={editerAccuse}>Editer</button>
            </div>
          </div>
        </>
      )}

      {/* Popup recherche banque */}
      {popupBanque && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupBanque} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher une banque</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupBanque}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-label">Nom</label>
                  <input className="input w-full" value={rechNom} onChange={(e) => setRechNom(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-label">Code BIC</label>
                  <input className="input w-full font-mono" value={rechBic} onChange={(e) => setRechBic(e.target.value)} />
                </div>
                <div>
                  <label className="text-label">Pays</label>
                  <input className="input w-full" value={rechPays} onChange={(e) => setRechPays(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {banquesFiltrees.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucune banque trouvée.</div>
              )}
              {banquesFiltrees.map((b) => (
                <button
                  key={b.nom}
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-orange-50 transition"
                  onClick={() => choisirBanque(b)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[#0f172a]">{b.nom}</div>
                    <div className="font-mono text-[11px] text-[#64748b]">{b.bic}</div>
                  </div>
                  <div className="text-xs text-[#64748b]">{b.adresse} · {b.pays}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Popup choix du pays */}
      {popupPays && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupPays} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher un pays</div>
              <button
                type="button"
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupPays}
                aria-label="Fermer la recherche de pays"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <label className="text-label">Pays</label>
              <input className="input w-full" value={rechPaysChoix} onChange={(e) => setRechPaysChoix(e.target.value)} placeholder="Ex. France" autoFocus />
            </div>
            <div className="overflow-y-auto py-2">
              {paysFiltres.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucun pays trouvé.</div>
              )}
              {paysFiltres.map((pays) => (
                <button
                  key={pays}
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-orange-50 transition"
                  onClick={() => choisirPays(pays)}
                >
                  <div className="text-sm font-medium text-[#0f172a]">{pays}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {popupCompte && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupCompte} />
          <div role="dialog" aria-modal="true" aria-labelledby="titre-recherche-compte" onKeyDown={event => { if (event.key === "Escape") fermerPopupCompte(); }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div id="titre-recherche-compte" className="text-sm font-semibold text-[#0f172a]">Rechercher un compte</div>
              <button type="button" aria-label="Fermer la recherche de compte" className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center" onClick={fermerPopupCompte}><X size={16} /></button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec] grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-label" htmlFor="recherche-compte-raison-sociale">Raison sociale</label>
                <input id="recherche-compte-raison-sociale" className="input w-full" value={rechCompteRaisonSociale} onChange={event => setRechCompteRaisonSociale(event.target.value)} placeholder="Saisir la raison sociale" autoFocus />
              </div>
              <div>
                <label className="text-label" htmlFor="recherche-compte-numero">Numéro de compte</label>
                <input id="recherche-compte-numero" type="text" className="input w-full font-mono" value={rechCompteNumero} onChange={event => setRechCompteNumero(event.target.value)} placeholder="Saisir le numéro de compte" />
              </div>
              <div>
                <label className="text-label" htmlFor="recherche-compte-devise">Devise</label>
                <select id="recherche-compte-devise" className="input w-full" value={rechCompteDevise} onChange={event => setRechCompteDevise(event.target.value)}>
                  <option value="">Toutes</option>
                  {["EUR", "MAD", "USD", "TND", "GBP", "CNY"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {comptesFiltres.length === 0 && <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucun compte trouvé.</div>}
              {comptesFiltres.map(compte => (
                <button key={JSON.stringify([compte.nom, compte.compte, compte.devise])} type="button" className="w-full text-left px-5 py-3 hover:bg-orange-50 transition" onClick={() => choisirCompte(compte)}>
                  <div className="text-sm font-medium text-[#0f172a] break-words">{compte.nom}</div>
                  <div className="font-mono text-xs text-[#64748b] mt-1">{compte.compte}{compte.devise ? ` — ${compte.devise}` : ""}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Popup recherche tiré */}
      {popupTire && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupTire} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher le tiré</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupTire}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label">Nom</label>
                  <input className="input w-full" value={rechTireNom} onChange={(e) => setRechTireNom(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-label">Numéro de compte</label>
                  <input className="input w-full font-mono" value={rechTireCompte} onChange={(e) => setRechTireCompte(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {tiresFiltres.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucun tiré trouvé.</div>
              )}
              {tiresFiltres.map((c) => (
                <button
                  key={c.nom}
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-orange-50 transition"
                  onClick={() => {
                    setPaiementForm(f => ({ ...f, paiementRecuDe: c.nom, villePaiementRecuDe: "Casablanca", paysPaiementRecuDe: "Maroc" }));
                    fermerPopupTire();
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[#0f172a]">{c.nom}</div>
                    <div className="font-mono text-[11px] text-[#64748b]">{c.compte}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Popup recherche titre d'importation */}
      {popupTitre && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupTitre} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher un titre d'importation</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupTitre}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-label">N° Enregistrement</label>
                  <input className="input w-full font-mono" value={rechTitre} onChange={(e) => setRechTitre(e.target.value)} placeholder="Ex. TI-2025-09703" autoFocus />
                </div>
                <div>
                  <label className="text-label">Devise</label>
                  <input className="input w-full font-mono" value={rechTitreDevise} onChange={(e) => setRechTitreDevise(e.target.value)} placeholder="Ex. EUR" />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {titresFiltres.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucun titre trouvé.</div>
              )}
              {titresFiltres.map((t) => (
                <button
                  key={t.ref}
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-orange-50 transition"
                  onClick={() => ajouterTitre(t.ref)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[#0f172a] font-mono">{t.ref}</div>
                    <div className="font-mono text-[11px] text-[#64748b]">{t.montantDisponible.toLocaleString("fr-FR")} {t.devise}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Consultation d'un titre d'importation ajouté */}
      {titreConsulte && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={() => setTitreConsulte(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Détail du titre d'importation</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={() => setTitreConsulte(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <div className="text-label">N° Enregistrement</div>
                <div className="text-sm font-mono text-[#0f172a]">{titreConsulte.ref}</div>
              </div>
              <div>
                <div className="text-label">Devise</div>
                <div className="text-sm font-mono text-[#0f172a]">{detailTitreConsulte?.devise ?? deviseDossier}</div>
              </div>
              <div>
                <div className="text-label">Montant disponible</div>
                <div className="text-sm font-mono tabular-nums text-[#0f172a]">
                  {detailTitreConsulte ? `${detailTitreConsulte.montantDisponible.toLocaleString("fr-FR")} ${detailTitreConsulte.devise}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-label">Montant à réserver</div>
                <div className="text-sm font-mono tabular-nums text-[#0f172a]">
                  {titreConsulte.montant ? `${Number(titreConsulte.montant).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${deviseDossier}` : "—"}
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-[#e5e8ec] flex justify-end">
              <button type="button" className="btn-secondary" onClick={() => setTitreConsulte(null)}>Fermer</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
