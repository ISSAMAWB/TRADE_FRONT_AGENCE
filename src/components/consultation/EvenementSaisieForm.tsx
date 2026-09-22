"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Trash2, Plus, Paperclip, FileText } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
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

  const s = evenement?.saisieAgence;
  const p = s?.paiement;
  const [identiteCompteSelectionne, setIdentiteCompteSelectionne] = useState<{ numeroCompte: string; raisonSociale: string } | null>(p?.identiteCompteDebite ?? null);

  const fichierInputRef = useRef<HTMLInputElement>(null);
  const typesDocuments: TypeDocumentAttacheAgence[] = ["Ordre de paiement", "Facture", "Titre d'importation"];
  const [typeDocument, setTypeDocument] = useState<TypeDocumentAttacheAgence | "">("");
  const [erreurOrdrePaiement, setErreurOrdrePaiement] = useState(false);
  const [documentsAttaches, setDocumentsAttaches] = useState<DocumentAttacheAgence[]>(s?.documentsAttaches ?? []);
  const ordrePaiementJoint = documentsAttaches.some(document => document.categorie === "Ordre de paiement" && document.fichier?.size > 0);
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
    { nom: "Société Générale Paris", pays: "France", bic: "SOGEFRPP", adresse: "29 Bd Haussmann, 75009 Paris, France" },
    { nom: "BNP Paribas", pays: "France", bic: "BNPAFRPP", adresse: "16 Bd des Italiens, 75009 Paris, France" },
    { nom: "Crédit Agricole", pays: "France", bic: "AGRIFRPP", adresse: "12 Pl. des États-Unis, 92120 Montrouge, France" },
    { nom: "Commerzbank AG", pays: "Allemagne", bic: "COBADEFF", adresse: "Kaiserstraße, 60311 Frankfurt am Main, Allemagne" },
    { nom: "Deutsche Bank", pays: "Allemagne", bic: "DEUTDEFF", adresse: "Taunusanlage 12, 60325 Frankfurt am Main, Allemagne" },
    { nom: "UniCredit", pays: "Italie", bic: "UNCRITMM", adresse: "Piazza Gae Aulenti 3, 20154 Milano, Italie" },
    { nom: "Banco Santander", pays: "Espagne", bic: "BSCHESMM", adresse: "Av. de Cantabria, 28660 Boadilla del Monte, Madrid, Espagne" },
    { nom: "HSBC Bank plc", pays: "Royaume-Uni", bic: "HBUKGB4B", adresse: "8 Canada Square, London E14 5HQ, Royaume-Uni" },
    { nom: "Attijariwafa Bank", pays: "Maroc", bic: "BCMAMAMC", adresse: "2 Bd Moulay Youssef, 20100 Casablanca, Maroc" },
    { nom: "Banque Populaire", pays: "Maroc", bic: "BCPOMAMC", adresse: "101 Bd Mohamed Zerktouni, 20100 Casablanca, Maroc" },
    { nom: "BMCE Bank", pays: "Maroc", bic: "BMCEMAMC", adresse: "140 Av. Hassan II, 20070 Casablanca, Maroc" },
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

  const TICKETS_SDM = [
    { numero: "SDM-2026-0112", libelle: "Ticket SDM - encaissement partiel", montant: 200000 },
    { numero: "SDM-2026-0234", libelle: "Ticket SDM - règlement principal", montant: 450000 },
    { numero: "SDM-2026-0298", libelle: "Ticket SDM - régularisation", montant: 100000 },
    { numero: "SDM-2026-0301", libelle: "Ticket SDM - acompte", montant: 50000 },
    { numero: "SDM-2026-0417", libelle: "Ticket SDM - solde", montant: 650000 },
  ];

  const [popupTicket, setPopupTicket] = useState(false);
  const [rechTicket, setRechTicket] = useState("");
  const [ticketsSel, setTicketsSel] = useState<string[]>([]);
  const ticketsFiltres = TICKETS_SDM.filter(t => t.numero.toLowerCase().includes(rechTicket.toLowerCase()));
  const ouvrirPopupTicket = () => {
    setTicketsSel(paiementForm.naturePaiement ? paiementForm.naturePaiement.split(",").map(s => s.trim()).filter(Boolean) : []);
    setPopupTicket(true);
  };
  const fermerPopupTicket = () => { setPopupTicket(false); setRechTicket(""); };
  const toggleTicket = (numero: string) =>
    setTicketsSel(sel => sel.includes(numero) ? sel.filter(n => n !== numero) : [...sel, numero]);
  const validerTickets = () => {
    setPaiementForm(f => ({ ...f, naturePaiement: ticketsSel.join(", ") }));
    fermerPopupTicket();
  };

  const [montantAVue, setMontantAVue] = useState("");

  const titresDossier = (dossier.donnees["referencesTitresImportation"] as string[] | undefined) ?? [];
  const [titresImputation, setTitresImputation] = useState<{ ref: string; montant: string }[]>(
    titresDossier.map(ref => ({ ref, montant: "" }))
  );
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
  ])).map(ref => ({ ref, montantDisponible: 325000 }));
  const [popupTitre, setPopupTitre] = useState(false);
  const [rechTitre, setRechTitre] = useState("");
  const titresFiltres = TITRES_DISPONIBLES.filter(t =>
    t.ref.toLowerCase().includes(rechTitre.toLowerCase()) &&
    !titresImputation.some(x => x.ref === t.ref)
  );
  const fermerPopupTitre = () => { setPopupTitre(false); setRechTitre(""); };
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
  const choisirBanque = (b: { nom: string; adresse: string }) => {
    if (popupBanque === "partie") {
      setPaiementForm(f => ({ ...f, partieAPayer: b.nom, adressePartieAPayer: b.adresse }));
    } else if (popupBanque === "payeur") {
      setPaiementForm(f => ({ ...f, paiementRecuDe: b.nom, adressePaiementRecuDe: b.adresse }));
    } else {
      setPaiementForm(f => ({ ...f, banqueBeneficiaire: b.nom, adresseBanqueBeneficiaire: b.adresse }));
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
    referencePaiementRecu: p?.referencePaiementRecu ?? "",
    partieOriginePaiement: p?.partieOriginePaiement ?? "Tiré",
    paiementRecuDe: p?.paiementRecuDe ?? DEFAUT_PAIEMENT_RECU_DE,
    adressePaiementRecuDe: p?.adressePaiementRecuDe ?? DEFAUT_ADRESSE_PAIEMENT_RECU_DE,
    villePaiementRecuDe: p?.villePaiementRecuDe ?? "",
    paysPaiementRecuDe: p?.paysPaiementRecuDe ?? "",
    dateReception: p?.dateReception ?? aujourdhui,
    instructionPaiement: p?.instructionPaiement ?? "",
    naturePartieAPayer: p?.naturePartieAPayer ?? "Banque étrangère",
    partieAPayer: p?.partieAPayer ?? "",
    adressePartieAPayer: p?.adressePartieAPayer ?? "",
    villePartieAPayer: p?.villePartieAPayer ?? "",
    paysPartieAPayer: p?.paysPartieAPayer ?? "",
    referenceBeneficiaire: p?.referenceBeneficiaire ?? "",
    modePaiement: p?.modePaiement ?? "Payer",
    banqueBeneficiaire: p?.banqueBeneficiaire ?? "",
    adresseBanqueBeneficiaire: p?.adresseBanqueBeneficiaire ?? "",
    villeBanqueBeneficiaire: p?.villeBanqueBeneficiaire ?? "",
    paysBanqueBeneficiaire: p?.paysBanqueBeneficiaire ?? "",
    banqueSansCleRma: p?.banqueSansCleRma ?? false,
    compteBeneficiaire: p?.compteBeneficiaire ?? "",
    remiseAExpirer: p?.remiseAExpirer ?? false,
    paiementAvecRecours: p?.paiementAvecRecours ?? false,
    coursApplique: p?.coursApplique != null ? String(p.coursApplique) : "10.55",
    montantPaye: p?.montantPaye != null ? String(p.montantPaye) : "",
    naturePaiement: p?.naturePaiement ?? "",
    montantRestant: p?.montantRestant != null ? String(p.montantRestant) : "",
    numeroUetr: p?.numeroUetr ?? "",
    dateValeur: p?.dateValeur ?? aujourdhui,
    compteDebite: p?.compteDebite ?? "",
    agenceDomiciliation: p?.agenceDomiciliation ?? "",
  });
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
  const basculerBlocageProvision = () => {
    if (blocageActif) {
      setBlocageProvision(null);
    } else if (peutBloquerProvision && montantABloquer != null) {
      setBlocageProvision({ numeroCompte: compteDebiteNormalise, montant: montantABloquer, devise: deviseMontantABloquer });
    }
  };

  function enregistrer() {
    if (nature === "Paiement" && !ordrePaiementJoint) {
      setErreurOrdrePaiement(true);
      setOngletPieces("documents");
      return;
    }
    const saisie = {
      nature,
      montant: montantRequis ? montant : null,
      devise: deviseDossier,
      saisieAgence: {
        dateEvenement,
        documentsAttaches: nature === "Paiement" ? documentsAttaches : s?.documentsAttaches,

        datePaiement: nature === "Paiement" ? datePaiement : undefined,
        effet: nature === "Acceptation & Aval de la traite" ? effet : undefined,
        dateEcheance: nature === "Acceptation & Aval de la traite" && dateEcheanceEvt ? dateEcheanceEvt : undefined,
        motif: nature === "Retour des documents" ? motif : undefined,
        destinataire: nature === "Demande de remise des documents" ? destinataire : undefined,
        paiement: nature === "Paiement" ? {
          referencePaiementRecu: paiementForm.referencePaiementRecu || undefined,
          partieOriginePaiement: paiementForm.partieOriginePaiement || undefined,
          paiementRecuDe: paiementForm.paiementRecuDe || undefined,
          adressePaiementRecuDe: paiementForm.adressePaiementRecuDe || undefined,
          villePaiementRecuDe: paiementForm.villePaiementRecuDe || undefined,
          paysPaiementRecuDe: paiementForm.paysPaiementRecuDe || undefined,
          dateReception: paiementForm.dateReception || undefined,
          instructionPaiement: paiementForm.instructionPaiement || undefined,
          naturePartieAPayer: paiementForm.naturePartieAPayer || undefined,
          partieAPayer: paiementForm.partieAPayer || undefined,
          adressePartieAPayer: paiementForm.adressePartieAPayer || undefined,
          villePartieAPayer: paiementForm.villePartieAPayer || undefined,
          paysPartieAPayer: paiementForm.paysPartieAPayer || undefined,
          referenceBeneficiaire: paiementForm.referenceBeneficiaire || undefined,
          modePaiement: paiementForm.modePaiement || undefined,
          banqueBeneficiaire: paiementForm.banqueBeneficiaire || undefined,
          adresseBanqueBeneficiaire: paiementForm.adresseBanqueBeneficiaire || undefined,
          villeBanqueBeneficiaire: paiementForm.villeBanqueBeneficiaire || undefined,
          paysBanqueBeneficiaire: paiementForm.paysBanqueBeneficiaire || undefined,
          banqueSansCleRma: paiementForm.banqueSansCleRma,
          compteBeneficiaire: paiementForm.compteBeneficiaire || undefined,
          remiseAExpirer: paiementForm.remiseAExpirer,
          paiementAvecRecours: paiementForm.paiementAvecRecours,
          coursApplique: paiementForm.coursApplique ? Number(paiementForm.coursApplique) : undefined,
          montantPaye: montantAPayerTotal || undefined,
          contrevaleurDirhams,
          naturePaiement: paiementForm.naturePaiement || undefined,
          montantRestant: paiementForm.montantRestant ? Number(paiementForm.montantRestant) : undefined,
          numeroUetr: paiementForm.numeroUetr || undefined,
          dateValeur: paiementForm.dateValeur || undefined,
          compteDebite: paiementForm.compteDebite || undefined,
          identiteCompteDebite: clientCompteDebite ? { numeroCompte: compteDebiteNormalise, raisonSociale: clientCompteDebite.raisonSociale } : undefined,
          blocageProvision: blocageActif ?? undefined,
          agenceDomiciliation: paiementForm.agenceDomiciliation || undefined,
        } : undefined,
      },
    };
    if (evenement) {
      modifierEvenementDossier(dossier.reference, evenement.reference, saisie);
      onSaved(evenement.reference);
    } else {
      const ev = ajouterEvenementDossier(dossier.reference, saisie);
      onSaved(ev.reference);
    }
  }

  return (
    <div>
      <div className="bg-[#FAEEDA] text-[#854F0B] text-xs rounded-lg p-2 mb-4">
        {evenement
          ? "L'événement reste en statut En attente. L'encours et le dossier seront mis à jour après validation."
          : "L'événement sera créé en statut En attente. L'encours et le dossier seront mis à jour après validation."}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-label">Référence de la remise</label>
          <input className="input w-full bg-gray-50" value={dossier.reference} readOnly />
        </div>
        <div>
          <label className="text-label">Date de création</label>
          <input
            className="input w-full bg-gray-50"
            value={dossier.evenements[0]?.dateCreation ? new Date(dossier.evenements[0].dateCreation).toLocaleDateString("fr-FR") : "—"}
            readOnly
          />
        </div>
        <div>
          <label className="text-label">Conditions de remise des documents</label>
          <input className="input w-full bg-gray-50" value={String(dossier.donnees["conditionsRemiseDocuments"] ?? "—")} readOnly />
        </div>

        {nature === "Acceptation & Aval de la traite" && (
          <>
            <div>
              <label className="text-label">Effet</label>
              <select className="input w-full" value={effet} onChange={(e) => setEffet(e.target.value as "Avec aval" | "Sans aval")}>
                <option value="Avec aval">Avec aval</option>
                <option value="Sans aval">Sans aval</option>
              </select>
            </div>
            <div>
              <label className="text-label">Date d'échéance</label>
              <input type="date" className="input w-full" value={dateEcheanceEvt} onChange={(e) => setDateEcheanceEvt(e.target.value)} />
            </div>
          </>
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

      {/* ===== Blocs Paiement — mêmes blocs que la page de consultation ===== */}
      {nature === "Paiement" && (
        <div className="space-y-4 mb-4">

          {/* Détails du paiement reçu */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails du paiement reçu</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">Partie à l'origine du paiement</label>
                <select className="input w-full" value={paiementForm.partieOriginePaiement} onChange={setP("partieOriginePaiement")}>
                  <option>Tiré</option>
                  <option>Tireur</option>
                  <option>Banque remettante</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-label">Référence du paiement reçu</label>
                <input className="input w-full" value={paiementForm.referencePaiementRecu} onChange={setP("referencePaiementRecu")} placeholder="Ex. LIC3344992" />
              </div>
              <div>
                <label className="text-label">Date de réception</label>
                <input type="date" className="input w-full" value={paiementForm.dateReception} onChange={setP("dateReception")} />
              </div>
              <div>
                <label className="text-label">Paiement reçu de</label>
                <div className="relative">
                  <input type="text" className="input w-full pr-9" value={paiementForm.paiementRecuDe} onChange={setP("paiementRecuDe")} placeholder="Nom du payeur" />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                    onClick={() => paiementForm.partieOriginePaiement === "Banque remettante" ? setPopupBanque("payeur") : setPopupTire(true)}
                    title={paiementForm.partieOriginePaiement === "Banque remettante" ? "Rechercher la banque remettante" : "Rechercher le tiré"}
                  >
                    <Search size={15} />
                  </button>
                </div>
                <textarea
                  className="input w-full mt-1.5 bg-gray-50"
                  rows={3}
                  value={paiementForm.adressePaiementRecuDe}
                  onChange={setP("adressePaiementRecuDe")}
                  placeholder="Adresse du payeur"
                />
                <div className="mt-4">
                  <label className="text-label" htmlFor="ville-paiement-recu-de">Ville</label>
                  <input id="ville-paiement-recu-de" className="input w-full" value={paiementForm.villePaiementRecuDe} onChange={setP("villePaiementRecuDe")} />
                </div>
                <div className="mt-4">
                  <label className="text-label" htmlFor="pays-paiement-recu-de">Pays</label>
                  <input id="pays-paiement-recu-de" className="input w-full" value={paiementForm.paysPaiementRecuDe} onChange={setP("paysPaiementRecuDe")} />
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-label" htmlFor="compte-a-debiter-recu">Compte à débiter</label>
                    <div className="relative">
                      <input id="compte-a-debiter-recu" className="input w-full pr-9" value={paiementForm.compteDebite} onChange={setP("compteDebite")} />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition" onClick={() => setPopupCompte(true)} title="Rechercher un compte" aria-label="Rechercher un compte">
                        <Search size={15} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="w-full overflow-x-auto rounded-lg border border-[#e5e8ec]">
                  <table className="w-full min-w-[800px] table-fixed text-xs" aria-label="Informations du compte à débiter">
                    <thead className="bg-gray-50">
                      <tr className="border-b border-[#e5e8ec]">
                        <th scope="col" className="w-[24%] px-3 py-2 text-left font-semibold text-[#64748b]">Intitulé compte</th>
                        <th scope="col" className="w-[15%] px-3 py-2 text-left font-semibold text-[#64748b]">Solde</th>
                        <th scope="col" className="w-[15%] px-3 py-2 text-left font-semibold text-[#64748b]">Disponible</th>
                        <th scope="col" className="w-[18%] px-3 py-2 text-left font-semibold text-[#64748b]">Identité</th>
                        <th scope="col" className="w-[16%] px-3 py-2 text-left font-semibold text-[#64748b]">Montant bloqué</th>
                        <th scope="col" className="w-[12%] px-3 py-2 text-left font-semibold text-[#64748b]">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="align-top">
                        <td className="px-3 py-3 text-[#0f172a] break-words">
                          <div className="font-mono break-all">{paiementForm.compteDebite.trim() || "—"}</div>
                          {clientCompteDebite && <div className="mt-1">{clientCompteDebite.raisonSociale}</div>}
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums text-[#0f172a]">
                          {montantsCompteFictifs ? `${montantsCompteFictifs.solde.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${montantsCompteFictifs.devise}` : "—"}
                        </td>
                        <td className="px-3 py-3 font-mono tabular-nums text-[#2563eb]">
                          {montantsCompteFictifs ? `${montantsCompteFictifs.disponible.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${montantsCompteFictifs.devise}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-[#0f172a] break-words">{clientCompteDebite?.raisonSociale || "—"}</td>
                        <td className="px-3 py-3 font-mono tabular-nums text-[#0f172a]">
                          {peutBloquerProvision && montantABloquer != null ? `${montantABloquer.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${deviseMontantABloquer}` : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {montantsCompteFictifs ? (
                            <button type="button" className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed" onClick={basculerBlocageProvision} disabled={!blocageActif && !peutBloquerProvision} title={!peutBloquerProvision ? "Renseigner un montant à payer positif et, si les devises diffèrent, un cours appliqué valide" : undefined}>
                              {blocageActif ? "Débloquer" : "Bloquer"}
                            </button>
                          ) : "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <label className="text-label">Instruction du paiement</label>
                  <textarea className="input w-full" rows={3} value={paiementForm.instructionPaiement} onChange={setP("instructionPaiement")} />
                </div>
              </div>
            </div>
          </div>

          {/* Bénéficiaire du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Bénéficiaire du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Nature de la partie à payer</label>
                  <select className="input w-full" value={paiementForm.naturePartieAPayer} onChange={setP("naturePartieAPayer")}>
                    <option>Banque étrangère</option>
                    <option>Tireur</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label className="text-label">Partie à payer</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`input w-full ${paiementForm.naturePartieAPayer === "Banque étrangère" ? "pr-9" : ""}`}
                      value={paiementForm.partieAPayer}
                      onChange={setP("partieAPayer")}
                      placeholder="Nom de la partie à payer"
                    />
                    {paiementForm.naturePartieAPayer === "Banque étrangère" && (
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                        onClick={() => setPopupBanque("partie")}
                        title="Rechercher une banque"
                      >
                        <Search size={15} />
                      </button>
                    )}
                  </div>
                  <textarea
                    className="input w-full mt-2 bg-gray-50"
                    rows={3}
                    value={paiementForm.adressePartieAPayer}
                    onChange={setP("adressePartieAPayer")}
                    placeholder="Adresse de la partie à payer"
                  />
                </div>
                <div>
                  <label className="text-label" htmlFor="ville-partie-a-payer">Ville</label>
                  <input id="ville-partie-a-payer" className="input w-full" value={paiementForm.villePartieAPayer} onChange={setP("villePartieAPayer")} />
                </div>
                <div>
                  <label className="text-label" htmlFor="pays-partie-a-payer">Pays</label>
                  <input id="pays-partie-a-payer" className="input w-full" value={paiementForm.paysPartieAPayer} onChange={setP("paysPartieAPayer")} />
                </div>
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Référence</label>
                  <input className="input w-full" value={paiementForm.referenceBeneficiaire} onChange={setP("referenceBeneficiaire")} />
                </div>
                <div>
                  <label className="text-label">Banque du bénéficiaire</label>
                  <div className="relative">
                    <input className="input w-full pr-9" value={paiementForm.banqueBeneficiaire} onChange={setP("banqueBeneficiaire")} />
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
                    className="input w-full mt-2 bg-gray-50"
                    rows={3}
                    value={paiementForm.adresseBanqueBeneficiaire}
                    onChange={setP("adresseBanqueBeneficiaire")}
                    placeholder="Adresse de la banque"
                  />
                </div>
                <div>
                  <label className="text-label" htmlFor="ville-banque-beneficiaire">Ville</label>
                  <input id="ville-banque-beneficiaire" className="input w-full" value={paiementForm.villeBanqueBeneficiaire} onChange={setP("villeBanqueBeneficiaire")} />
                </div>
                <div>
                  <label className="text-label" htmlFor="pays-banque-beneficiaire">Pays</label>
                  <input id="pays-banque-beneficiaire" className="input w-full" value={paiementForm.paysBanqueBeneficiaire} onChange={setP("paysBanqueBeneficiaire")} />
                </div>
              </div>
              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <label className="text-label">Mode de paiement</label>
                  <select className="input w-full" value={paiementForm.modePaiement} onChange={setP("modePaiement")}>
                    <option>Payer</option>
                    <option>Paiement avec financement</option>
                    <option>Offre de financement</option>
                  </select>
                </div>
                <div>
                  <label className="text-label">Numéro de compte du bénéficiaire</label>
                  <input className="input w-full" value={paiementForm.compteBeneficiaire} onChange={setP("compteBeneficiaire")} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.remiseAExpirer} onChange={setP("remiseAExpirer")} />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Remise à expirer</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.paiementAvecRecours} onChange={setP("paiementAvecRecours")} />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Paiement avec recours</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.banqueSansCleRma} onChange={setP("banqueSansCleRma")} />
                    <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Banque sans clé RMA</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des paiements */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
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
                    <th className="text-right py-2 px-3 font-semibold text-[#64748b] text-[11px] uppercase tracking-wider">Montant à payer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#e5e8ec]">
                    <td className="py-2 px-3 text-[#0f172a]">1</td>
                    <td className="py-2 px-3 text-[#64748b]">{String(dossier.donnees["conditionsRemiseDocuments"] ?? "").toLowerCase().includes("acceptation") ? "Contre acceptation" : "Contre paiement"}</td>
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
          </div>

          {/* Détails du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant des documents</label>
                  <input className="input w-full bg-gray-50" value={montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR")} ${montantRemiseOk.devise}` : "—"} readOnly />
                </div>
                <div>
                  <label className="text-label">Montant restant à régler</label>
                  <input type="number" className="input w-full" value={paiementForm.montantRestant} onChange={setP("montantRestant")} />
                </div>
                <div>
                  <label className="text-label">Numéro UETR</label>
                  <input className="input w-full" value={paiementForm.numeroUetr} onChange={setP("numeroUetr")} placeholder="Ex. 56f0c1ce-…" />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant à payer</label>
                  <input type="text" className="input w-full bg-gray-50" value={Number.isFinite(montantAPayerTotal) && (paiementForm.montantPaye.trim() !== "" || montantAVue.trim() !== "") ? `${montantAPayerTotal.toLocaleString("fr-FR")} ${deviseDossier}`.trim() : ""} readOnly />
                </div>
                <div>
                  <label className="text-label">Cours appliqué</label>
                  <input type="number" step="0.0001" className="input w-full" value={paiementForm.coursApplique} onChange={setP("coursApplique")} placeholder="Ex. 10,85" />
                </div>
                <div>
                  <label className="text-label">Contrevaleur en dirhams</label>
                  <input type="number" step="0.01" className="input w-full bg-gray-50" value={contrevaleurDirhams != null ? contrevaleurDirhams.toFixed(2) : ""} readOnly />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Date de valeur</label>
                  <input type="date" className="input w-full" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
                </div>
                <div>
                  <label className="text-label">N.Ticket SDM</label>
                  <div className="relative">
                    <input className="input w-full pr-9" value={paiementForm.naturePaiement} onChange={setP("naturePaiement")} placeholder="N° du ticket" />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                      onClick={ouvrirPopupTicket}
                      title="Rechercher un ticket SDM"
                    >
                      <Search size={15} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-label">Numéro du compte débité</label>
                  <input className="input w-full" value={paiementForm.compteDebite} onChange={setP("compteDebite")} />
                </div>
              </div>
            </div>
          </div>

          {/* Titres d'importation */}
          <div className="border border-[#e5e8ec] rounded-xl bg-white p-4">
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
              <div className="flex justify-end mb-3">
                <button
                  type="button"
                  className="h-7 w-7 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                  onClick={() => setPopupTitre(true)}
                  title="Ajouter un titre d'importation"
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
                  Montant Total : {titresImputation.reduce((s, t) => s + (Number(t.montant) || 0), 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
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
              <div className="flex items-end justify-between flex-wrap gap-3 mb-3">
                <div className="w-full sm:w-auto sm:min-w-[220px]">
                  <label className="text-label" htmlFor="type-document-attache">Type de document</label>
                  <select id="type-document-attache" className="input w-full" value={typeDocument} onChange={event => setTypeDocument(event.target.value as TypeDocumentAttacheAgence | "")}>
                    <option value="">Sélectionner un type</option>
                    {typesDocuments.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <button type="button" className="btn-secondary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed" disabled={!typeDocument} onClick={() => fichierInputRef.current?.click()}>
                  <Paperclip size={15} /> Joindre des documents
                </button>
                <input ref={fichierInputRef} type="file" multiple disabled={!typeDocument} className="hidden" aria-label="Joindre des documents" onChange={e => joindreDocuments(e.target.files)} />
              </div>
              <p className="text-xs text-[#64748b] mb-3">Un ordre de paiement est obligatoire pour enregistrer le paiement.</p>
              {erreurOrdrePaiement && !ordrePaiementJoint && (
                <p role="alert" className="text-sm text-red-600 mb-3">Veuillez joindre un fichier non vide de type « Ordre de paiement » avant d'enregistrer.</p>
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
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" disabled={montantRequis && montant <= 0} onClick={enregistrer}>
          {evenement ? "Enregistrer les modifications" : "Enregistrer l'événement"}
        </button>
      </div>

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
                    setPaiementForm(f => ({ ...f, paiementRecuDe: c.nom }));
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

      {/* Popup recherche ticket SDM */}
      {popupTicket && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupTicket} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher un ticket SDM</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupTicket}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-label">Numéro</label>
                  <input className="input w-full font-mono" value={rechTicket} onChange={(e) => setRechTicket(e.target.value)} placeholder="Ex. SDM-2026-0112" autoFocus />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {ticketsFiltres.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucun ticket trouvé.</div>
              )}
              {ticketsFiltres.map((t) => {
                const sel = ticketsSel.includes(t.numero);
                return (
                  <button
                    key={t.numero}
                    type="button"
                    className={`w-full text-left px-5 py-3 transition flex items-start gap-3 ${sel ? "bg-orange-50" : "hover:bg-orange-50"}`}
                    onClick={() => toggleTicket(t.numero)}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 pointer-events-none"
                      checked={sel}
                      readOnly
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-[#0f172a] font-mono">{t.numero}</div>
                        <div className="font-mono text-[11px] text-[#64748b]">{t.montant.toLocaleString("fr-FR")} {deviseDossier}</div>
                      </div>
                      <div className="text-xs text-[#64748b]">{t.libelle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 px-5 py-3 border-t border-[#e5e8ec]">
              <div className="text-xs text-[#64748b]">
                {ticketsSel.length} ticket{ticketsSel.length > 1 ? "s" : ""} sélectionné{ticketsSel.length > 1 ? "s" : ""}
              </div>
              <button type="button" className="btn-primary" onClick={validerTickets}>
                Valider
              </button>
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
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="text-label">N° Enregistrement</label>
                  <input className="input w-full font-mono" value={rechTitre} onChange={(e) => setRechTitre(e.target.value)} placeholder="Ex. TI-2025-09703" autoFocus />
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
                    <div className="font-mono text-[11px] text-[#64748b]">{t.montantDisponible.toLocaleString("fr-FR")} {deviseDossier}</div>
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
