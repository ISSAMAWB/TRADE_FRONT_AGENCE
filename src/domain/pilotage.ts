/* ============================================================
   Pilotage agence — règles métier transverses (prototype V1)
   Référentiel dates :
   - J0 = date de réception des documents en Agence (date_reception)
   - Échéances : à venir J-10 → J0, échue < 45 j, sortie ≥ J+45
   ============================================================ */

import type { CourrierIrd, BandeRemise, EtatEcheanceV5 } from "./types";

const MS_JOUR = 86400000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Jours entiers entre une date ISO et aujourd'hui (date passée → positif). */
export function joursDepuis(dateIso?: string): number | null {
  if (!dateIso) return null;
  return Math.round((startOfDay(new Date()).getTime() - startOfDay(new Date(dateIso)).getTime()) / MS_JOUR);
}

/** Jours signés vs échéance : négatif = à venir (J-n), 0 = J0, positif = échu (J+n). */
export function joursEcheance(c: CourrierIrd): number | null {
  if (!c.date_echeance) return null;
  return Math.round((startOfDay(new Date(c.date_echeance)).getTime() - startOfDay(new Date()).getTime()) / MS_JOUR) * -1;
}

/* ---------- Remise non effectuée (bandes disjointes) ---------- */

export function bandeRemise(c: CourrierIrd): BandeRemise | null {
  if (!c.date_reception || c.remise_effectuee || c.retour_documents_effectue) return null;
  const j = joursDepuis(c.date_reception);
  if (j == null) return null;
  if (j >= 30) return "RETOUR_DOCS";
  if (j >= 20) return "RELANCE";
  return "SURVEILLANCE";
}

export function remiseARelancer(c: CourrierIrd): boolean {
  return bandeRemise(c) === "RELANCE";
}

export function retourDocumentsAFaire(c: CourrierIrd): boolean {
  return bandeRemise(c) === "RETOUR_DOCS";
}

/* ---------- Échéances ---------- */

export function etatEcheanceV5(c: CourrierIrd): EtatEcheanceV5 | null {
  const j = joursEcheance(c);
  if (j == null) return null;
  if (j >= 45) return "HORS_INDICATEUR";
  if (j > 0) return "ECHUE";
  if (j >= -10) return "A_VENIR"; // J-10 → J0
  return null; // au-delà de J-10 : pas encore visible
}

export function echeanceASuivre(c: CourrierIrd): boolean {
  const e = etatEcheanceV5(c);
  return e === "A_VENIR" || e === "ECHUE";
}

/** Libellé en clair : « Échéance dans N jours » / « J0 » / « Échu depuis N jours ». */
export function libelleEcheance(c: CourrierIrd): string | null {
  const j = joursEcheance(c);
  if (j == null) return null;
  if (j > 0) return `Échu depuis ${j} jour${j > 1 ? "s" : ""}`;
  if (j === 0) return "Échéance aujourd'hui";
  return `Échéance dans ${-j} jour${j < -1 ? "s" : ""}`;
}

/** Badge compact J-n / J0 / J+n. */
export function badgeEcheance(c: CourrierIrd): string | null {
  const j = joursEcheance(c);
  if (j == null) return null;
  if (j > 0) return `J+${j}`;
  if (j === 0) return "J0";
  return `J${j}`; // j < 0 → "J-3"
}

/* ---------- Réception agence ---------- */

export function envoyeCtnNonRecu(c: CourrierIrd): boolean {
  return !!c.date_envoi_ctn && !c.date_reception_agence_ctn;
}

/* ---------- Relances ---------- */

export function acceptationARelancer(c: CourrierIrd): boolean {
  if (c.modalite !== "CONTRE_ACCEPTATION" || c.acceptation_enregistree) return false;
  const j = joursEcheance(c);
  return j != null && j >= -10; // échéance à ≤ 10 jours
}

/* ---------- Agrégats pilotage ---------- */

export function estATraiter(c: CourrierIrd): boolean {
  return (
    c.statut_workflow === "RETOUR_AGENCE" ||
    c.statut_workflow === "RETOUR_CTN" ||
    c.statut_workflow === "EN_CORRECTION" ||
    retourDocumentsAFaire(c)
  );
}

