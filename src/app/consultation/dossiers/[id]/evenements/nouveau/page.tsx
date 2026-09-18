"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/ui/Card";
import EvenementSaisieForm from "@/components/consultation/EvenementSaisieForm";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import { useTomStore } from "@/store/useTomStore";
import type { DossierTrade } from "@/domain/consultation-detail";

function SaisieEvenementInner() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = params?.id as string;

  const dossiers = dossiersDetail as DossierTrade[];
  const dossier = dossiers.find((d) => d.reference === id);
  const evenementsCrees = useTomStore((s) => s.evenementsCrees[id]) ?? [];

  const editRef = searchParams.get("edit");
  const natureParam = searchParams.get("nature");
  const evenement = editRef ? evenementsCrees.find((e) => e.reference === editRef) : undefined;
  const nature = evenement?.nature ?? natureParam ?? "";

  if (!dossier) {
    return (
      <Shell>
        <div className="card p-10 text-center text-gray-400">
          Dossier introuvable. <Link href="/consultation/dossiers" className="text-orange-600">Retour à la liste</Link>
        </div>
      </Shell>
    );
  }

  if (!nature || (editRef && !evenement)) {
    return (
      <Shell>
        <div className="card p-10 text-center text-gray-400">
          Événement introuvable. <Link href={`/consultation/dossiers/${id}`} className="text-orange-600">Retour au dossier</Link>
        </div>
      </Shell>
    );
  }

  const retourDossier = () => router.push(`/consultation/dossiers/${id}`);

  return (
    <Shell>
      <div className="space-y-4">
        <div>
          <Link href={`/consultation/dossiers/${id}`} className="text-[11px] text-[#64748b] hover:text-[#e8632b] flex items-center gap-1 mb-1.5">
            ‹ Retour au dossier
          </Link>
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#e8632b]">
            {evenement ? "Modifier l'événement" : "Nouvel événement"}
          </div>
          <h1 className="text-xl font-semibold text-[#0f172a]">{nature}</h1>
          <div className="text-xs text-[#64748b]">
            {evenement ? `${evenement.reference} · ` : ""}{dossier.reference} · {dossier.client}
          </div>
        </div>

        <Card>
          <EvenementSaisieForm
            dossier={dossier}
            nature={nature}
            evenement={evenement}
            onCancel={retourDossier}
            onSaved={retourDossier}
          />
        </Card>
      </div>
    </Shell>
  );
}

export default function SaisieEvenementPage() {
  return (
    <Suspense>
      <SaisieEvenementInner />
    </Suspense>
  );
}
