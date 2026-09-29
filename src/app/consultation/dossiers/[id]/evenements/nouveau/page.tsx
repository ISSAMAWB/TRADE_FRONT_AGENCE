"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, CircleAlert, HelpCircle, Lightbulb, ListOrdered, LogIn } from "lucide-react";
import clsx from "clsx";
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
          {nature === "Paiement" && <AideContextuellePaiement />}
        </div>
      </div>
    </Shell>
  );
}

/* Panneau latéral d'aide : repliable en largeur (bande verticale), sticky au défilement. */
function AideContextuellePaiement() {
  const [replie, setReplie] = useState(true);
  return (
    <aside
      className={clsx(
        "card overflow-hidden shrink-0 transition-[width] duration-300 xl:sticky xl:top-4",
        replie ? "xl:w-11" : "w-full xl:w-[320px] xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
      )}
    >
      {replie ? (
        <button
          type="button"
          onClick={() => setReplie(false)}
          aria-expanded={false}
          title="Afficher l'aide contextuelle"
          className="w-full h-full min-h-[120px] bg-[#0f172a] text-white flex flex-col items-center justify-center gap-3 py-4 hover:bg-[#1e293b] transition"
        >
          <HelpCircle size={16} className="text-orange-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">
            Aide contextuelle
          </span>
          <ChevronLeft size={14} className="text-gray-400" />
        </button>
      ) : (
        <>
      <div className="px-4 py-3 bg-[#0f172a] text-white flex items-center gap-2">
        <HelpCircle size={15} className="text-orange-400 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider flex-1 whitespace-nowrap overflow-hidden">Aide contextuelle</span>
        <button
          type="button"
          onClick={() => setReplie(true)}
          aria-expanded={true}
          title="Replier l'aide"
          className="h-6 w-6 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
        >
          <ChevronRight size={14} />
        </button>
      </div>
      <div className="p-4 space-y-5 text-[13px] text-[#334155]">
        <p className="leading-relaxed text-[#475569]">
          Le paiement d'une remise documentaire import consiste à remettre les documents au client
          contre un ordre de paiement conforme et contrôlé. Dans le cas d'une acceptation &amp;
          paiement, l'effet est remis au client après la collecte et le contrôle de l'ordre de paiement.
        </p>

        <section>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
            <LogIn size={13} className="text-orange-500" /> Point d'entrée
          </div>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-orange-400">
            <li>Remise documentaire import existante arrivant au règlement (à vue ou à échéance).</li>
            <li>Le client se présente en agence avec son ordre de paiement.</li>
          </ul>
        </section>

        <section>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0f172a] mb-2">
            <ListOrdered size={13} className="text-orange-500" /> Actions à entreprendre
          </div>
          <ol className="space-y-1.5 pl-4 list-decimal marker:font-semibold marker:text-orange-500">
            <li>Recueillir l'ordre de paiement dûment renseigné par le client.</li>
            <li>Contrôler les informations figurant sur l'ordre de paiement.</li>
            <li>
              Saisir dans DocuTrade+ l'événement « Paiement » en renseignant a minima les champs
              obligatoires <span className="text-red-500">(*)</span> et en joignant l'ordre de paiement.
            </li>
            <li>
              Remettre les documents au client, ainsi que le cas échéant l'effet collecté dans le cas
              d'une acceptation.
            </li>
          </ol>
        </section>

        <section className="rounded-lg bg-red-50/70 border border-red-100 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-700 mb-2">
            <CircleAlert size={13} /> Règles importantes
          </div>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-red-400">
            <li>La disponibilité de la provision doit être contrôlée préalablement.</li>
            <li>L'identité de la personne désignée pour récupérer les documents doit être contrôlée.</li>
            <li>L'ordre de paiement doit être joint à l'événement.</li>
          </ul>
        </section>

        <section className="rounded-lg bg-amber-50/70 border border-amber-100 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2">
            <Lightbulb size={13} /> Conseils opérationnels
          </div>
          <ul className="space-y-1.5 pl-4 list-disc marker:text-amber-400">
            <li>Vérifier la cohérence entre le montant de l'ordre de paiement, la facture et le montant du dossier.</li>
            <li>Contrôler la devise et le compte à débiter avant validation.</li>
            <li>En cas d'acceptation &amp; paiement, restituer l'effet au client au moment de la remise des documents.</li>
          </ul>
        </section>

        <section className="border-t border-gray-200 pt-3">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
            <BookOpen size={13} /> Procédure de référence
          </div>
          <p className="text-xs text-[#64748b]">Procédure de paiement d'une IRD reçue en agence.</p>
        </section>
      </div>
        </>
      )}
    </aside>
  );
}

export default function SaisieEvenementPage() {
  return (
    <Suspense>
      <SaisieEvenementInner />
    </Suspense>
  );
}
