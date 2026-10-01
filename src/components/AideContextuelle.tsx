"use client";

import { useState, type ReactNode } from "react";
import {
  BookOpen, ChevronLeft, ChevronRight, CircleAlert, HelpCircle, Lightbulb, ListOrdered, LogIn,
} from "lucide-react";
import clsx from "clsx";

export interface AideContextuelleProps {
  /** Paragraphe d'introduction (définition de l'opération). */
  intro: ReactNode;
  /** Puces de la section « Point d'entrée ». */
  pointsEntree: ReactNode[];
  /** Étapes numérotées « Actions à entreprendre ». */
  actions: ReactNode[];
  /** Puces « Règles importantes » (encadré rouge). */
  regles: ReactNode[];
  /** Puces « Conseils opérationnels » (encadré ambre). */
  conseils: ReactNode[];
  /** Texte « Procédure de référence ». */
  procedure: string;
}

/* Panneau latéral d'aide : replié par défaut en bande verticale, se déplie en largeur,
   reste visible au défilement (sticky) sur grand écran. */
export default function AideContextuelle({ intro, pointsEntree, actions, regles, conseils, procedure }: AideContextuelleProps) {
  const [replie, setReplie] = useState(true);
  return (
    <aside
      className={clsx(
        "card overflow-hidden shrink-0 transition-[width] duration-300 xl:sticky xl:top-4",
        replie ? "xl:w-11" : "w-full xl:w-[320px] xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
      )}
    >
      {replie ? (
        <button
          type="button"
          onClick={() => setReplie(false)}
          aria-expanded={false}
          title="Afficher l'aide contextuelle"
          className="w-full h-full min-h-[120px] bg-[#0f172a] text-white flex flex-col items-center justify-center gap-3 py-4 hover:bg-[#1e293b] transition"
        >
          <HelpCircle size={16} className="text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            Aide contextuelle
          </span>
          <ChevronLeft size={14} className="text-gray-400" />
        </button>
      ) : (
        <>
          <div className="px-4 py-3 bg-[#0f172a] text-white flex items-center gap-2">
            <HelpCircle size={15} className="text-orange-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider flex-1 whitespace-nowrap overflow-hidden">Aide contextuelle</span>
            <button
              type="button"
              onClick={() => setReplie(true)}
              aria-expanded={true}
              title="Replier l'aide"
              className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
            >
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="p-4 space-y-5 text-[13px] text-[#334155]">
            <div className="leading-relaxed text-[#475569]">{intro}</div>

            <section>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
                <LogIn size={13} className="text-orange-500" /> Point d'entrée
              </div>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-orange-400">
                {pointsEntree.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </section>

            <section>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
                <ListOrdered size={13} className="text-orange-500" /> Actions à entreprendre
              </div>
              <ol className="space-y-1.5 pl-4 list-decimal marker:font-semibold marker:text-orange-500">
                {actions.map((a, i) => <li key={i}>{a}</li>)}
              </ol>
            </section>

            <section className="rounded-lg bg-red-50/70 border border-red-100 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-700 mb-2">
                <CircleAlert size={13} /> Règles importantes
              </div>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-red-400">
                {regles.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </section>

            <section className="rounded-lg bg-amber-50/70 border border-amber-100 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                <Lightbulb size={13} /> Conseils opérationnels
              </div>
              <ul className="space-y-1.5 pl-4 list-disc marker:text-amber-400">
                {conseils.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </section>

            <section className="border-t border-gray-200 pt-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                <BookOpen size={13} /> Procédure de référence
              </div>
              <p className="text-xs text-[#64748b]">{procedure}</p>
            </section>
          </div>
        </>
      )}
    </aside>
  );
}
