"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell } from "lucide-react";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier } from "@/domain/consultation";
import Shell from "@/components/Shell";
import Card from "@/components/ui/Card";

export default function AlertesPage() {
  const dossiers = dossiersData as Dossier[];
  const today = new Date();

  const { urgences, attention, aSurveiller } = useMemo(() => {
    const u: any[] = [];
    const a: any[] = [];
    const s: any[] = [];
    dossiers.forEach((d) => {
      const echeance = new Date(d.dateEcheance);
      const diff = Math.ceil((echeance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const alert = {
        dossierId: d.id,
        clientNom: d.client.nom,
        produit: d.produit,
        nature: d.statut === "Expiré" ? "Échéance dépassée" : "Échéance imminente",
        dateLimite: d.dateEcheance,
        diff,
      };
      if (diff < 0 || diff <= 3) u.push(alert);
      else if (diff <= 7) a.push(alert);
      else if (diff <= 30) s.push(alert);
    });
    return { urgences: u, attention: a, aSurveiller: s };
  }, [dossiers, today]);

  return (
    <Shell>
      <div className="space-y-6">
        <h1 className="text-display flex items-center gap-2">
          <Bell className="text-orange-500" size={24} /> Alertes & échéances
        </h1>

        <div className="space-y-4">
          <AlertSection title="Urgences" alertes={urgences} color="red" />
          <AlertSection title="Attention" alertes={attention} color="orange" />
          <AlertSection title="À surveiller" alertes={aSurveiller} color="blue" />
        </div>

        {urgences.length === 0 && attention.length === 0 && aSurveiller.length === 0 && (
          <Card className="p-8 text-center text-gray-400">Aucune alerte à afficher.</Card>
        )}
      </div>
    </Shell>
  );
}

function AlertSection({
  title,
  alertes,
  color,
}: {
  title: string;
  alertes: any[];
  color: "red" | "orange" | "blue";
}) {
  const colorMap = {
    red: { border: "border-red-300", bg: "bg-red-50" },
    orange: { border: "border-orange-300", bg: "bg-orange-50" },
    blue: { border: "border-blue-300", bg: "bg-blue-50" },
  };
  if (alertes.length === 0) return null;
  const c = colorMap[color];

  return (
    <Card className={`p-4 ${c.bg} ${c.border}`}>
      <h2 className="text-title mb-4">{title} ({alertes.length})</h2>
      <div className="space-y-2">
        {alertes.map((a, idx) => (
          <div key={idx} className="bg-white border border-gray-300 rounded-lg p-3 flex items-center gap-4">
            <div>
              <Link href={`/consultation/dossiers/${a.dossierId}`} className="font-medium hover:underline text-orange-500">
                {a.dossierId}
              </Link>
              <div className="text-sm text-gray-600">{a.clientNom}</div>
            </div>
            <span className="badge-produit">{a.produit}</span>
            <div className="text-sm text-gray-600">{a.nature}</div>
            <div className="text-sm font-medium text-gray-900 ml-auto">
              {new Date(a.dateLimite).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