export function estARelancer(c: CourrierIrd): boolean {
  return remiseARelancer(c) || acceptationARelancer(c);
}

export function nbAlertes(courriers: CourrierIrd[]): number {
  return courriers.filter(c =>
    envoyeCtnNonRecu(c) || retourDocumentsAFaire(c) || etatEcheanceV5(c) === "ECHUE"
  ).length;
}

/* ---------- Contexte métier d'une ligne de liste ---------- */

export function contexteMetier(c: CourrierIrd): string | null {
  if (envoyeCtnNonRecu(c)) {
    const j = joursDepuis(c.date_envoi_ctn);
    return `Envoyé par le CTN le ${new Date(c.date_envoi_ctn!).toLocaleDateString("fr-FR")} · non reçu depuis ${j} j`;
  }
  const bande = bandeRemise(c);
  if (bande === "RETOUR_DOCS" || bande === "RELANCE") {
    const j = joursDepuis(c.date_reception);
    return `Documents reçus le ${new Date(c.date_reception).toLocaleDateString("fr-FR")} · J+${j}`;
  }
  if (c.dernier_retour) return c.dernier_retour.commentaire ?? null;
  const lib = libelleEcheance(c);
  return lib;
}

/* ---------- Filtres transverses (query params) ---------- */

export type FiltresListe = Record<string, string | undefined>;

export function filtrerDossiers(items: CourrierIrd[], p: FiltresListe): CourrierIrd[] {
  let out = items;
  const q = p.q?.trim().toLowerCase();
  if (q) {
    out = out.filter(c =>
      c.reference_courrier.toLowerCase().includes(q) ||
      (c.reference_interne ?? "").toLowerCase().includes(q) ||
      (c.reference_externe ?? "").toLowerCase().includes(q) ||
      (c.client ?? "").toLowerCase().includes(q)
    );
  }
  if (p.ref?.trim()) out = out.filter(c => c.reference_courrier.toLowerCase().includes(p.ref!.trim().toLowerCase()));
  if (p.ref_interne?.trim()) out = out.filter(c => (c.reference_interne ?? "").toLowerCase().includes(p.ref_interne!.trim().toLowerCase()));
  if (p.ref_externe?.trim()) out = out.filter(c => (c.reference_externe ?? "").toLowerCase().includes(p.ref_externe!.trim().toLowerCase()));
  if (p.client?.trim()) out = out.filter(c => (c.client ?? "").toLowerCase().includes(p.client!.trim().toLowerCase()));
  if (p.statut) {
    const statuts = p.statut.split(",").filter(Boolean);
    if (statuts.length) out = out.filter(c => statuts.includes(c.statut_workflow));
  }
  if (p.devise) out = out.filter(c => c.devise === p.devise);
  if (p.montant_min) out = out.filter(c => (c.montant ?? 0) >= parseFloat(p.montant_min!));
  if (p.montant_max) out = out.filter(c => (c.montant ?? 0) <= parseFloat(p.montant_max!));
  if (p.date_debut) out = out.filter(c => new Date(c.date_reception) >= new Date(p.date_debut!));
  if (p.date_fin) out = out.filter(c => new Date(c.date_reception) <= new Date(p.date_fin! + "T23:59:59"));
  if (p.agence) out = out.filter(c => c.agence_reception === p.agence);
  if (p.type_retour) out = out.filter(c => c.retours.some(r => r.type_retour === p.type_retour));
  if (p.modalite) out = out.filter(c => c.modalite === p.modalite);
  if (p.statut_paiement) out = out.filter(c => c.statut_paiement === p.statut_paiement);
  if (p.etat_echeance) {
    out = out.filter(c => {
      const e = etatEcheanceV5(c);
      if (p.etat_echeance === "ECHUE") return e === "ECHUE" || e === "HORS_INDICATEUR";
      return e === p.etat_echeance;
    });
  }
  if (p.echeance_du) out = out.filter(c => c.date_echeance && new Date(c.date_echeance) >= new Date(p.echeance_du!));
  if (p.echeance_au) out = out.filter(c => c.date_echeance && new Date(c.date_echeance) <= new Date(p.echeance_au! + "T23:59:59"));
  if (p.derniere_action) out = out.filter(c => new Date(c.updated_at) >= new Date(p.derniere_action!));
  return out;
}

