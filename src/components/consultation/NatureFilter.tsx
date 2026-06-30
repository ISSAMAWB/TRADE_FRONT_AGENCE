"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import NatureIcon from "./NatureIcon";
import { NATURE_SCHEMAS } from "@/lib/natures";
import type { NatureEvenement } from "@/domain/consultation-detail";

export default function NatureFilter({
  natures,
  selected,
  onChange,
}: {
  natures: NatureEvenement[];
  selected: NatureEvenement[];
  onChange: (selected: NatureEvenement[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const counts = natures.reduce<Record<string, number>>((acc, n) => {
    acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {});

  const uniqueNatures = Array.from(new Set(natures));

  function toggle(nature: NatureEvenement) {
    if (selected.includes(nature)) {
      onChange(selected.filter((s) => s !== nature));
    } else {
      onChange([...selected, nature]);
    }
  }

  function reset() {
    onChange([]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-ink-200 rounded-lg hover:border-[#E8590C] transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        Nature {selected.length > 0 && <span className="bg-[#E8590C] text-white text-[10px] px-1.5 rounded-full">{selected.length}</span>}
        <ChevronDown size={14} className="text-ink-500" />
      </button>

      {open && (
        <div className="absolute z-10 mt-1 bg-white border border-ink-200 rounded-lg shadow-lg min-w-[240px] p-2" role="listbox">
          {uniqueNatures.map((nature) => {
            const schema = NATURE_SCHEMAS[nature];
            const checked = selected.includes(nature);
            return (
              <div
                key={nature}
                role="option"
                aria-selected={checked}
                onClick={() => toggle(nature)}
                className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-ink-50 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <NatureIcon nature={nature} size={14} />
                  {schema?.libelle ?? nature}
                  <span className="text-xs text-ink-500">({counts[nature]})</span>
                </span>
                {checked && <Check size={14} className="text-[#E8590C]" />}
              </div>
            );
          })}

          {selected.length > 0 && (
            <button
              onClick={reset}
              className="w-full mt-2 text-xs text-[#E8590C] hover:underline text-left px-2 py-1"
            >
              Réinitialiser
            </button>
          )}
        </div>
      )}
    </div>
  );
}
