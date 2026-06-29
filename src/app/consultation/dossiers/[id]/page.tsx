"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FolderOpen, ChevronLeft, History, Lock, User, Plus, Send } from "lucide-react";
import clsx from "clsx";
import dossiersData from "@/mocks/dossiers.json";
import type { Dossier, ProduitTrade, StatutDossier, NoteInterne } from "@/domain/consultation";

const statutClasses: Record<StatutDossier, string> = {
  "En cours": "badge-statut-en-cours",
  "Expiré": "badge-statut-expire",
  "Annulé": "badge-statut-annule",
};

export default function ConsultationDossierDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const dossier = (dossiersData as Dossier[]).find((d) => d.id === id);
  const [tab, setTab] = useState<"client" | "agence">("client");
  const [notes, setNotes] = useState<NoteInterne[]>(dossier?.notes ?? []);
  const [nouvelleNote, setNouvelleNote] = useState("");

  if (!dossier) {
    return (
      <div className="card p-10 text-center text-ink-500">
        Dossier introuvable. <Link href="/consultation/dossiers" className="text-brand-600">Retour à la liste</Link>
      </div>
    );
  }

  function ajouterNote() {
    if (!nouvelleNote.trim()) return;
    const note: NoteInterne = {
      date: new Date().toISOString().split("T")[0],
      auteur: "Agent agence",
      texte: nouvelleNote.trim(),
    };
    setNotes((n) => [note, ...n]);
    setNouvelleNote("");
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-600">Consultation</Link>
        <span>/</span>
        <Link href="/consultation/dossiers" className="hover:text-brand-600">Dossiers Trade</Link>
        <span>/</span>
        <span className="text-ink-700 font-medium">{dossier.id}</span>
      </div>

      {/* Header */}
      <div className="card p-5" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link href="/consultation/dossiers" className="text-xs text-ink-500 hover:text-[#E8722A] inline-flex items-center gap-1">
              <ChevronLeft size={12} /> Retour à la liste
            </Link>
            <h1 className="text-xl font-semibold mt-1 text-ink-900">{dossier.id}</h1>
            <div className="text-sm text-ink-500 mt-1">
              {dossier.client.nom} · {dossier.client.compte} · {dossier.montant.toLocaleString("fr-FR")} {dossier.devise} · Créé le {new Date(dossier.dateCreation).toLocaleDateString("fr-FR")}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge-produit">{dossier.produit}</span>
            <span className={statutClasses[dossier.statut]}>{dossier.statut}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ background: "#FFFFFF", borderColor: "#E5E7EB" }}>
        <div className="border-b border-ink-100 flex">
          {[
            { key: "client", label: "Vue client", icon: User },
            { key: "agence", label: "Vue agence", icon: Lock },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={clsx(
                  "px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-2",
                  tab === t.key
                    ? "border-[#E8722A] text-[#E8722A]"
                    : "border-transparent text-ink-500 hover:text-ink-700"
                )}
              >
                <Icon size={14} /> {t.label}
                {t.key === "agence" && <span className="text-[10px]">🔓</span>}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {tab === "client" && <VueClient dossier={dossier} />}
          {tab === "agence" && (
            <VueAgence
              dossier={dossier}
              notes={notes}
              nouvelleNote={nouvelleNote}
              setNouvelleNote={setNouvelleNote}
              ajouterNote={ajouterNote}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function VueClient({ dossier }: { dossier: Dossier }) {
  return (
    <div className="space-y-6">
      <section>
        <div className="section-title">Informations générales</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Référence" value={dossier.id} />
          <Field label="Produit" value={dossier.produit} />
          <Field label="Client" value={dossier.client.nom} />
          <Field label="Compte" value={dossier.client.compte} />
          <Field label="ICE" value={dossier.client.ice} />
          <Field label="Code client" value={dossier.client.code} />
          <Field label="Montant" value={`${dossier.montant.toLocaleString("fr-FR")} ${dossier.devise}`} />
          <Field label="Date de création" value={new Date(dossier.dateCreation).toLocaleDateString("fr-FR")} />
          <Field label="Date d'échéance" value={new Date(dossier.dateEcheance).toLocaleDateString("fr-FR")} />
          <Field label="Banque correspondante" value={dossier.banqueCorrespondante} />
          <Field label="Pays d'origine" value={dossier.paysOrigine} />
          <Field label="Statut" value={dossier.statut} />
        </div>
      </section>

      <section>
        <div className="section-title flex items-center gap-2"><History size={14} /> Historique des événements</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            {[...dossier.evenements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((e) => (
              <tr key={e.id}>
                <td className="text-xs">{new Date(e.date).toLocaleDateString("fr-FR")}</td>
                <td>{e.type}</td>
                <td>{e.statut}</td>
                <td>{e.montant ? e.montant.toLocaleString("fr-FR") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function VueAgence({
  dossier,
  notes,
  nouvelleNote,
  setNouvelleNote,
  ajouterNote,
}: {
  dossier: Dossier;
  notes: NoteInterne[];
  nouvelleNote: string;
  setNouvelleNote: (s: string) => void;
  ajouterNote: () => void;
}) {
  const ratio = Math.min(1, dossier.encours.utilise / dossier.encours.autorise);
  return (
    <div className="space-y-6">
      <div
        className="rounded-lg p-5"
        style={{ background: "#FDF0E8", borderLeft: "3px solid #E8722A" }}
      >
        <div className="section-title" style={{ color: "#E8722A", borderColor: "#E5E7EB" }}>Identification interne</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Référence CTN" value={dossier.refCTN} />
          <Field label="Code agence" value={dossier.codeAgence} />
          <Field label="Agent CTN" value={`${dossier.agentCTN.prenom} ${dossier.agentCTN.nom} (${dossier.agentCTN.code})`} />
          <Field label="Date prise en charge" value={new Date(dossier.datePriseEnCharge).toLocaleDateString("fr-FR")} />
          <Field label="Dernière interaction" value={new Date(dossier.derniereInteraction).toLocaleDateString("fr-FR")} />
          <Field label="Canal interaction" value={dossier.canalInteraction} />
        </div>
      </div>

      <section>
        <div className="section-title">Statut opérationnel</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Statut opérationnel" value={dossier.statutOperationnel} />
          <Field label="Contrôle documentaire" value={dossier.controleDocumentaire} />
          <Field label="Prochaine action" value="Contrôle final avant envoi" />
        </div>
      </section>

      <section>
        <div className="section-title">Données financières agence</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label="Encours utilisé" value={`${dossier.encours.utilise.toLocaleString("fr-FR")} ${dossier.encours.devise}`} />
          <Field label="Encours autorisé" value={`${dossier.encours.autorise.toLocaleString("fr-FR")} ${dossier.encours.devise}`} />
          <Field label="Commission" value={`${(dossier.commission * 100).toFixed(2)} %`} />
          <Field label="Taux de change" value={dossier.tauxChange.toString()} />
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-ink-500">Utilisation de l'encours</span>
            <span className="font-medium">{(ratio * 100).toFixed(0)} %</span>
          </div>
          <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${ratio * 100}%`, background: "#E8722A" }} />
          </div>
        </div>
      </section>

      <section>
        <div className="section-title flex items-center gap-2"><Send size={14} /> Communication</div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={nouvelleNote}
              onChange={(e) => setNouvelleNote(e.target.value)}
              placeholder="Ajouter une note interne (mock)"
              className="input flex-1 min-h-[80px]"
            />
            <button className="btn-primary h-10 self-start" onClick={ajouterNote}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="text-xs text-ink-500 mb-1">3 dernières notes internes</div>
          <ul className="divide-y divide-ink-100 border border-ink-100 rounded-md" style={{ background: "#FFFFFF" }}>
            {notes.slice(0, 3).map((n, idx) => (
              <li key={idx} className="px-3 py-2">
                <div className="text-xs text-ink-500 mb-0.5">{n.date} · {n.auteur}</div>
                <div className="text-sm text-ink-700">{n.texte}</div>
              </li>
            ))}
            {notes.length === 0 && (
              <li className="px-3 py-4 text-sm text-ink-500 text-center">Aucune note interne.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-sm font-medium text-ink-700">{value || <span className="text-ink-300">—</span>}</div>
    </div>
  );
}
