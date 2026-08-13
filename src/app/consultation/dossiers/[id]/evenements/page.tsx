"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Download, FileText, Eye, X } from "lucide-react";
import dossiersDetail from "@/mocks/dossiersDetail.json";
import Button from "@/components/ui/Button";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dossierId = params.id as string;
  const eventId = params.eventId as string;

  const dossier = dossiersDetail.find((d) => d.reference === dossierId);
  const event = dossier?.evenements.find((e) => e.reference === eventId);

  if (!dossier || !event) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">Événement non trouvé</div>
      </div>
    );
  }

  return (
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

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Informations générales */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Référence de la remise</label>
              <p className="font-medium text-gray-900">{dossier.reference}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Date de création</label>
              <p className="font-medium text-gray-900">{new Date(event.dateCreation).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Conditions de remise des documents</label>
              <p className="font-medium text-gray-900">{dossier.donnees.conditionsRemiseDocuments}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Référence du correspondant</label>
              <p className="font-medium text-gray-900">{dossier.donnees.autreReference}</p>
            </div>
          </div>
        </div>

        {/* Importateur */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Importateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Nom</label>
              <p className="font-medium text-gray-900">{dossier.clientInfo.raisonSociale}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Adresse</label>
              <p className="font-medium text-gray-900">56, Boulevard de la Résistance, Kénitra, Maroc</p>
            </div>
          </div>
        </div>

        {/* Exportateur */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exportateur</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Nom</label>
              <p className="font-medium text-gray-900">{dossier.donnees.tireur}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Adresse</label>
              <p className="font-medium text-gray-900">119, Avenue de l'Europe, Barcelone, Espagne</p>
            </div>
          </div>
        </div>

        {/* Informations financières */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations financières</h2>
          <div className="mb-4">
            <label className="text-sm text-gray-500">Montant des documents présentés</label>
            <p className="font-medium text-gray-900 text-lg">5,140,000 EUR</p>
          </div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Détails du paiement</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Montant</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Type de traite</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Date d'échéance</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">2,570,000 EUR</td>
                <td className="py-2 px-3">A vue</td>
                <td className="py-2 px-3">-</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">1,542,000 EUR</td>
                <td className="py-2 px-3">Contre Acceptation</td>
                <td className="py-2 px-3">28/01/2025</td>
              </tr>
              <tr>
                <td className="py-2 px-3">1,028,000 EUR</td>
                <td className="py-2 px-3">Pour aval</td>
                <td className="py-2 px-3">29/03/2025</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Informations sur l'expédition */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations sur l'expédition</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Description des marchandises</label>
              <p className="font-medium text-gray-900">Équipements industriels</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Référence du transporteur</label>
              <p className="font-medium text-gray-900">BL-560451598</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Lieu d'expédition</label>
              <p className="font-medium text-gray-900">Shanghai</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Lieu de destination</label>
              <p className="font-medium text-gray-900">Agadir</p>
            </div>
          </div>
        </div>

        {/* Répartition des frais */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des frais</h2>
          <div className="mb-4">
            <label className="text-sm text-gray-500">Total des frais</label>
            <p className="font-medium text-gray-900 text-lg">25,700 EUR</p>
          </div>
          <h3 className="text-md font-semibold text-gray-900 mb-3">Détails des charges</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Frais</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Description</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Devise</th>
                <th className="text-right py-2 px-3 font-semibold text-gray-600">Montant</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Date de règlement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Commission d'encaissement</td>
                <td className="py-2 px-3">Commission sur remise documentaire</td>
                <td className="py-2 px-3">EUR</td>
                <td className="py-2 px-3 text-right">15,420 EUR</td>
                <td className="py-2 px-3 text-center text-green-600">Réglé</td>
                <td className="py-2 px-3">11/11/2024</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Frais SWIFT</td>
                <td className="py-2 px-3">Frais de transmission SWIFT</td>
                <td className="py-2 px-3">EUR</td>
                <td className="py-2 px-3 text-right">5,140 EUR</td>
                <td className="py-2 px-3 text-center text-green-600">Réglé</td>
                <td className="py-2 px-3">11/11/2024</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Frais de correspondant</td>
                <td className="py-2 px-3">Frais bancaires correspondant</td>
                <td className="py-2 px-3">EUR</td>
                <td className="py-2 px-3 text-right">3,084 EUR</td>
                <td className="py-2 px-3 text-center text-green-600">Réglé</td>
                <td className="py-2 px-3">11/11/2024</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Frais de port</td>
                <td className="py-2 px-3">Frais postaux</td>
                <td className="py-2 px-3">EUR</td>
                <td className="py-2 px-3 text-right">1,028 EUR</td>
                <td className="py-2 px-3 text-center text-green-600">Réglé</td>
                <td className="py-2 px-3">11/11/2024</td>
              </tr>
              <tr>
                <td className="py-2 px-3">TVA</td>
                <td className="py-2 px-3">Taxe sur la valeur ajoutée</td>
                <td className="py-2 px-3">EUR</td>
                <td className="py-2 px-3 text-right">1,028 EUR</td>
                <td className="py-2 px-3 text-center text-green-600">Réglé</td>
                <td className="py-2 px-3">11/11/2024</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Détails des documents reçus */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails des documents reçus</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-600">Document</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600">1er Envoi</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600">2ème Envoi</th>
                <th className="text-center py-2 px-3 font-semibold text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Facture commerciale</td>
                <td className="py-2 px-3 text-center">2</td>
                <td className="py-2 px-3 text-center">0</td>
                <td className="py-2 px-3 text-center">2</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Packing List</td>
                <td className="py-2 px-3 text-center">2</td>
                <td className="py-2 px-3 text-center">0</td>
                <td className="py-2 px-3 text-center">2</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Connaissement (B/L)</td>
                <td className="py-2 px-3 text-center">2</td>
                <td className="py-2 px-3 text-center">0</td>
                <td className="py-2 px-3 text-center">2</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Certificat d'origine</td>
                <td className="py-2 px-3 text-center">2</td>
                <td className="py-2 px-3 text-center">0</td>
                <td className="py-2 px-3 text-center">2</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Certificat d'assurance</td>
                <td className="py-2 px-3 text-center">2</td>
                <td className="py-2 px-3 text-center">0</td>
                <td className="py-2 px-3 text-center">2</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Documents attachés */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents attachés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Lettre d'instruction de remise", icon: <FileText size={16} /> },
              { name: "Liste de colisage", icon: <FileText size={16} /> },
              { name: "Facture commerciale", icon: <FileText size={16} /> },
              { name: "Certificat d'origine", icon: <FileText size={16} /> },
              { name: "Connaissement (B/L)", icon: <FileText size={16} /> },
              { name: "Traite (lettre de change)", icon: <FileText size={16} /> },
            ].map((doc, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                <div className="text-gray-500">{doc.icon}</div>
                <span className="text-sm text-gray-900">{doc.name}</span>
                <button className="ml-auto text-gray-400 hover:text-gray-600">
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
