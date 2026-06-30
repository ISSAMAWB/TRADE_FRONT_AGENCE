"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import DossierHeader from "@/components/consultation/DossierHeader";
import InformationsGenerales from "@/components/consultation/InformationsGenerales";
import EvenementsTable from "@/components/consultation/EvenementsTable";
import EvenementDetailDrawer from "@/components/consultation/EvenementDetailDrawer";
import dossierDetail from "@/mocks/dossierDetail.json";
import type { DossierTrade, EvenementTrade } from "@/domain/consultation-detail";

export default function ConsultationDossierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const dossier = (dossierDetail as DossierTrade);

  const [selectedEvent, setSelectedEvent] = useState<EvenementTrade | null>(null);

  if (dossier.reference !== id) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Dossier introuvable. <Link href="/consultation/dossiers" className="text-brand-600">Retour à la liste</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Consultation</Link>
        <span>/</span>
        <Link href="/consultation/dossiers" className="hover:text-brand-600">Dossiers Trade</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{dossier.reference}</span>
      </div>

      <DossierHeader dossier={dossier} />
      <InformationsGenerales dossier={dossier} />
      <EvenementsTable evenements={dossier.evenements} onSelect={setSelectedEvent} />

      <EvenementDetailDrawer evenement={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
