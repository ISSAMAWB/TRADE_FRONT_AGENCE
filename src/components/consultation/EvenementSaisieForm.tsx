"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Trash2, Plus, Paperclip, FileText, FileCheck } from "lucide-react";
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

export default function EvenementSaisieForm({ dossier, nature, evenement, onCancel, onSaved }: EvenementSaisieFormProps) {
  const ajouterEvenementDossier = useTomStore((s) => s.ajouterEvenementDossier);
  const modifierEvenementDossier = useTomStore((s) => s.modifierEvenementDossier);

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const encours = dossier.donnees["encours"];
  const encoursOk = isMontantAvecDevise(encours) ? encours : null;
  const montantRemise = dossier.donnees["montantRemise"];
  const montantRemiseOk = isMontantAvecDevise(montantRemise) ? montantRemise : null;
  const deviseDossier = encoursOk?.devise ?? montantRemiseOk?.devise ?? "";
  const conditionsRemiseAutre = String(dossier.donnees["conditionsRemiseDocuments"] ?? "").trim().toLowerCase() === "autre";
  const lectureSeule = evenement?.statut === "SOUMIS";

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
    banqueBeneficiaire: p?.banqueBeneficiaire ?? "",
    adresseBanqueBeneficiaire: p?.adresseBanqueBeneficiaire ?? "",
    villeBanqueBeneficiaire: p?.villeBanqueBeneficiaire ?? "",
    paysBanqueBeneficiaire: p?.paysBanqueBeneficiaire ?? "",
    signatureConforme: p?.signatureConforme ?? false,
    titreImportationNonRequis: p?.titreImportationNonRequis ?? false,
    compteBeneficiaire: p?.compteBeneficiaire ?? "",

    coursApplique: p?.coursApplique != null ? String(p.coursApplique) : "10.55",
    montantPaye: p?.montantPaye != null ? String(p.montantPaye) : "",


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
  const evenementReception = useMemo(() => dossier.evenements.find(e => e.nature === "Réception de la remise"), [dossier]);
  const paiementsReception = evenementReception?.receptionRemise?.paiements ?? [];
  const dateReceptionRemise = evenementReception?.dateCreation ? String(evenementReception.dateCreation).slice(0, 10) : "";
  const [paiementsAAccepter, setPaiementsAAccepter] = useState<{ montant: string; periode: string; dateBase: string; maturite: string; accepte: boolean; avalise: boolean }[]>(
    ac?.paiementsAAccepter?.map(l => ({
      montant: l.montant != null ? String(l.montant) : "",
      periode: l.periode ?? "",
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
  const montantAPayerTotal = (Number(paiementForm.montantPaye) || 0) + (Number(montantAVue) || 0);
  const montantRestantRegler = montantRemiseOk ? montantRemiseOk.valeur - montantAPayerTotal : null;
  const coursApplique = Number(paiementForm.coursApplique);
  const contrevaleurBrute = montantAPayerTotal * coursApplique;
  const contrevaleurDirhams = (paiementForm.montantPaye.trim() !== "" || montantAVue.trim() !== "")
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
      if (manquants.length > 0) { setErreurSoumission(manquants); return; }
    }
    setErreurSoumission([]);
    const saisie = {
      nature,
      montant: montantRequis ? (isAcceptation ? montantAccepteTotal : montant) : null,
      devise: deviseDossier,
      saisieAgence: {
        dateEvenement,
        documentsAttaches: nature === "Paiement" || isAcceptation ? documentsAttaches : s?.documentsAttaches,

        datePaiement: nature === "Paiement" ? datePaiement : undefined,
        effet: nature === "Acceptation & Aval de la traite" ? effet : undefined,
        dateEcheance: nature === "Acceptation & Aval de la traite" && dateEcheanceEvt ? dateEcheanceEvt : undefined,
        motif: nature === "Retour des documents" ? motif : undefined,
        destinataire: nature === "Demande de remise des documents" ? destinataire : undefined,
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
      modifierEvenementDossier(dossier.reference, evenement.reference, saisie, nouveauStatut);
      onSaved(evenement.reference);
    } else {
      const ev = ajouterEvenementDossier(dossier.reference, saisie, nouveauStatut);
      onSaved(ev.reference);
    }
  }

  const [popupAccuse, setPopupAccuse] = useState(false);

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

      <fieldset disabled={lectureSeule} className="contents">
      <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5 mb-4">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
          <div className="w-1 h-5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
          <div className="text-sm font-semibold text-[#0f172a]">Informations générales</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-x-5 gap-y-5">
        <div>
          <label className="text-label">Référence de la remise</label>
          <input className="input w-full bg-gray-100" value={dossier.reference} readOnly />
        </div>
        <div>
          <label className="text-label">Date de création de la remise</label>
          <input
            className="input w-full bg-gray-100"
            value={dossier.evenements[0]?.dateCreation ? new Date(dossier.evenements[0].dateCreation).toLocaleDateString("fr-FR") : "—"}
            readOnly
          />
        </div>
        <div>
          <label className="text-label">Conditions de remise des documents</label>
          <input className="input w-full bg-gray-100" value={String(dossier.donnees["conditionsRemiseDocuments"] ?? "—")} readOnly />
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

        {nature === "Retour des documents" && (
          <div>
            <label className="text-label">Motif</label>
            <select className="input w-full" value={motif} onChange={(e) => setMotif(e.target.value)}>
              <option>Refus de paiement</option>
              <option>Refus d'acceptation</option>
              <option>Documents non conformes</option>
              <option>Demande du remettant</option>
              <option>Autre</option>
            </select>
          </div>
        )}

        {nature === "Demande de remise des documents" && (
          <div>
            <label className="text-label">Destinataire</label>
            <input className="input w-full" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
          </div>
        )}
        </div>
      </div>

      {/* ===== Blocs Acceptation & Aval de la traite — mêmes blocs que la page de consultation ===== */}
      {isAcceptation && (
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
                <input className="input w-full bg-gray-100" value={acceptationForm.acceptant} readOnly />
                <textarea
                  className="input w-full mt-1.5 bg-gray-100"
                  rows={3}
                  value={acceptationForm.adresseAcceptant}
                  placeholder="Adresse"
                  aria-label="Adresse de l'acceptant"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100" value={acceptationForm.villeAcceptant} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100" value={acceptationForm.paysAcceptant} readOnly />
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

          {/* Information de la partie à notifier */}
          <div className="border border-[#e5e8ec] rounded-xl bg-[#fafbfc] p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#eef1f4]">
              <div className="w-1 h-5 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Information de la partie à notifier</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-5">
              <div>
                <label className="text-label">Nature de la partie à notifier</label>
                <select className="input w-full bg-gray-100" value={acceptationForm.naturePartieANotifier} disabled>
                  <option>Tiré</option>
                  <option>Tireur</option>
                  <option>Banque remettante</option>
                  <option>Autre</option>
                </select>
                <input
                  type="text"
                  className="input w-full mt-2 bg-gray-100"
                  value={acceptationForm.partieANotifier}
                  placeholder="Nom de la partie à notifier"
                  aria-label="Partie à notifier"
                  readOnly
                />
                <textarea
                  className="input w-full mt-2 bg-gray-100"
                  rows={3}
                  value={acceptationForm.adressePartieANotifier}
                  placeholder="Adresse"
                  aria-label="Adresse de la partie à notifier"
                  readOnly
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100" value={acceptationForm.villePartieANotifier} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100" value={acceptationForm.paysPartieANotifier} readOnly />
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
                    <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Période (Tenor)</th>
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
                            className="input w-full min-w-0 text-right font-mono tabular-nums bg-gray-100"
                            value={ligne.montant}
                            aria-label={`Montant du paiement à accepter ligne ${i + 1}`}
                            readOnly
                          />
                          <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <input className="input w-full bg-gray-100" value={ligne.periode} aria-label={`Période ligne ${i + 1}`} readOnly />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className={`input w-full bg-gray-100 ${ligne.periode.toLowerCase().includes("vue") ? "text-center text-[#64748b]" : ""}`}
                          value={ligne.periode.toLowerCase().includes("vue") ? "—" : (ligne.dateBase ? new Date(`${ligne.dateBase}T00:00:00`).toLocaleDateString("fr-FR") : "")}
                          aria-label={`Date de base ligne ${i + 1}`}
                          readOnly
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          className={`input w-full bg-gray-100 ${ligne.periode.toLowerCase().includes("vue") ? "text-center text-[#64748b]" : ""}`}
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
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={acceptationForm.titreImportationNonRequis}
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
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à imputer</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">N° Enregistrement</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant disponible</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de validité</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titresImputation.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 px-3 text-center text-sm text-[#94a3b8]">Aucun titre d'importation.</td>
                      </tr>
                    )}
                    {titresPage.map(t => (
                      <tr key={t.ref} className="border-b border-[#e5e8ec]">
                        <td className="py-2 px-3 text-left">
                          <input
                            type="number"
                            className="input w-full text-left font-mono tabular-nums"
                            value={t.montant}
                            onChange={(e) => setTitresImputation(ts => ts.map(x => x.ref === t.ref ? { ...x, montant: e.target.value } : x))}
                          />
                        </td>
                        <td className="py-2 px-3 text-left font-mono text-[11px] text-[#64748b]">{t.ref}</td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">
                          {montantRemiseOk
                            ? `${(montantRemiseOk.valeur / Math.max(1, titresImputation.length)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}`
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-left text-[#64748b]">—</td>
                        <td className="py-2 px-3 text-left">
                          <button
                            type="button"
                            className="text-[#94a3b8] hover:text-[#dc2626] transition"
                            onClick={() => supprimerTitre(t.ref)}
                            title={`Supprimer ${t.ref}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-semibold text-[#0f172a]">
                <span>Nombre Total : {titresImputation.length}</span>
                <span>
                  Montant total imputé : {titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}
                </span>
                <span>
                  Montant restant à imputer : <span className={montantAccepteTotal - titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0) > 0 ? "text-red-600" : undefined}>{(montantAccepteTotal - titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}</span>
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
      {nature === "Paiement" && (
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
                <select className="input w-full bg-gray-100" value={paiementForm.partieOriginePaiement} onChange={setP("partieOriginePaiement")} disabled>
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
                  <input type="text" className="input w-full pr-9 bg-gray-100" value={paiementForm.paiementRecuDe} readOnly placeholder="Nom du payeur" />
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
                  className="input w-full mt-1.5 bg-gray-100"
                  rows={4}
                  value={paiementForm.adressePaiementRecuDe}
                  readOnly
                  placeholder="Adresse"
                  aria-label="Adresse du payeur"
                />
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-label">Ville</label>
                    <input className="input w-full bg-gray-100" value={paiementForm.villePaiementRecuDe} readOnly />
                  </div>
                  <div>
                    <label className="text-label">Pays</label>
                    <input className="input w-full bg-gray-100" value={paiementForm.paysPaiementRecuDe} readOnly />
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="w-full rounded-lg border border-[#e5e8ec]">
                  <table className="w-full table-fixed text-xs" aria-label="Informations du compte à débiter">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-[#e5e8ec]">
                        <th scope="col" className="w-[34%] px-3 py-2 text-left font-semibold text-[#64748b]">Intitulé compte</th>
                        <th scope="col" className="w-[22%] px-3 py-2 text-left font-semibold text-[#64748b]">Solde</th>
                        <th scope="col" className="w-[22%] px-3 py-2 text-left font-semibold text-[#64748b]">Disponible</th>
                        <th scope="col" className="w-[22%] px-3 py-2 text-left font-semibold text-[#64748b]">Identité</th>
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
                          className="input w-full min-w-0 text-right font-mono tabular-nums"
                          aria-label={`Montant à payer ligne 1 ${deviseDossier}`}
                          value={paiementForm.montantPaye}
                          onChange={setP("montantPaye")}
                        />
                        <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                      </div>
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
                          className="input w-full min-w-0 text-right font-mono tabular-nums"
                          aria-label={`Montant à payer ligne 2 ${deviseDossier}`}
                          value={montantAVue}
                          onChange={(e) => setMontantAVue(e.target.value)}
                        />
                        <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#e5e8ec] text-sm font-semibold text-[#0f172a]">
              <span>Montant total à payer :</span>
              <span className="font-mono tabular-nums text-[#e8632b]">
                {Number.isFinite(montantAPayerTotal) && (paiementForm.montantPaye.trim() !== "" || montantAVue.trim() !== "")
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
                  <input className="input w-full bg-gray-100" value={montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR")} ${montantRemiseOk.devise}` : "—"} readOnly />
                </div>
                <div>
                  <label className="text-label">Cours appliqué</label>
                  <input type="number" step="0.0001" className="input w-full bg-gray-100" value={paiementForm.coursApplique} onChange={setP("coursApplique")} placeholder="Ex. 10,85" readOnly />
                </div>
                <div>
                  <label className="text-label">Date de valeur</label>
                  <input type="date" className="input w-full" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant total à payer <span className="text-red-500">*</span></label>
                  {conditionsRemiseAutre ? (
                    <input type="text" className="input w-full bg-gray-100" value={Number.isFinite(montantAPayerTotal) && (paiementForm.montantPaye.trim() !== "" || montantAVue.trim() !== "") ? `${montantAPayerTotal.toLocaleString("fr-FR")} ${deviseDossier}`.trim() : ""} readOnly />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input type="number" className="input w-full min-w-0 text-right font-mono tabular-nums" value={paiementForm.montantPaye} onChange={setP("montantPaye")} aria-label={`Montant total à payer ${deviseDossier}`} />
                      <span className="shrink-0 text-xs font-mono text-[#64748b]">{deviseDossier}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-label">Contrevaleur estimative en dirhams</label>
                  <input type="number" step="0.01" className="input w-full bg-gray-100" value={contrevaleurDirhams != null ? contrevaleurDirhams.toFixed(2) : ""} readOnly />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant restant à régler</label>
                  <input type="text" className="input w-full bg-gray-100" value={montantRestantRegler != null ? `${montantRestantRegler.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${deviseDossier}` : ""} readOnly />
                </div>
                <div>
                  <label className="text-label">Référence de l'aval</label>
                  <input className="input w-full" value={paiementForm.compteDebite} onChange={setP("compteDebite")} />
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
                  <select className="input w-full bg-gray-100" value={paiementForm.naturePartieAPayer} onChange={setP("naturePartieAPayer")} disabled>
                    <option>Banque étrangère</option>
                    <option>Tireur</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input w-full bg-gray-100 ${paiementForm.naturePartieAPayer === "Banque étrangère" ? "pr-9" : ""}`}
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
                    className="input w-full mt-2 bg-gray-100"
                    rows={4}
                    value={paiementForm.adressePartieAPayer}
                    readOnly
                    placeholder="Adresse"
                    aria-label="Adresse de la partie à payer"
                  />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-label">Ville</label>
                      <input className="input w-full bg-gray-100" value={paiementForm.villePartieAPayer} readOnly />
                    </div>
                    <div>
                      <label className="text-label">Pays</label>
                      <input className="input w-full bg-gray-100" value={paiementForm.paysPartieAPayer} readOnly />
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
                    className="input w-full mt-2 bg-gray-100"
                    rows={4}
                    value={[paiementForm.adresseBanqueBeneficiaire].filter(Boolean).join("\n")}
                    readOnly
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
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.titreImportationNonRequis}
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
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à imputer</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">N° Enregistrement</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant disponible</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Date de validité</th>
                      <th className="text-left py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {titresImputation.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-4 px-3 text-center text-sm text-[#94a3b8]">Aucun titre d'importation.</td>
                      </tr>
                    )}
                    {titresPage.map(t => (
                      <tr key={t.ref} className="border-b border-[#e5e8ec]">
                        <td className="py-2 px-3 text-left">
                          <input
                            type="number"
                            className="input w-full text-left font-mono tabular-nums"
                            value={t.montant}
                            onChange={(e) => setTitresImputation(ts => ts.map(x => x.ref === t.ref ? { ...x, montant: e.target.value } : x))}
                          />
                        </td>
                        <td className="py-2 px-3 text-left font-mono text-[11px] text-[#64748b]">{t.ref}</td>
                        <td className="py-2 px-3 text-left font-mono tabular-nums text-[#0f172a]">
                          {montantRemiseOk
                            ? `${(montantRemiseOk.valeur / Math.max(1, titresImputation.length)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${montantRemiseOk.devise}`
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-left text-[#64748b]">—</td>
                        <td className="py-2 px-3 text-left">
                          <button
                            type="button"
                            className="text-[#94a3b8] hover:text-[#dc2626] transition"
                            onClick={() => supprimerTitre(t.ref)}
                            title={`Supprimer ${t.ref}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-xs font-semibold text-[#0f172a]">
                <span>Nombre Total : {titresImputation.length}</span>
                <span>
                  Montant total imputé : {titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}
                </span>
                <span>
                  Montant restant à imputer : <span className={montantAPayerTotal - titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0) > 0 ? "text-red-600" : undefined}>{(montantAPayerTotal - titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {deviseDossier}</span>
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
    </div>
  );
}
