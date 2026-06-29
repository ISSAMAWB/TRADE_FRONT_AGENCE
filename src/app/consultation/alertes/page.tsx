"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bell } from "lucide-react";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier } from "@/domain/consultation";

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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Tableau de bord</Link>
        <span>/</span>
        <Link href="/consultation/dossiers" className="hover:text-brand-600">Consultation</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">Alertes & échéances</span>
      </div>

      <h1 className="text-xl font-semibold flex items-center gap-2">
        <Bell className="text-brand-500" size={20} /> Alertes & échéances
      </h1>

      <div className="space-y-4">
        <AlertSection title="Urgences" alertes={urgences} color="red" />
        <AlertSection title="Attention" alertes={attention} color="orange" />
        <AlertSection title="À surveiller" alertes={aSurveiller} color="blue" />
      </div>

      {urgences.length === 0 && attention.length === 0 && aSurveiller.length === 0 && (
        <div className="card p-8 text-center text-ink-500">Aucune alerte à afficher.</div>
      )}
    </div>
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
    red: { border: "#F5A0A0", bg: "#FCEBEB" },
    orange: { border: "#F5C7A0", bg: "#FDF0E8" },
    blue: { border: "#A0C5F5", bg: "#E6F1FB" },
  };
  if (alertes.length === 0) return null;
  const c = colorMap[color];

  return (
    <div className="rounded-lg p-4 border" style={{ borderColor: c.border, background: c.bg }}>
      <h2 className="text-lg font-semibold text-ink-900 mb-4">{title} ({alertes.length})</h2>
      <div className="space-y-2">
        {alertes.map((a, idx) => (
          <div key={idx} className="bg-white border border-[#E5E7EB] rounded-md p-3 flex items-center gap-4" style={{ borderRadius: 8 }}>
            <div>
              <Link href={`/consultation/dossiers/${a.dossierId}`} className="font-medium hover:underline" style={{ color: "#E8722A" }}>
                {a.dossierId}
              </Link>
              <div className="text-sm text-ink-600">{a.clientNom}</div>
            </div>
            <span className="badge-produit">{a.produit}</span>
            <div className="text-sm text-ink-600">{a.nature}</div>
            <div className="text-sm font-medium text-ink-900 ml-auto">
              {new Date(a.dateLimite).toLocaleDateString("fr-FR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
