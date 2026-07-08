import type { StatutDossier, StatutEvenement } from "@/domain/consultation-detail";

const STATUS_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  VALIDE: { label: "Validé", bg: "#E1F5EE", color: "#0F6E56" },
  EN_COURS: { label: "En cours", bg: "#E6F1FB", color: "#0C447C" },
  EN_ATTENTE: { label: "En attente", bg: "#FAEEDA", color: "#854F0B" },
  REJETE: { label: "Rejeté", bg: "#FCEBEB", color: "#A32D2D" },
};

export default function StatutBadge({ statut }: { statut: StatutDossier | StatutEvenement }) {
  const style = STATUS_STYLES[statut] ?? { label: statut, bg: "#F1EFE8", color: "#5F5E5A" };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium"
      style={{ background: style.bg, color: style.color, borderRadius: 20 }}
    >
      {style.label}
    </span>
  );
}
