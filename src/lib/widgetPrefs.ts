"use client";

/* ---------- Registre des widgets du pilotage ---------- */
export type WidgetW = 4 | 6 | 8 | 12;
export type WidgetH = 1 | 2;
export interface WidgetTaille { w: WidgetW; h: WidgetH }

export interface WidgetDef {
  id: string;
  titre: string;
  zone: "transverse" | "produit" | "flottant";
  /** Taille par défaut en cellules de la grille 12 colonnes (absent pour le widget flottant). */
  taille?: WidgetTaille;
  placeholder?: boolean;
}

/* L'ordre du registre définit l'ordre d'affichage par défaut (defaultWidgetPrefs).
   Rendu par défaut : L1-2 = atraiter(8×2, file de travail) | rail droit 4 colonnes
   = alertes(4×1) + echeances(4×1) ; L3 = activite(8) + delais-traitement(4). */
export const WIDGETS: WidgetDef[] = [
  { id: "atraiter",          titre: "À traiter",                        zone: "transverse", taille: { w: 8, h: 2 } },
  { id: "alertes",           titre: "Alertes opérationnelles",          zone: "transverse", taille: { w: 4, h: 1 } },
  { id: "echeances",         titre: "Échéances · 10 prochains jours",   zone: "transverse", taille: { w: 4, h: 1 } },
  { id: "activite",          titre: "Activité récente",                 zone: "transverse", taille: { w: 8, h: 1 } },
  { id: "delais-traitement", titre: "Délais moyens de traitement",      zone: "transverse", taille: { w: 4, h: 1 }, placeholder: true },
  { id: "acces",             titre: "Accès rapides",                    zone: "flottant" },
  { id: "anciennete",        titre: "Ancienneté des remises",           zone: "produit",    taille: { w: 6, h: 1 } },
  { id: "suivi-qualite",     titre: "Qualité documentaire",             zone: "produit",    taille: { w: 6, h: 1 }, placeholder: true },
];

export interface WidgetPrefs {
  /** ids des widgets transverses dans l'ordre d'affichage */
  order: string[];
  /** ids des widgets produit dans l'ordre d'affichage */
  orderProduit: string[];
  /** ids masqués */
  masques: string[];
  /** id -> replié */
  replie: Record<string, boolean>;
  /** surcharges utilisateur de taille (vide par défaut) */
  tailles: Record<string, WidgetTaille>;
}

const STORAGE_KEY = "borj-pilotage-widgets-v3";

const IDS_TRANSVERSE = WIDGETS.filter(w => w.zone === "transverse").map(w => w.id);
const IDS_PRODUIT = WIDGETS.filter(w => w.zone === "produit").map(w => w.id);
const IDS_CONNUS = new Set(WIDGETS.map(w => w.id));

const WS = new Set<number>([4, 6, 8, 12]);
const HS = new Set<number>([1, 2]);

export function defaultWidgetPrefs(): WidgetPrefs {
  return {
    order: [...IDS_TRANSVERSE],
    orderProduit: [...IDS_PRODUIT],
    masques: [],
    replie: {},
    tailles: {},
  };
}

/** Taille effective d'un widget : surcharge utilisateur, sinon défaut du registre. */
export function tailleDe(id: string, prefs: WidgetPrefs): WidgetTaille {
  const over = prefs.tailles[id];
  if (over) return over;
  return WIDGETS.find(w => w.id === id)?.taille ?? { w: 6, h: 1 };
}

/* Ordre stocké : ids inconnus ignorés, ids nouveaux (absents du stockage) ajoutés en fin */
function sanitizeOrder(saved: unknown, idsZone: string[]): string[] {
  const arr = Array.isArray(saved)
    ? saved.filter((x): x is string => typeof x === "string" && idsZone.includes(x))
    : [];
  for (const id of idsZone) if (!arr.includes(id)) arr.push(id);
  return arr;
}

export function loadWidgetPrefs(): WidgetPrefs {
  const def = defaultWidgetPrefs();
  if (typeof window === "undefined") return def;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return def;
    const parsed = JSON.parse(raw) as Partial<WidgetPrefs> | null;
    if (!parsed || typeof parsed !== "object") return def;

    const masques = Array.isArray(parsed.masques)
      ? parsed.masques.filter((x): x is string => typeof x === "string" && IDS_CONNUS.has(x))
      : [];

    const replie: Record<string, boolean> = {};
    if (parsed.replie && typeof parsed.replie === "object") {
      for (const [k, v] of Object.entries(parsed.replie)) {
        if (IDS_CONNUS.has(k) && typeof v === "boolean") replie[k] = v;
      }
    }

    const tailles: Record<string, WidgetTaille> = {};
    if (parsed.tailles && typeof parsed.tailles === "object") {
      for (const [k, v] of Object.entries(parsed.tailles)) {
        if (!IDS_CONNUS.has(k) || !v || typeof v !== "object") continue;
        const { w, h } = v as { w?: unknown; h?: unknown };
        if (typeof w === "number" && typeof h === "number" && WS.has(w) && HS.has(h)) {
          tailles[k] = { w: w as WidgetW, h: h as WidgetH };
        }
      }
    }

    return {
      order: sanitizeOrder(parsed.order, IDS_TRANSVERSE),
      orderProduit: sanitizeOrder(parsed.orderProduit, IDS_PRODUIT),
      masques,
      replie,
      tailles,
    };
  } catch {
    return def;
  }
}

export function saveWidgetPrefs(p: WidgetPrefs): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* quota dépassé / navigation privée : on ignore */
  }
}

export function resetWidgetPrefs(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
