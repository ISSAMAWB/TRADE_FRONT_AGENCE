"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import DetailDossier from "@/components/consultation/DetailDossier";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import type { DossierTrade } from "@/domain/consultation-detail";
import Shell from "@/components/Shell";
import CollapsibleFilterPanel from "@/components/ui/CollapsibleFilterPanel";

export default function ConsultationDossierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const dossiers = dossiersDetail as DossierTrade[];
  const dossier = dossiers.find((d) => d.reference === id);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [evenement, setEvenement] = useState("");
  const [montantMin, setMontantMin] = useState("");
  const [montantMax, setMontantMax] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const EVENEMENTS = [
    "Création",
    "Modification",
    "Réception document avec réserve",
    "Acceptation/Refus des documents",
    "Paiement à vue",
    "Paiement à échéance",
    "Correspondance",
    "Gestion des frais et commission",
    "Annulation",
    "Expiration",
  ];

  function resetFilters() {
    setEvenement("");
    setMontantMin("");
    setMontantMax("");
    setDateDebut("");
    setDateFin("");
  }

  if (!dossier) {
    return (
      <Shell>
        <div className="card p-10 text-center text-gray-400">
          Dossier introuvable. <Link href="/consultation/dossiers" className="text-orange-600">Retour à la liste</Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      showFilterButton={true}
      onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
      isFilterOpen={isFilterOpen}
    >
      <CollapsibleFilterPanel
        isOpen={isFilterOpen}
        onSearch={() => {}}
        onReset={resetFilters}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-label">ÉVÉNEMENT</label>
            <select
              className="input w-full"
              value={evenement}
              onChange={(e) => setEvenement(e.target.value)}
            >
              <option value="">Tous les événements</option>
              {EVENEMENTS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-label">MONTANT MIN</label>
            <input
              type="number"
              value={montantMin}
              onChange={(e) => setMontantMin(e.target.value)}
              placeholder="Min"
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-label">MONTANT MAX</label>
            <input
              type="number"
              value={montantMax}
              onChange={(e) => setMontantMax(e.target.value)}
              placeholder="Max"
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-label">DATE DÉBUT</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-label">DATE FIN</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="input w-full"
            />
          </div>
        </div>
      </CollapsibleFilterPanel>
      <DetailDossier dossier={dossier} />
    </Shell>
  );
}
