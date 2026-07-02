"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import DetailDossier from "@/components/consultation/DetailDossier";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import type { DossierTrade } from "@/domain/consultation-detail";
import Shell from "@/components/Shell";

export default function ConsultationDossierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const dossiers = dossiersDetail as DossierTrade[];
  const dossier = dossiers.find((d) => d.reference === id);

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
    <Shell>
      <DetailDossier dossier={dossier} />
    </Shell>
  );
}