/* ---------- Définitions des listes métier ---------- */

export interface ListeDef {
  titre: string;
  regle: string;
  filter: (c: CourrierIrd) => boolean;
}

export const LISTES: Record<string, ListeDef> = {
  "toutes": {
    titre: "À traiter",
    regle: "Dossiers nécessitant une action du préposé agence : retours Agence et CTN à corriger, retours documents à effectuer (documents reçus depuis ≥ 30 jours, remise non effectuée).",
    filter: estATraiter,
  },
  "retours-agence": {
    titre: "Retours Agence à corriger",
    regle: "Retour émis par le Responsable Agence — dossier à corriger puis à soumettre à nouveau.",
    filter: c => c.statut_workflow === "RETOUR_AGENCE" || (c.statut_workflow === "EN_CORRECTION" && c.dernier_retour?.type_retour === "RETOUR_AGENCE"),
  },
  "retours-ctn": {
    titre: "Retours CTN à corriger",
    regle: "Retour émis par le CTN Devise — dossier à corriger puis à soumettre à nouveau.",
    filter: c => c.statut_workflow === "RETOUR_CTN" || (c.statut_workflow === "EN_CORRECTION" && c.dernier_retour?.type_retour === "RETOUR_CTN"),
  },
  "retour-docs": {
    titre: "Retours documents à effectuer",
    regle: "Documents reçus en agence depuis ≥ 30 jours, remise non effectuée — retourner les documents.",
    filter: retourDocumentsAFaire,
  },
  "relance-remise": {
    titre: "Remises à relancer (J+20)",
    regle: "Documents reçus en agence depuis 20 à 29 jours, remise non effectuée — relancer le client.",
    filter: remiseARelancer,
  },
  "relance-acceptation": {
    titre: "Acceptations à relancer (J-10)",
    regle: "Échéance à ≤ 10 jours et acceptation non enregistrée — relancer le client.",
    filter: acceptationARelancer,
  },
  "relances": {
    titre: "Relances à effectuer",
    regle: "Remises non effectuées depuis 20 à 29 jours + acceptations à relancer (échéance ≤ 10 j, acceptation non enregistrée).",
    filter: estARelancer,
  },
  "ctn-non-recus": {
    titre: "Envoyés par CTN non reçus en Agence",
    regle: "Date d'envoi CTN renseignée et date de réception Agence absente.",
    filter: envoyeCtnNonRecu,
  },
  "surveillance": {
    titre: "Remises < 20 j (avant relance)",
    regle: "Documents reçus en agence depuis moins de 20 jours, remise non effectuée — sous surveillance.",
    filter: c => bandeRemise(c) === "SURVEILLANCE",
  },
  "ech-venir": {
    titre: "Échéances à venir ≤ 10 jours",
    regle: "Échéance dans les 10 prochains jours (J-10 → J0).",
    filter: c => etatEcheanceV5(c) === "A_VENIR",
  },
  "ech-echues": {
    titre: "Échéances échues < 45 jours",
    regle: "Échéance dépassée depuis moins de 45 jours.",
    filter: c => etatEcheanceV5(c) === "ECHUE",
  },
  "ech-toutes": {
    titre: "Échéancier complet",
    regle: "Échéances à venir ≤ 10 jours + échéances échues < 45 jours.",
    filter: echeanceASuivre,
  },
  "alertes": {
    titre: "Alertes opérationnelles",
    regle: "Envoyés CTN non reçus en agence + remises en souffrance ≥ 30 j + échéances échues < 45 jours.",
    filter: c => envoyeCtnNonRecu(c) || retourDocumentsAFaire(c) || etatEcheanceV5(c) === "ECHUE",
  },
  "en-cours": {
    titre: "Dossiers en cours",
    regle: "Tous les dossiers de l'agence.",
    filter: () => true,
  },
};
