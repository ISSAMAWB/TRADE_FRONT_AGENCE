import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface AccuseReceptionData {
  referenceBordereau: string;
  referenceRDI: string;
  dateRemise: string;
  referenceCorrespondant: string;
  referenceOperation: string;
  nomPayeur: string;
  numeroCompteDebit: string;
  identifiantClient: string;
  typeOrdre: string;
  montantPaiement: string;
  devisePaiement: string;
  dateOrdre: string;
  dateValeur: string;
  nomBeneficiaire: string;
  nomBanqueBeneficiaire: string;
  bicBeneficiaire: string;
  referenceOrdrePaiement: string;
  ordrePaiementRecu: boolean;
  titreImportationRecu: boolean;
  autresDocuments: string[];
  nombrePieces: number;
  observations: string;
  referenceEvenement: string;
  nomPrepose: string;
  matriculePrepose: string;
  dateReception: string;
  heureReception: string;
  dateGeneration: string;
  heureGeneration: string;
  nomBanque: string;
  nomAgence: string;
  codeAgence: string;
  adresseAgence: string;
}

const MARGE = 14;
const LARGEUR = 210 - 2 * MARGE;
const ORANGE: [number, number, number] = [230, 99, 43];
const GRIS_FOND: [number, number, number] = [245, 246, 248];
const GRIS_TEXTE: [number, number, number] = [100, 116, 139];
const NOIR: [number, number, number] = [15, 23, 42];
const BORDURE: [number, number, number] = [203, 213, 225];

const vide = (v: string | undefined | null) => (v && String(v).trim() ? String(v) : "—");

async function chargerLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo-attijariwafa.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function titreSection(doc: jsPDF, y: number, titre: string): number {
  doc.setFillColor(...ORANGE);
  doc.rect(MARGE, y, LARGEUR, 6.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(titre, MARGE + 2.5, y + 4.4);
  doc.setTextColor(...NOIR);
  return y + 6.5;
}

function tableLibelleValeur(doc: jsPDF, y: number, lignes: [string, string][], titre: string): number {
  const debut = titreSection(doc, y, titre);
  autoTable(doc, {
    startY: debut,
    margin: { left: MARGE, right: MARGE },
    body: lignes.map(([l, v]) => [l, v]),
    theme: "grid",
    styles: { fontSize: 8.5, cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 }, textColor: NOIR, lineColor: BORDURE, lineWidth: 0.2, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: 62, fillColor: GRIS_FOND, fontStyle: "bold", textColor: [71, 85, 105] },
      1: { cellWidth: LARGEUR - 62 },
    },
  });
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

