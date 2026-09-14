"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Eye, X } from "lucide-react";
import { useState } from "react";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";
import ReceptionRemiseDetail from "@/components/consultation/ReceptionRemiseDetail";

function TrackingDocuments({ suivi }: { suivi: any[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
        <h2 className="text-lg font-semibold text-gray-900">Tracking de l'envoi des documents</h2>
      </div>
      <div className="relative pl-4">
        {suivi.map((etape, idx) => (
          <div key={idx} className="relative pb-8 last:pb-0">
            {idx < suivi.length - 1 && (
              <div className="absolute left-[9px] top-6 w-0.5 h-full bg-gray-200"></div>
            )}
            <div className="flex items-start gap-4">
              <div className="relative z-10 w-5 h-5 rounded-full bg-teal-600 ring-4 ring-teal-50"></div>
              <div className="flex-1 -mt-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h3 className="text-sm font-bold text-gray-900">{etape.titre}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    etape.statut === "Terminé" || etape.statut === "Reçu"
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {etape.statut}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {etape.champs.map((champ, cidx) => (
                    <div key={cidx}>
                      <p className="text-xs text-gray-500">{champ.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{champ.valeur}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [changementDomiciliation, setChangementDomiciliation] = useState("NON");
  const [retourRemise, setRetourRemise] = useState("NON");
  const [escompteDemande, setEscompteDemande] = useState("NON");
  const [financement, setFinancement] = useState("NON");
  const [ongletPaiement, setOngletPaiement] = useState<"frais" | "titres" | "attaches">("frais");
  const [ongletAcceptation, setOngletAcceptation] = useState<"frais" | "attaches">("frais");
  const [ongletPaiementTop, setOngletPaiementTop] = useState<"detail" | "tracking">("detail");
  const [ongletAcceptationTop, setOngletAcceptationTop] = useState<"detail" | "tracking">("detail");
  const dossierId = params.id as string;
  const eventId = params.eventId as string;

  const dossier = dossiersDetail.find((d) => d.reference === dossierId) as any;
  const event = dossier?.evenements.find((e) => e.reference === eventId) as any;

  const showInfosGenerales = !event
    ? false
    : (event.nature !== "Paiement" && event.nature !== "Acceptation & Aval de la traite") ||
      (event.nature === "Paiement" && ongletPaiementTop === "detail") ||
      (event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "detail");

  if (!dossier || !event) {
    return (
      <Shell>
        <div className="p-8">
          <div className="text-center text-gray-500">Événement non trouvé</div>
        </div>
      </Shell>
    );
  }

  if ((event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && event.receptionRemise) {
    return (
      <Shell>
        <ReceptionRemiseDetail dossier={dossier} event={event} />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{event.nature}</h1>
              <p className="text-sm text-gray-500">{event.reference} · {new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Onglets top - Paiement */}
        {event.nature === "Paiement" ? (
          <div className="flex flex-wrap border-b border-gray-200 mb-6">
            {[
              { id: "detail", label: "Détail de l'événement" },
              { id: "tracking", label: "Tracking de l'envoi des documents" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setOngletPaiementTop(t.id as "detail" | "tracking")}
                className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                  ongletPaiementTop === t.id
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Onglets top - Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" ? (
          <div className="flex flex-wrap border-b border-gray-200 mb-6">
            {[
              { id: "detail", label: "Détail de l'événement" },
              { id: "tracking", label: "Tracking de l'envoi des documents" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setOngletAcceptationTop(t.id as "detail" | "tracking")}
                className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                  ongletAcceptationTop === t.id
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Tracking de l'envoi des documents - Paiement */}

        {/* Informations générales */}
        {showInfosGenerales ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
          </div>
          <div className={`grid grid-cols-1 ${event.nature === "Expiration" ? "md:grid-cols-3" : "md:grid-cols-2"} gap-6`}>
            {event.nature !== "Centralisation des documents" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence de la remise</label>
                <p className="font-semibold text-gray-900">{dossier.reference}</p>
              </div>
            )}
            {event.nature !== "Centralisation des documents" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de création</label>
                <p className="font-semibold text-gray-900">{new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
            )}
            {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du correspondant</label>
                <p className="font-semibold text-gray-900">{dossier.donnees["referenceCorrespondant"] ? String(dossier.donnees["referenceCorrespondant"]) : "—"}</p>
              </div>
            )}
            {event.nature === "Expiration" && event.expiration && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du correspondant</label>
                <p className="font-semibold text-gray-900">{event.expiration.referenceCorrespondant}</p>
              </div>
            )}
            {event.nature !== "Correspondance" && event.nature !== "Ecritures comptables manuelles" && event.nature !== "Frais et commission" && event.nature !== "Retour des documents" && event.nature !== "Demande de remise des documents" && event.nature !== "Centralisation des documents" && event.nature !== "Accusé de réception des documents" && event.nature !== "Expiration" && (
              <div className={`bg-gray-50 rounded-lg p-4 ${event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise" ? "border-2 border-orange-500 shadow-md" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions de remise des documents</label>
                  {(event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
                    <span className="text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-100 px-2 py-1 rounded">Modifié</span>
                  )}
                </div>
                <p className="font-semibold text-gray-900">{dossier.donnees.conditionsRemiseDocuments}</p>
              </div>
            )}
            {event.nature === "Accusé de réception des documents" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du courrier</label>
                <p className="font-semibold text-gray-900">{event.accuseReception?.numeroCourrier}</p>
              </div>
            )}
            {event.nature === "Correspondance" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type de la correspondance</label>
                <p className="font-semibold text-gray-900">Externe</p>
              </div>
            )}
            {event.nature === "Centralisation des documents" && (
              <>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence de centralisation</label>
                  <p className="font-semibold text-gray-900">{event.centralisationDocument?.referenceCentralisation}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de création</label>
                  <p className="font-semibold text-gray-900">{new Date(event.dateCreation).toLocaleDateString("fr-FR")}</p>
                </div>
              </>
            )}
            {(event.nature === "Retour des documents" || event.nature === "Demande de remise des documents") && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type de la demande</label>
                <p className="font-semibold text-gray-900">{event.retourDocument?.typeDemande || "Demande"}</p>
              </div>
            )}
            {event.nature === "Accusé de réception des documents" && (
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type d'évènement</label>
                <p className="font-semibold text-gray-900">{event.accuseReception?.typeEvenement} / {event.reference}</p>
              </div>
            )}

          </div>
        </div>
        ) : null}


        {event.nature === "Paiement" && ongletPaiementTop === "tracking" && <TrackingDocuments suivi={event.suivi} />}

        {/* Tracking de l'envoi des documents - Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "tracking" && <TrackingDocuments suivi={event.suivi} />}

        {/* Message reçu - uniquement pour Correspondance */}
        {event.nature === "Correspondance" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Message reçu</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type du message</label>
                <p className="font-semibold text-gray-900">MT799</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de la réception</label>
                <p className="font-semibold text-gray-900">07/08/2026</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Emetteur du message</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">Société Générale Paris
29, Boulevard Haussmann
75009 Paris
France</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence</label>
                <p className="font-semibold text-gray-900">SWIFT-2026-0440-01</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instructions reçues</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-gray-900 whitespace-pre-line">Veuillez nous confirmer l'acceptation des documents présentés et nous transmettre les instructions de paiement correspondantes.</p>
              </div>
            </div>
          </div>
        )}

        {/* Message envoyé - uniquement pour Correspondance */}
        {event.nature === "Correspondance" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Message envoyé</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type du message</label>
                <p className="font-semibold text-gray-900">MT799</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date d'envoi</label>
                <p className="font-semibold text-gray-900">08/08/2026</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Destinataire</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">Société Générale Paris
29, Boulevard Haussmann
75009 Paris
France</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence</label>
                <p className="font-semibold text-gray-900">SWIFT-2026-0440-01</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instructions envoyées</label>
              <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-gray-900 whitespace-pre-line">Nous confirmons l'acceptation des documents présentés et vous prions de procéder au paiement à l'échéance convenue.</p>
              </div>
            </div>
          </div>
        )}

        {/* Détails de la modification / ajustement - uniquement pour Modification de la remise et Ajustement de la remise */}
        {(event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">{event.nature === "Ajustement de la remise" ? "Détails de l'ajustement" : "Détails de la modification"}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{event.nature === "Ajustement de la remise" ? "Date de l'ajustement" : "Date de la modification"}</label>
                <p className="font-semibold text-gray-900">{new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{event.nature === "Ajustement de la remise" ? "Description de l'ajustement" : "Description de la modification"}</label>
                <p className="font-semibold text-gray-900">Extension de la date d'échéance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instructions reçues</label>
                <p className="font-semibold text-gray-900">Demande client pour extension de la date d'échéance suite à retard de livraison</p>
              </div>
            </div>
          </div>
        )}

        {/* Partie remettante - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Partie remettante</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature de la partie remettante</label>
                <p className="font-semibold text-gray-900">Banque étrangère</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nom</label>
                <p className="font-semibold text-gray-900">{dossier.donnees.partieRemettante}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Adresse</label>
                <p className="font-semibold text-gray-900">15, Rue de la Banque, Paris, France</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pays</label>
                <p className="font-semibold text-gray-900">France</p>
              </div>
            </div>
          </div>
        )}

        {/* Détails de l'acceptation - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails de l'acceptation et aval</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Acceptant (Tiré)</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">ARRAKIS HL
VILLA N 4 RUE OUM KELTOUM
.
20000 CASABLANCA
MAROC</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de réception</label>
                <p className="font-semibold text-gray-900">02/02/2026</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instructions reçues</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">Acceptation de la traite pour paiement à échéance conformément aux conditions du crédit documentaire.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence</label>
                <p className="font-semibold text-gray-900">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence de l'aval</label>
                <p className="font-semibold text-gray-900">—</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant accepté</label>
                <p className="font-semibold text-gray-900">180 382,36 EUR</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Période de maturité</label>
                <p className="font-semibold text-gray-900">-</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Du / Après</label>
                <p className="font-semibold text-gray-900">Après</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Début de la maturité</label>
                <p className="font-semibold text-gray-900">À vue</p>
              </div>
            </div>
          </div>
        )}

        {/* Information de la partie à notifier - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Information de la partie à notifier</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature de la partie à notifier</label>
                <p className="font-semibold text-gray-900">Tiré</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notifié par</label>
                <p className="font-semibold text-gray-900">Courrier</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Adresse</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">ERCO LUMIERES EURL
6 TER RUE DES SAINTS PERES 75007
PARIS
FRANCE</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instruction d'envoi</label>
                <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                  <p className="text-sm text-gray-900 whitespace-pre-line">Envoyer l'acceptation par courrier recommandé avec accusé de réception à l'adresse indiquée.</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant total accepté</label>
                <p className="font-semibold text-gray-900">180 382,36 EUR</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence</label>
                <p className="font-semibold text-gray-900">INV N 25094269</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remise à expirer</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Paiements à accepter - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Paiements à accepter</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Période (Tenor)</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de base</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Maturité</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Accepté</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">16 248,39 EUR</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">17/10/25</td>
                    <td className="py-3 px-4 text-gray-600">En attente de paiement</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Oui</span></td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">15 770,50 EUR</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">03/11/25</td>
                    <td className="py-3 px-4 text-gray-600">En attente de paiement</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Oui</span></td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">15 770,49 EUR</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">-</td>
                    <td className="py-3 px-4 text-gray-600">17/11/25</td>
                    <td className="py-3 px-4 text-gray-600">En attente de paiement</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Oui</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Détails du paiement reçu - uniquement pour Paiement */}
        {event.nature === "Paiement" && ongletPaiementTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails du paiement reçu</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du paiement reçu</label>
                <p className="font-semibold text-gray-900">LIC3344992</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Partie à l'origine du paiement</label>
                <p className="font-semibold text-gray-900">Tiré</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Paiement reçu de</label>
                <p className="font-semibold text-gray-900">MAGHREB STEEL - 56, Boulevard de la Résistance, Kénitra, Maroc</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de réception</label>
                <p className="font-semibold text-gray-900">01/01/2026</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instruction du paiement</label>
                <p className="font-semibold text-gray-900">—</p>
              </div>
            </div>
          </div>
        )}

        {/* Bénéficiaire du paiement - uniquement pour Paiement */}
        {event.nature === "Paiement" && ongletPaiementTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Bénéficiaire du paiement</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature de la partie à payer</label>
                  <p className="font-semibold text-gray-900">Banque étrangère</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Partie à payer</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mt-1">
                    <p className="text-sm text-gray-900 whitespace-pre-line">ERCO LUMIERES EURL
6 TER RUE DES SAINTS PERES 75007
PARIS
FRANCE</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence</label>
                  <p className="font-semibold text-gray-900">INV N 25094269</p>
                </div>
              </div>
              {/* Colonne droite */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Banque du bénéficiaire</label>
                  <p className="font-semibold text-gray-900">Banque Populaire</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Adresse de la banque du bénéficiaire</label>
                  <p className="font-semibold text-gray-900">Paris, France</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Numéro de compte du bénéficiaire</label>
                  <p className="font-semibold text-gray-900">ES73 3773-441-5653-54</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
                <input
                  type="checkbox"
                  checked={false}
                  disabled
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Remise à expirer</span>
              </label>
            </div>
          </div>
        )}

        {/* Détails du paiement - uniquement pour Paiement */}
        {event.nature === "Paiement" && ongletPaiementTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails du paiement</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant des documents</label>
                <p className="font-semibold text-gray-900">5,140,000 EUR</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cours appliqué</label>
                <p className="font-semibold text-gray-900">10,85</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant payé</label>
                <p className="font-semibold text-gray-900">5,140,000 EUR</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Contrevaleur en dirhams</label>
                <p className="font-semibold text-gray-900">55,769,000 MAD</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date du paiement</label>
                <p className="font-semibold text-gray-900">12/12/2024</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature du paiement</label>
                <p className="font-semibold text-gray-900">Contre acceptation</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant restant à régler</label>
                <p className="font-semibold text-gray-900">0 EUR</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations sur le règlement - uniquement pour Paiement */}
        {event.nature === "Paiement" && ongletPaiementTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Informations sur le règlement</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Numéro UETR</label>
                <p className="font-semibold text-gray-900">56f0c1ce-56f0-456f-56f0-0000000056f0</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de valeur</label>
                <p className="font-semibold text-gray-900">12/12/2024</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Numéro du compte débité</label>
                <p className="font-semibold text-gray-900">0000099736286</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Agence de domiciliation</label>
                <p className="font-semibold text-gray-900">AGC-135 Rabat</p>
              </div>
            </div>
          </div>
        )}


        {/* Répartition des frais et Documents attachés - 2 onglets pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && ongletAcceptationTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap border-b border-gray-200 mb-6">
              {[
                { id: "frais", label: "Répartition des frais" },
                { id: "attaches", label: "Documents attachés" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOngletAcceptation(t.id as "frais" | "attaches")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                    ongletAcceptation === t.id
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {ongletAcceptation === "frais" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions au Maroc</label>
                    <p className="font-semibold text-gray-900">Tiré</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions à l'étranger</label>
                    <p className="font-semibold text-gray-900">Tireur</p>
                  </div>
                </div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Détails des charges</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supportée par</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de règlement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">Commission d'acceptation</td>
                        <td className="py-3 px-4 text-gray-600">Commission sur acceptation de traite</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">1,500 EUR</td>
                        <td className="py-3 px-4 text-gray-600">Tiré</td>
                        <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                        <td className="py-3 px-4 text-gray-600">02/02/2026</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                        <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">1,000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">Tireur</td>
                        <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                        <td className="py-3 px-4 text-gray-600">02/02/2026</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mt-6">
                  <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
                  <p className="font-bold text-2xl text-amber-900">2,500 EUR</p>
                </div>
              </div>
            )}

            {ongletAcceptation === "attaches" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "Lettre d'acceptation", icon: <FileText size={16} /> },
                    { name: "Traite acceptée", icon: <FileText size={16} /> },
                    { name: "Aval de la traite", icon: <FileText size={16} /> },
                    { name: "Confirmation SWIFT", icon: <FileText size={16} /> },
                    { name: "Bordereau de frais", icon: <FileText size={16} /> },
                    { name: "Reçu de paiement", icon: <FileText size={16} /> },
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                        {doc.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{doc.name}</span>
                      <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Importateur - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Importateur (Tiré)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nom</label>
                <p className="font-semibold text-gray-900">MAGHREB STEEL SA</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Adresse</label>
                <p className="font-semibold text-gray-900">56, Boulevard de la Résistance, Kénitra, Maroc</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pays</label>
                <p className="font-semibold text-gray-900">Maroc</p>
              </div>
            </div>
          </div>
        )}

        {/* Exportateur - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Exportateur (Tireur)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nom</label>
                <p className="font-semibold text-gray-900">MAGHREB STEEL SA</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Adresse</label>
                <p className="font-semibold text-gray-900">119, Avenue de l'Europe, Barcelone, Espagne</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pays</label>
                <p className="font-semibold text-gray-900">Espagne</p>
              </div>
            </div>
          </div>
        )}

        {/* Informations financières - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Informations financières</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6">
                <label className="text-xs font-medium text-purple-700 uppercase tracking-wider mb-2">Montant des documents présentés</label>
                <p className="font-bold text-2xl text-purple-900">5,140,000 EUR</p>
              </div>
              <div className={`bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 ${event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise" ? "border-2 border-orange-500 shadow-md" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-purple-700 uppercase tracking-wider">Date d'échéance</label>
                  {(event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
                    <span className="text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-100 px-2 py-1 rounded">Modifié</span>
                  )}
                </div>
                <p className="font-bold text-2xl text-purple-900">15/05/2026</p>
              </div>
            </div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Détails du paiement</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Type de traite</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date d'échéance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">2,570,000 EUR</td>
                    <td className="py-3 px-4 text-gray-600">A vue</td>
                    <td className="py-3 px-4 text-gray-400">-</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">1,542,000 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Contre Acceptation</td>
                    <td className="py-3 px-4 text-gray-600">28/01/2025</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">1,028,000 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Pour aval</td>
                    <td className="py-3 px-4 text-gray-600">29/03/2025</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Informations sur l'expédition - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Informations sur l'expédition</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description des marchandises</label>
                <p className="font-semibold text-gray-900">Équipements industriels</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du transporteur</label>
                <p className="font-semibold text-gray-900">BL-560451598</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Lieu d'expédition</label>
                <p className="font-semibold text-gray-900">Shanghai</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Lieu de destination</label>
                <p className="font-semibold text-gray-900">Agadir</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date d'expédition prévue</label>
                <p className="font-semibold text-gray-900">15/11/2024</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Navire/Avion</label>
                <p className="font-semibold text-gray-900">MSC ALEXANDRA</p>
              </div>
            </div>
          </div>
        )}

        {/* Répartition des frais - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Répartition des frais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions au Maroc</label>
                <p className="font-semibold text-gray-900">Tiré</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions à l'étranger</label>
                <p className="font-semibold text-gray-900">Tireur</p>
              </div>
            </div>
            <h3 className="text-md font-semibold text-gray-900 mb-4">Détails des charges</h3>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supportée par</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de règlement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Commission d'encaissement</td>
                    <td className="py-3 px-4 text-gray-600">Commission sur remise documentaire</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">15,420 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Tireur</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">5,140 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Tiré</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais de correspondant</td>
                    <td className="py-3 px-4 text-gray-600">Frais bancaires correspondant</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">3,084 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Tiré</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais de port</td>
                    <td className="py-3 px-4 text-gray-600">Frais postaux</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,028 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Tiré</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">TVA</td>
                    <td className="py-3 px-4 text-gray-600">Taxe sur la valeur ajoutée</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,028 EUR</td>
                    <td className="py-3 px-4 text-gray-600">Tiré</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mt-6">
              <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
              <p className="font-bold text-2xl text-amber-900">25,700 EUR</p>
            </div>
          </div>
        )}

        {/* Informations complémentaires - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Informations complémentaires</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code agence</label>
                <p className="font-semibold text-gray-900">AGC-CASA-01</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature Office des changes</label>
                <p className="font-semibold text-gray-900">0130-Import Export Incoterms</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Changement de domiciliation</label>
                <p className="font-semibold text-gray-900">NON</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Retour de la remise</label>
                <p className="font-semibold text-gray-900">NON</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Escompte demandé</label>
                <p className="font-semibold text-gray-900">NON</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Financement</label>
                <p className="font-semibold text-gray-900">NON</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Envoi à l'agence</label>
                <p className="font-semibold text-gray-900">1543</p>
              </div>
            </div>
          </div>
        )}

        {/* Détails des documents reçus - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails des documents reçus</h2>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Document</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">1er Envoi</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">2ème Envoi</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Facture commerciale</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                    <td className="py-3 px-4 text-center text-gray-400">0</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Packing List</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                    <td className="py-3 px-4 text-center text-gray-400">0</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Connaissement (B/L)</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                    <td className="py-3 px-4 text-center text-gray-400">0</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Certificat d'origine</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                    <td className="py-3 px-4 text-center text-gray-400">0</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Certificat d'assurance</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                    <td className="py-3 px-4 text-center text-gray-400">0</td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-900">2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents attachés - uniquement pour Réception de la remise et Modification de la remise */}
        {(event.nature === "Réception de la remise" || event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Lettre d'instruction de remise", icon: <FileText size={16} /> },
                { name: "Liste de colisage", icon: <FileText size={16} /> },
                { name: "Facture commerciale", icon: <FileText size={16} /> },
                { name: "Certificat d'origine", icon: <FileText size={16} /> },
                { name: "Connaissement (B/L)", icon: <FileText size={16} /> },
                { name: "Traite (lettre de change)", icon: <FileText size={16} /> },
              ].map((doc, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                    {doc.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{doc.name}</span>
                  <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Répartition des frais et Titres d'importation - 2 onglets pour Paiement */}
        {event.nature === "Paiement" && ongletPaiementTop === "detail" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap border-b border-gray-200 mb-6">
              {[
                { id: "frais", label: "Répartition des frais" },
                { id: "titres", label: "Titres d'importation" },
                { id: "attaches", label: "Documents attachés" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setOngletPaiement(t.id as "frais" | "titres" | "attaches")}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 transition ${
                    ongletPaiement === t.id
                      ? "border-orange-600 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {ongletPaiement === "frais" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions au Maroc</label>
                    <p className="font-semibold text-gray-900">Tiré</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions à l'étranger</label>
                    <p className="font-semibold text-gray-900">Tireur</p>
                  </div>
                </div>
                <h3 className="text-md font-semibold text-gray-900 mb-4">Détails des charges</h3>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supportée par</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de règlement</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">Commission de paiement</td>
                        <td className="py-3 px-4 text-gray-600">Commission sur paiement international</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">1,500 EUR</td>
                        <td className="py-3 px-4 text-gray-600">Tiré</td>
                        <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                        <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                        <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">1,000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">Tireur</td>
                        <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                        <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">Frais de correspondant</td>
                        <td className="py-3 px-4 text-gray-600">Frais bancaires correspondant</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">500 EUR</td>
                        <td className="py-3 px-4 text-gray-600">Tiré</td>
                        <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                        <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mt-6">
                  <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
                  <p className="font-bold text-2xl text-amber-900">3,000 EUR</p>
                </div>
              </div>
            )}

            {ongletPaiement === "titres" && (
              <div>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Numéro d'enregistrement</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant utilisé</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de validité</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0001</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0002</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0003</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0004</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0005</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0006</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0007</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0008</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0009</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                      <tr className="hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">TIT-2024-0010</td>
                        <td className="py-3 px-4 text-gray-600">EUR</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">5 140 000 EUR</td>
                        <td className="py-3 px-4 text-gray-600">31/12/2025</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">20 titre(s) - Page 1 sur 2</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded">Précédent</button>
                    <button className="px-3 py-1 text-sm text-white bg-orange-600 hover:bg-orange-700 rounded">1</button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded">2</button>
                    <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded">Suivant</button>
                  </div>
                </div>
              </div>
            )}

            {ongletPaiement === "attaches" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: "Avis de paiement", icon: <FileText size={16} /> },
                    { name: "Ordre de virement", icon: <FileText size={16} /> },
                    { name: "Avis de débit", icon: <FileText size={16} /> },
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                        {doc.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{doc.name}</span>
                      <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documents attachés - uniquement pour Correspondance */}
        {event.nature === "Correspondance" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "Message SWIFT MT799", icon: <FileText size={16} /> },
              ].map((doc, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                    {doc.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{doc.name}</span>
                  <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                    <Download size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Écritures comptables - uniquement pour Ecritures comptables manuelles */}
        {event.nature === "Ecritures comptables manuelles" && event.ecrituresComptables && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Écritures comptables</h2>
            </div>
            {(() => {
              const ecritures = event.ecrituresComptables || [];
              const totalDebit = ecritures
                .filter(e => e.sens === "DR")
                .reduce((sum, e) => sum + e.montant, 0);
              const totalCredit = ecritures
                .filter(e => e.sens === "CR")
                .reduce((sum, e) => sum + e.montant, 0);
              const devises = Array.from(new Set(ecritures.map((e: any) => e.devise))) as string[];
              const deviseTotal = devises.length === 1 ? devises[0] : "-";

              const formatMontantCell = (montant: number | null) => {
                if (montant === null || montant === undefined || montant === 0) return "-";
                return montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              };

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Compte</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Libellé</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant débit</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant crédit</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de valeur</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ecritures.map((ecriture, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4 font-medium text-gray-900 align-top">{ecriture.compte}</td>
                          <td className="py-3 px-4 text-gray-600 align-top">
                            <span className="break-words whitespace-normal">{ecriture.libelle}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 align-top">
                            {ecriture.sens === "DR" ? formatMontantCell(ecriture.montant) : "-"}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-900 align-top">
                            {ecriture.sens === "CR" ? formatMontantCell(ecriture.montant) : "-"}
                          </td>
                          <td className="py-3 px-4 text-gray-600 align-top">{ecriture.devise}</td>
                          <td className="py-3 px-4 text-gray-600 align-top">{new Date(ecriture.dateValeur).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                      <tr className="bg-indigo-50 font-semibold">
                        <td className="py-3 px-4 text-gray-900 uppercase tracking-wider text-xs">TOTAL</td>
                        <td className="py-3 px-4"></td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatMontantCell(totalDebit)}</td>
                        <td className="py-3 px-4 text-right text-gray-900">{formatMontantCell(totalCredit)}</td>
                        <td className="py-3 px-4 text-gray-900">{deviseTotal}</td>
                        <td className="py-3 px-4 text-gray-900">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* Documents attachés - uniquement pour Ecritures comptables manuelles */}
        {event.nature === "Ecritures comptables manuelles" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
            {event.swifts && event.swifts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.swifts.map((swift, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{swift.type} - {swift.reference}</span>
                    <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Aucun document associé</div>
            )}
          </div>
        )}
      
      {/* Frais et commissions - uniquement pour Frais et commission */}
        {event.nature === "Frais et commission" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Répartition des frais</h2>
            </div>

            {/* Répartition Maroc / Étranger */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions au Maroc</label>
                <p className="font-semibold text-gray-900">{event.fraisMaroc || dossier.donnees.fraisAuMaroc || "-"}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Frais et commissions à l'étranger</label>
                <p className="font-semibold text-gray-900">{event.fraisEtranger || dossier.donnees.fraisAEtranger || "-"}</p>
              </div>
            </div>

            <h3 className="text-md font-semibold text-gray-900 mb-4">Détails des charges</h3>
            {(() => {
              const frais = (event.fraisCommissions || []) as any[];
              const totalParDevise = frais.reduce((acc, f) => {
                acc[f.devise] = (acc[f.devise] || 0) + f.montant;
                return acc;
              }, {} as Record<string, number>);

              const formatMontant = (montant: number) =>
                montant.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

              return (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supportée par</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de règlement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {frais.map((f, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                            <td className="py-3 px-4 font-medium text-gray-900">{f.type}</td>
                            <td className="py-3 px-4 text-gray-600">{f.description}</td>
                            <td className="py-3 px-4 text-gray-600">{f.devise}</td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatMontant(f.montant)} {f.devise}</td>
                            <td className="py-3 px-4 text-gray-600">{f.supportePar}</td>
                            <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{f.statut}</span></td>
                            <td className="py-3 px-4 text-gray-600">{new Date(f.dateReglement).toLocaleDateString("fr-FR")}</td>
                          </tr>
                        ))}
                        <tr className="bg-amber-50 font-semibold">
                          <td className="py-3 px-4 text-gray-900 uppercase tracking-wider text-xs">TOTAL</td>
                          <td className="py-3 px-4" colSpan={2}></td>
                          <td className="py-3 px-4 text-right text-gray-900">
                            {Object.entries(totalParDevise).map(([devise, montant]: [string, any], i, arr) => (
                              <span key={devise}>
                                {formatMontant(montant as number)} {devise}
                                {i < arr.length - 1 && <br />}
                              </span>
                            ))}
                          </td>
                          <td className="py-3 px-4" colSpan={3}></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      {/* Documents attachés - uniquement pour Frais et commission */}
        {event.nature === "Frais et commission" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
            {event.swifts && event.swifts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.swifts.map((swift, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{swift.type} - {swift.reference}</span>
                    <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Aucun document associé</div>
            )}
          </div>
        )}

        {/* Détails du retour des documents - uniquement pour Retour des documents */}
        {event.nature === "Retour des documents" && event.retourDocument?.demande && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails du retour des documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Initiateur</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.demande.origine}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de création</label>
                <p className="font-semibold text-gray-900">{new Date(event.retourDocument.demande.dateDemande).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Motif</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.demande.motif}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description de la demande</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900 whitespace-pre-line">{event.retourDocument.demande.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détail de la réponse - uniquement pour Retour des documents et Demande de remise des documents */}
        {(event.nature === "Retour des documents" || event.nature === "Demande de remise des documents") && event.retourDocument?.reponse && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détail de la réponse</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Origine de la réponse</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.reponse.origine}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de la réponse</label>
                <p className="font-semibold text-gray-900">{new Date(event.retourDocument.reponse.dateReponse).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Raison</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.reponse.raison}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description de la réponse</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900 whitespace-pre-line">{event.retourDocument.reponse.description}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détails de la personne autorisée - uniquement pour Demande de remise des documents */}
        {event.nature === "Demande de remise des documents" && event.retourDocument?.personneAutorisee && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails de la personne autorisée à récupérer les documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nom & Prénom</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.personneAutorisee.nomPrenom}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">N° CIN</label>
                <p className="font-semibold text-gray-900">{event.retourDocument.personneAutorisee.cin}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instruction du client</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900 whitespace-pre-line">{event.retourDocument.personneAutorisee.instructionClient}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Détails des documents - uniquement pour Centralisation des documents */}
        {event.nature === "Centralisation des documents" && event.centralisationDocument && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Informations sur la remise</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Produit</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.produit}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Client</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.client}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.montant.toLocaleString("fr-FR")} {event.centralisationDocument.devise}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Devise</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.devise}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence de la remise</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.referenceInterne}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence externe</label>
                <p className="font-semibold text-gray-900">{event.centralisationDocument.referenceExterne}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code évènement</label>
                <p className="font-semibold text-gray-900">CRE001</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type d'évènement</label>
                <p className="font-semibold text-gray-900">Création</p>
              </div>
            </div>
          </div>
        )}

        {/* Détails de la transmission - uniquement pour Accusé de réception des documents */}
        {event.nature === "Accusé de réception des documents" && event.accuseReception && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails de la transmission</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Emetteur</label>
                <p className="font-semibold text-gray-900">{event.accuseReception.emetteur}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Numéro du courrier</label>
                <p className="font-semibold text-gray-900">{event.accuseReception.numeroCourrier}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date d'envoi</label>
                <p className="font-semibold text-gray-900">{new Date(event.accuseReception.dateEnvoi).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code/Evènement concerné</label>
                <p className="font-semibold text-gray-900">Réception de la remise</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Motif</label>
                <p className="font-semibold text-gray-900">{event.accuseReception.motif}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Commentaire</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900 whitespace-pre-line">{event.accuseReception.commentaire}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accusé de réception des documents - uniquement pour Accusé de réception des documents */}
        {event.nature === "Accusé de réception des documents" && event.accuseReception && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Accusé de réception des documents</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Réception effectuée par</label>
                <p className="font-semibold text-gray-900">{event.accuseReception.receptionEffectueePar}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date et heure de réception</label>
                <p className="font-semibold text-gray-900">{new Date(event.accuseReception.dateHeureReception).toLocaleString("fr-FR")}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Statut</label>
                <p className="font-semibold text-gray-900">{event.accuseReception.statutReception}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Commentaire</label>
                <div className="bg-white border border-gray-200 rounded-lg p-4 mt-2">
                  <p className="text-sm text-gray-900 whitespace-pre-line">{event.accuseReception.commentaireReception}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Documents attachés - pour Accusé de réception des documents, Centralisation des documents, Retour des documents et Demande de remise des documents */}
        {(event.nature === "Accusé de réception des documents" || event.nature === "Centralisation des documents" || event.nature === "Retour des documents" || event.nature === "Demande de remise des documents") && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
            {event.swifts && event.swifts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.swifts.map((swift, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                      <FileText size={16} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">
                      {event.nature === "Demande de remise des documents" ? "Autorisation client" : `${swift.type} - ${swift.reference}`}
                    </span>
                    <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">Aucun document associé</div>
            )}
          </div>
        )}

        {/* Informations financières, Détails des charges et Documents attachés - uniquement pour Expiration */}
        {event.nature === "Expiration" && event.expiration && (
          <>
            {/* Informations financières */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Informations financières</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant des documents</label>
                  <p className="font-semibold text-gray-900">{event.expiration.montantDocuments.toLocaleString("fr-FR")} {event.devise}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant payé</label>
                  <p className="font-semibold text-gray-900">{event.expiration.montantPaye.toLocaleString("fr-FR")} {event.devise}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Montant restant à régler</label>
                  <p className="font-semibold text-gray-900">{event.expiration.montantRestant.toLocaleString("fr-FR")} {event.devise}</p>
                </div>
              </div>
            </div>

            {/* Détails des charges */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Détails des charges</h2>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Frais</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Devise</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Montant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Supporté par</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Statut</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Date de règlement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.expiration.frais.map((f, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-medium text-gray-900">{f.type}</td>
                        <td className="py-3 px-4 text-gray-600">{f.description}</td>
                        <td className="py-3 px-4 text-gray-600">{f.devise}</td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">{f.montant.toLocaleString("fr-FR")} {f.devise}</td>
                        <td className="py-3 px-4 text-gray-600">{f.supportePar}</td>
                        <td className="py-3 px-4 text-gray-600">{f.statut}</td>
                        <td className="py-3 px-4 text-gray-600">{f.dateReglement ? new Date(f.dateReglement).toLocaleDateString("fr-FR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Documents attachés */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
                <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
              </div>
              {event.expiration.documentsAttaches && event.expiration.documentsAttaches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {event.expiration.documentsAttaches.map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-all group">
                      <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center group-hover:bg-rose-200 transition">
                        <FileText size={16} />
                      </div>
                      <span className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition">{doc.nom}</span>
                      <button className="ml-auto text-gray-400 hover:text-rose-600 transition">
                        <Download size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">Aucun document associé</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
    </Shell>
  );
}
