"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, Eye, X } from "lucide-react";
import { useState } from "react";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import Button from "@/components/ui/Button";
import Shell from "@/components/Shell";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [paiementMultiple, setPaiementMultiple] = useState(false);
  const [changementDomiciliation, setChangementDomiciliation] = useState("NON");
  const [retourRemise, setRetourRemise] = useState("NON");
  const [escompteDemande, setEscompteDemande] = useState("NON");
  const [financement, setFinancement] = useState("NON");
  const dossierId = params.id as string;
  const eventId = params.eventId as string;

  const dossier = dossiersDetail.find((d) => d.reference === dossierId);
  const event = dossier?.evenements.find((e) => e.reference === eventId);

  if (!dossier || !event) {
    return (
      <Shell>
        <div className="p-8">
          <div className="text-center text-gray-500">Événement non trouvé</div>
        </div>
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
        {/* Informations générales */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence de la remise</label>
              <p className="font-semibold text-gray-900">{dossier.reference}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de création</label>
              <p className="font-semibold text-gray-900">{new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
            </div>
            <div className={`bg-gray-50 rounded-lg p-4 ${event.nature === "Modification de la remise" ? "border-2 border-orange-500 shadow-md" : ""}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Conditions de remise des documents</label>
                {event.nature === "Modification de la remise" && (
                  <span className="text-xs font-medium text-orange-600 uppercase tracking-wider bg-orange-100 px-2 py-1 rounded">Modifié</span>
                )}
              </div>
              <p className="font-semibold text-gray-900">{dossier.donnees.conditionsRemiseDocuments}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Référence du correspondant</label>
              <p className="font-semibold text-gray-900">{dossier.donnees.autreReference}</p>
            </div>
            {event.nature !== "Paiement" && (
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paiementMultiple}
                    onChange={(e) => setPaiementMultiple(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement multiple</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Détails de la modification - uniquement pour Modification de la remise */}
        {event.nature === "Modification de la remise" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails de la modification</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date de la modification</label>
                <p className="font-semibold text-gray-900">{new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description de la modification</label>
                <p className="font-semibold text-gray-900">Extension de la date d'échéance</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-3">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Instructions reçues</label>
                <p className="font-semibold text-gray-900">Demande client pour extension de la date d'échéance suite à retard de livraison</p>
              </div>
            </div>
          </div>
        )}

        {/* Détails de l'acceptation - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Détails de l'acceptation</h2>
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
        {event.nature === "Acceptation & Aval de la traite" && (
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
        {event.nature === "Acceptation & Aval de la traite" && (
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

        {/* Importateur - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
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

        {/* Bénéficiaire du paiement - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Bénéficiaire du paiement</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Banque bénéficiaire</label>
                <p className="font-semibold text-gray-900">Banque Populaire</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">IBAN</label>
                <p className="font-semibold text-gray-900">ES73 3773-441-5653-54</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nature de la partie à notifier</label>
                <p className="font-semibold text-gray-900">Tiré</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Paiement envoyé à</label>
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
              <div className="bg-gray-50 rounded-lg p-4 md:col-span-2">
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
          </div>
        )}

        {/* Détails du paiement - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
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
        {event.nature === "Paiement" && (
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
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Date du règlement</label>
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

        {/* Titres d'importation - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Titres d'importation</h2>
            </div>
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

        {/* Titres d'importation - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Titres d'importation</h2>
            </div>
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

        {/* Répartition des frais - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Répartition des frais</h2>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mb-6">
              <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
              <p className="font-bold text-2xl text-amber-900">2,500 EUR</p>
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
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">02/02/2026</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,000 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">02/02/2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents attachés - uniquement pour Acceptation & Aval de la traite */}
        {event.nature === "Acceptation & Aval de la traite" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
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

        {/* Importateur - uniquement pour Réception de la remise et Modification de la remise */}
        {event.nature !== "Acceptation & Aval de la traite" && event.nature !== "Paiement" && (
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

        {/* Informations financières - uniquement pour Réception de la remise et Modification de la remise */}
        {event.nature !== "Acceptation & Aval de la traite" && event.nature !== "Paiement" && (
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
              <div className={`bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 ${event.nature === "Modification de la remise" ? "border-2 border-orange-500 shadow-md" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-purple-700 uppercase tracking-wider">Date d'échéance</label>
                  {event.nature === "Modification de la remise" && (
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

        {/* Répartition des frais - uniquement pour Réception de la remise et Modification de la remise */}
        {event.nature !== "Acceptation & Aval de la traite" && event.nature !== "Paiement" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Répartition des frais</h2>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mb-6">
              <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
              <p className="font-bold text-2xl text-amber-900">25,700 EUR</p>
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
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">5,140 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais de correspondant</td>
                    <td className="py-3 px-4 text-gray-600">Frais bancaires correspondant</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">3,084 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais de port</td>
                    <td className="py-3 px-4 text-gray-600">Frais postaux</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,028 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">TVA</td>
                    <td className="py-3 px-4 text-gray-600">Taxe sur la valeur ajoutée</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,028 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">11/11/2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Détails des documents reçus - uniquement pour Réception de la remise et Modification de la remise */}
        {event.nature !== "Acceptation & Aval de la traite" && event.nature !== "Paiement" && (
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
        {event.nature !== "Acceptation & Aval de la traite" && event.nature !== "Paiement" && (
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

        {/* Répartition des frais - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Répartition des frais</h2>
            </div>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-6 mb-6">
              <label className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">Total des frais</label>
              <p className="font-bold text-2xl text-amber-900">3,000 EUR</p>
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
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                  </tr>
                  <tr className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">Frais de transmission SWIFT</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">1,000 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">Frais de correspondant</td>
                    <td className="py-3 px-4 text-gray-600">Frais bancaires correspondant</td>
                    <td className="py-3 px-4 text-gray-600">EUR</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">500 EUR</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Réglé</span></td>
                    <td className="py-3 px-4 text-gray-600">12/12/2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Documents attachés - uniquement pour Paiement */}
        {event.nature === "Paiement" && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full"></div>
              <h2 className="text-lg font-semibold text-gray-900">Documents attachés</h2>
            </div>
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
    </div>
    </Shell>
  );
}