export async function genererAccuseReceptionPDF(d: AccuseReceptionData): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = MARGE;

  // ─── En-tête ────────────────────────────────────────────────
  const logo = await chargerLogo();
  if (logo) {
    doc.addImage(logo, "PNG", MARGE, y, 42, 14);
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...ORANGE);
    doc.text(vide(d.nomBanque).toUpperCase(), MARGE, y + 8);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...NOIR);
  doc.text("ACCUSÉ DE RÉCEPTION DE L'ORDRE DE PAIEMENT", 105, y + 5.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRIS_TEXTE);
  doc.text("Remise Documentaire Import", 105, y + 11, { align: "center" });
  doc.setTextColor(...NOIR);

  // Bloc réception à droite
  const boxY = y + 17;
  doc.setDrawColor(...BORDURE);
  doc.setLineWidth(0.25);
  doc.setFillColor(...GRIS_FOND);
  doc.roundedRect(138, boxY, 58, 16, 1, 1, "FD");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS_TEXTE);
  doc.text("Référence du bordereau", 140.5, boxY + 4);
  doc.text("Réception", 140.5, boxY + 9.5);
  doc.setTextColor(...NOIR);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(vide(d.referenceBordereau), 195.5, boxY + 4, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text(`${vide(d.dateReception)}  ${vide(d.heureReception)}`, 195.5, boxY + 9.5, { align: "right" });

  // Informations banque sous le logo
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTE);
  const banqueLignes = [
    `Établissement bancaire : ${vide(d.nomBanque)}`,
    `Agence : ${vide(d.nomAgence)}   Code agence : ${vide(d.codeAgence)}`,
    `Adresse : ${vide(d.adresseAgence)}`,
  ];
  banqueLignes.forEach((l, i) => doc.text(doc.splitTextToSize(l, 118), MARGE, boxY + 4 + i * 4));
  doc.setTextColor(...NOIR);

  y = boxY + 21;
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(MARGE, y, 210 - MARGE, y);
  y += 4;

  // ─── 1. Identification de la remise ─────────────────────────
  y = tableLibelleValeur(doc, y, [
    ["Référence de la Remise Documentaire Import", vide(d.referenceRDI)],
    ["Date de la remise", vide(d.dateRemise)],
    ["Référence du correspondant", vide(d.referenceCorrespondant)],
    ["Référence de l'opération", vide(d.referenceOperation)],
  ], "1. IDENTIFICATION DE LA REMISE") + 5;

  // ─── 2. Donneur d'ordre / payeur ────────────────────────────
  y = tableLibelleValeur(doc, y, [
    ["Nom / Raison sociale", vide(d.nomPayeur)],
    ["N° de compte à débiter", vide(d.numeroCompteDebit)],
    ["Identifiant client", vide(d.identifiantClient)],
  ], "2. IDENTIFICATION DU DONNEUR D'ORDRE / PAYEUR") + 5;

  // ─── 3. Ordre de paiement ───────────────────────────────────
  y = tableLibelleValeur(doc, y, [
    ["Type d'ordre", vide(d.typeOrdre)],
    ["Montant", `${vide(d.montantPaiement)} ${vide(d.devisePaiement)}`.trim()],
    ["Date de l'ordre", vide(d.dateOrdre)],
    ["Date de valeur souhaitée", vide(d.dateValeur)],
    ["Bénéficiaire", vide(d.nomBeneficiaire)],
    ["Banque du bénéficiaire", vide(d.nomBanqueBeneficiaire)],
    ["BIC", vide(d.bicBeneficiaire)],
    ["Référence de l'ordre", vide(d.referenceOrdrePaiement)],
  ], "3. INFORMATIONS RELATIVES À L'ORDRE DE PAIEMENT") + 5;

  // ─── 4. Pièces reçues ───────────────────────────────────────
  y = titreSection(doc, y, "4. PIÈCES REÇUES");
  const pieces: [string, boolean][] = [
    ["Ordre de paiement", d.ordrePaiementRecu],
    ["Titre d'importation", d.titreImportationRecu],
    ...d.autresDocuments.map((a): [string, boolean] => [`Autre document : ${a}`, true]),
  ];
  doc.setFillColor(255, 255, 255);
  const hauteurPieces = pieces.length * 6 + 8;
  doc.setDrawColor(...BORDURE);
  doc.rect(MARGE, y, LARGEUR, hauteurPieces, "S");
  pieces.forEach(([label, coche], i) => {
    const py = y + 3 + i * 6;
    doc.setDrawColor(...NOIR);
    doc.setLineWidth(0.3);
    doc.rect(MARGE + 3, py + 0.6, 3.6, 3.6);
    if (coche) {
      doc.line(MARGE + 3.5, py + 2.2, MARGE + 4.5, py + 3.6);
      doc.line(MARGE + 4.5, py + 3.6, MARGE + 6.2, py + 0.9);
    }
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text(label, MARGE + 9.5, py + 3.4);
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Nombre de pièces reçues : ${d.nombrePieces}`, MARGE + 3, y + hauteurPieces - 2.5);
  doc.setFont("helvetica", "normal");
  y += hauteurPieces + 5;

  // ─── 5. Accusé de réception ─────────────────────────────────
  y = titreSection(doc, y, "5. ACCUSÉ DE RÉCEPTION");
  const texteAccuse =
    "Nous accusons réception, à la date et à l'heure indiquées ci-dessus, de l'ordre de paiement remis par le client et relatif à la Remise Documentaire Import identifiée dans le présent bordereau.";
  const texteReserve =
    "Le présent document constitue un accusé de réception de l'ordre de paiement et ne vaut pas, à lui seul, confirmation de l'exécution du paiement, ni confirmation du transfert des fonds au bénéficiaire.";
  const lignesAccuse = doc.splitTextToSize(texteAccuse, LARGEUR - 8);
  const lignesReserve = doc.splitTextToSize(texteReserve, LARGEUR - 8);
  const hauteurAccuse = lignesAccuse.length * 4 + lignesReserve.length * 4 + 12;
  doc.setDrawColor(...BORDURE);
  doc.rect(MARGE, y, LARGEUR, hauteurAccuse, "S");
  doc.setFontSize(8.5);
  doc.setTextColor(...NOIR);
  doc.text(lignesAccuse, MARGE + 4, y + 6);
  const yReserve = y + 6 + lignesAccuse.length * 4 + 3.5;
  doc.setFillColor(...GRIS_FOND);
  doc.rect(MARGE + 2, yReserve - 3, LARGEUR - 4, lignesReserve.length * 4 + 4, "F");
  doc.setFont("helvetica", "bolditalic");
  doc.text(lignesReserve, MARGE + 4, yReserve);
  doc.setFont("helvetica", "normal");
  y += hauteurAccuse + 5;

  // ─── 6. Observations ────────────────────────────────────────
  y = titreSection(doc, y, "6. OBSERVATIONS / RÉSERVES");
  const lignesObs = doc.splitTextToSize(vide(d.observations) === "—" ? "" : d.observations, LARGEUR - 8);
  const hauteurObs = Math.max(18, lignesObs.length * 4 + 6);
  doc.setDrawColor(...BORDURE);
  doc.rect(MARGE, y, LARGEUR, hauteurObs, "S");
  doc.setFontSize(8.5);
  doc.setTextColor(...NOIR);
  if (lignesObs.length) doc.text(lignesObs, MARGE + 4, y + 5);
  y += hauteurObs + 5;

  // ─── Signatures ─────────────────────────────────────────────
  const largBloc = (LARGEUR - 6) / 2;
  const hauteurBloc = 38;
  const dessinerBlocSignature = (x: number, titre: string, lignes: [string, string][]) => {
    doc.setDrawColor(...BORDURE);
    doc.rect(x, y, largBloc, hauteurBloc, "S");
    doc.setFillColor(...GRIS_FOND);
    doc.rect(x, y, largBloc, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...NOIR);
    doc.text(titre, x + largBloc / 2, y + 4.2, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let ly = y + 11;
    lignes.forEach(([label, val]) => {
      doc.setTextColor(...GRIS_TEXTE);
      doc.text(label, x + 3, ly);
      doc.setTextColor(...NOIR);
      doc.text(vide(val), x + 40, ly);
      ly += 5;
    });
    doc.setTextColor(...GRIS_TEXTE);
    doc.text("Signature :", x + 3, ly + 2);
    doc.setDrawColor(...NOIR);
    doc.line(x + 3, y + hauteurBloc - 7, x + largBloc - 3, y + hauteurBloc - 7);
    doc.text("Date :      ____ / ____ / ______", x + 3, y + hauteurBloc - 2.5);
  };
  dessinerBlocSignature(MARGE, "POUR LE CLIENT / DONNEUR D'ORDRE", [["Nom et prénom :", ""]]);
  dessinerBlocSignature(MARGE + largBloc + 6, "POUR LA BANQUE", [
    ["Préposé au poste :", vide(d.nomPrepose)],
    ["Matricule :", vide(d.matriculePrepose)],
  ]);
  y += hauteurBloc + 8;

  // ─── Pied de page ───────────────────────────────────────────
  doc.setDrawColor(...BORDURE);
  doc.setLineWidth(0.3);
  doc.line(MARGE, 283, 210 - MARGE, 283);
  doc.setFontSize(7);
  doc.setTextColor(...GRIS_TEXTE);
  doc.text("Document généré automatiquement par le système", MARGE, 287);
  doc.text(`Référence de l'évènement : ${vide(d.referenceEvenement)}`, MARGE, 290.5);
  doc.text(`Généré le ${vide(d.dateGeneration)} à ${vide(d.heureGeneration)}`, MARGE, 294);
  doc.text("Page 1 / 1", 210 - MARGE, 294, { align: "right" });

  doc.save(`accuse_reception_${d.referenceEvenement || "ordre_paiement"}.pdf`);
}
