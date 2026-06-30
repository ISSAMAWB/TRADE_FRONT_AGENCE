import StatutBadge from "./StatutBadge";
import type { EvenementTrade, StatutEvenement, FormatChamp } from "@/domain/consultation-detail";
import { getNatureSchema } from "@/lib/natures";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={"min-w-0"}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1 truncate">{label}</div>
      <div className="text-sm font-medium text-ink-800">{value ?? <span className="text-ink-300">—</span>}</div>
    </div>
  );
}

function formatValue(value: string | number | null | undefined, format?: FormatChamp, devise?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") return null;

  switch (format) {
    case "montant":
      if (typeof value === "number") return value.toLocaleString("fr-FR") + (devise ? ` ${devise}` : "");
      return value + (devise ? ` ${devise}` : "");
    case "date":
    case "datetime": {
      const d = new Date(value as string | number);
      if (isNaN(d.getTime())) return String(value);
      return format === "datetime" ? d.toLocaleString("fr-FR") : d.toLocaleDateString("fr-FR");
    }
    case "badge":
      return <StatutBadge statut={value as StatutEvenement} />;
    default:
      return String(value);
  }
}

export default function DetailsOperationBloc({ event }: { event: EvenementTrade }) {
  const schema = getNatureSchema(event.nature);

  if (!schema) {
    return (
      <div className="bg-ink-50 rounded-lg p-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Détails de l'opération</div>
        <div className="text-sm text-ink-500">Détail non spécifié pour cette nature.</div>
      </div>
    );
  }

  return (
    <div className="bg-ink-50 rounded-lg p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-4">Détails de l'opération</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {schema.champsOperation.map((champ) => {
          const raw = event.detailsOperation[champ.cle];
          const isModification = event.nature === "MODIFICATION" && (champ.cle === "valeurAvant" || champ.cle === "valeurApres");
          const value = formatValue(raw, champ.format, event.devise);
          return (
            <div
              key={champ.cle}
              className={champ.pleineLargeur ? "col-span-full" : ""}
            >
              <Field label={champ.label} value={
                isModification ? (
                  <span className={champ.cle === "valeurAvant" ? "line-through text-ink-400" : "text-ink-800 font-semibold"}>
                    {value}
                  </span>
                ) : value
              } />
            </div>
          );
        })}
      </div>
    </div>
  );
}
