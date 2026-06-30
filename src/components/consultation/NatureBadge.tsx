import NatureIcon from "./NatureIcon";
import { NATURE_SCHEMAS } from "@/lib/natures";
import type { NatureEvenement } from "@/domain/consultation-detail";

export default function NatureBadge({ nature }: { nature: NatureEvenement }) {
  const schema = NATURE_SCHEMAS[nature];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-800">
      <NatureIcon nature={nature} size={16} />
      {schema?.libelle ?? nature}
    </span>
  );
}
