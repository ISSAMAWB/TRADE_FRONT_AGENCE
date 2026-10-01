"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Shell from "@/components/Shell";
import Card from "@/components/ui/Card";
import AideContextuelle from "@/components/AideContextuelle";
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

        <div className={nature === "Paiement" ? "flex flex-col xl:flex-row gap-4 items-start" : ""}>
          <Card className="flex-1 min-w-0">
            <EvenementSaisieForm
              dossier={dossier}
              nature={nature}
              evenement={evenement}
              onCancel={retourDossier}
              onSaved={retourDossier}
            />
          </Card>
          {nature === "Paiement" && <AideContextuelle {...AIDE_PAIEMENT} />}
        </div>
      </div>
    </Shell>
  );
}

/* Contenu de l'aide contextuelle de l'événement « Paiement ». */
const AIDE_PAIEMENT = {
  intro: (
    <>
      Le paiement d'une remise documentaire import consiste à remettre les documents au client
      contre un ordre de paiement conforme et contrôlé. Dans le cas d'une acceptation &amp;
      paiement, l'effet est remis au client après la collecte et le contrôle de l'ordre de paiement.
    </>
  ),
  pointsEntree: [
    "Remise documentaire import existante arrivant au règlement (à vue ou à échéance).",
    "Le client se présente en agence avec son ordre de paiement.",
  ],
  actions: [
    "Recueillir l'ordre de paiement dûment renseigné par le client.",
    "Contrôler les informations figurant sur l'ordre de paiement.",
    <>Saisir dans DocuTrade+ l'événement « Paiement » en renseignant a minima les champs obligatoires <span className="text-red-500">(*)</span> et en joignant l'ordre de paiement.</>,
    "Remettre les documents au client, ainsi que le cas échéant l'effet collecté dans le cas d'une acceptation.",
  ],
  regles: [
    "La disponibilité de la provision doit être contrôlée préalablement.",
    "L'identité de la personne désignée pour récupérer les documents doit être contrôlée.",
    "L'ordre de paiement doit être joint à l'événement.",
  ],
  conseils: [
    "Vérifier la cohérence entre le montant de l'ordre de paiement, la facture et le montant du dossier.",
    "Contrôler la devise et le compte à débiter avant validation.",
    "En cas d'acceptation & paiement, restituer l'effet au client au moment de la remise des documents.",
  ],
  procedure: "Procédure de paiement d'une IRD reçue en agence.",
};

export default function SaisieEvenementPage() {
  return (
    <Suspense>
      <SaisieEvenementInner />
    </Suspense>
  );
}
