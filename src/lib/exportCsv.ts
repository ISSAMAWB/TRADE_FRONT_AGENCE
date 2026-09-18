import { COURRIER_WORKFLOW_LABEL, PRODUIT_IRD_LABEL } from "@/domain/labels";
import type { CourrierIrd } from "@/domain/types";

export function exporterCsvDossiers(items: CourrierIrd[], nomFichier: string) {
  const lignes = [
    ["Référence", "Produit", "Client/Tiré", "Montant", "Devise", "Statut", "Date réception"],
    ...items.map(c => [
      c.reference_courrier,
      PRODUIT_IRD_LABEL[c.produit ?? "REMISE_DOCUMENTAIRE_IMPORT"],
      c.client ?? "", String(c.montant ?? ""), c.devise ?? "",
      COURRIER_WORKFLOW_LABEL[c.statut_workflow],
      new Date(c.date_reception).toLocaleDateString("fr-FR"),
    ]),
  ];
  const csv = lignes.map(r => r.map(v => `"${v}"`).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${nomFichier}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
