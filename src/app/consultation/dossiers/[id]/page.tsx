import dossiersDetail from "@/mocks/dossiersDetail.json";
import type { DossierTrade } from "@/domain/consultation-detail";
import DossierDetailClient from "./DossierDetailClient";

export function generateStaticParams() {
  const dossiers = dossiersDetail as DossierTrade[];
  return dossiers.map((d) => ({ id: d.reference }));
}

export default function ConsultationDossierDetailPage({ params }: { params: { id: string } }) {
  const dossiers = dossiersDetail as DossierTrade[];
  const dossier = dossiers.find((d) => d.reference === params.id) || null;

  return <DossierDetailClient dossier={dossier} />;
}
