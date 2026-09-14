"use client";

import { useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { EvenementTrade, DossierTrade } from "@/domain/consultation-detail";

interface Props {
  dossier: DossierTrade;
  event: EvenementTrade;
}

export default function ReceptionRemiseDetail({ dossier, event }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"detail" | "suivi">("detail");
  const [showAccuseForm, setShowAccuseForm] = useState(false);
  const [accuseStatut, setAccuseStatut] = useState("Reçu");
  const [accuseObservation, setAccuseObservation] = useState("");

  const data = event.receptionRemise;
  if (!data) return <div className="p-8 text-center text-gray-500">Données de réception indisponibles</div>;

  const formatMontant = (montant: number, devise: string) =>
    `${montant.toLocaleString("fr-FR")} ${devise}`;

  const etapeAccuseReçu = data.accuseReception?.statut === "Reçu";

  const handleAccuserReception = () => {
    setShowAccuseForm(false);
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "Manrope, Helvetica, Arial, sans-serif" }}>
      {/* En-tête de la page */}
      <div className="bg-white border-b border-[#e4e7ec] px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8] hover:text-[#ea580c] transition mb-3 flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            REMDOC Import · {dossier.reference}
          </button>
          <div className="flex items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#101828]">{event.nature}</h1>
              <p className="text-sm text-[#8b95a8] mt-1">
                {event.reference} · créé le {new Date(event.dateCreation).toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Onglets */}
        <div className="flex flex-wrap border-b border-[#e4e7ec] mb-6">
          {[
            { id: "detail", label: "Détail de l'événement" },
            ...(data.suivi && data.suivi.length > 0 ? [{ id: "suivi", label: "Tracking de l'envoi des documents" }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "detail" | "suivi")}
              className={`px-5 py-3 text-sm font-semibold transition border-b-2 ${
                activeTab === tab.id
                  ? "border-[#ea580c] text-[#ea580c]"
                  : "border-transparent text-[#8b95a8] hover:text-[#101828]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "detail" ? (
          <div className="space-y-6" style={{ fontFamily: "Manrope, Helvetica, Arial, sans-serif" }}>
            {/* Détails de la modification - uniquement pour Modification/Ajustement de la remise */}
            {(event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (data as any).modificationDetails && (
              <div className="bg-white rounded-xl border border-[#e4e7ec] p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-[#101828]">Détails de {event.nature === "Ajustement de la remise" ? "l'ajustement" : "la modification"}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Info label={event.nature === "Ajustement de la remise" ? "Date de l'ajustement" : "Date de la modification"} value={new Date((data as any).modificationDetails.dateModification).toLocaleDateString("fr-FR")} />
                  <div className="md:col-span-2">
                    <Info label={event.nature === "Ajustement de la remise" ? "Description de l'ajustement" : "Description de la modification"} value={(data as any).modificationDetails.description} />
                  </div>
                </div>
              </div>
            )}

            {/* Caractéristiques */}
            <div className="bg-white rounded-xl border border-[#e4e7ec] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#101828] mb-4">Caractéristiques de l'opération</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <Info label="Référence de la remise" value={dossier.reference} />
                <Info label="Référence de centralisation" value={dossier.donnees["referenceCentralisation"] ? String(dossier.donnees["referenceCentralisation"]) : "—"} />
                <Info label="Date de création" value={new Date(event.dateCreation).toLocaleDateString("fr-FR")} />
                <Info label="Référence du correspondant" value={dossier.donnees["referenceCorrespondant"] ? String(dossier.donnees["referenceCorrespondant"]) : "—"} />
                <Info label="Montant des documents présentés" value={formatMontant(data.montantDocumentsPresentes, event.devise)} />
                <Info label="Conditions de remise des documents" value={dossier.donnees.conditionsRemiseDocuments as string} />
                {(dossier.donnees.conditionsRemiseDocuments as string)?.toLowerCase().includes("contre acceptation") && (
                  <div className="bg-[#f7f8fa] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-[#8b95a8]">Date d'échéance</label>
                      {(event.nature === "Modification de la remise" || event.nature === "Ajustement de la remise") && (
                        <span className="text-xs font-semibold text-[#b54708] bg-[#fff4ed] px-2 py-0.5 rounded-full">Modifié</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#101828]">{new Date(data.dateEcheance).toLocaleDateString("fr-FR")}</p>
                  </div>
                )}
                <Info label="Paiement multiple" value={data.paiementMultiple ? "Oui" : "Non"} />
              </div>

              {data.paiementMultiple && (
                <>
                  <div className="border-t border-[#f7f8fa] pt-5 mb-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8] mb-2">Détails du paiement</h3>
                    <div className="overflow-x-auto border border-[#e4e7ec] rounded-xl">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-[#eaecf0] text-[#8b95a8] uppercase tracking-wider text-[9px] font-bold">
                            <th className="text-left py-3 px-4">Montant</th>
                            <th className="text-left py-3 px-4">Type de traite</th>
                            <th className="text-left py-3 px-4">Date d'échéance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.paiements.map((p, idx) => (
                            <tr key={idx} className="border-b border-[#f7f8fa]">
                              <td className="py-3 px-4 font-semibold text-[#101828] whitespace-nowrap">{formatMontant(p.montant, p.devise)}</td>
                              <td className="py-3 px-4 text-[#101828]">{p.typeTraite}</td>
                              <td className="py-3 px-4 text-[#101828]">{p.dateEcheance ? new Date(p.dateEcheance).toLocaleDateString("fr-FR") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              <div className="border-t border-[#f7f8fa] pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8] mb-3">Intervenants</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-[#f7f8fa] rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">Nature de la partie remettante</p>
                    <p className="text-sm font-semibold text-[#101828] mt-1">Banque étrangère</p>
                  </div>
                  {data.intervenants.map((i, idx) => (
                    <div key={idx} className="bg-[#f7f8fa] rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#ea580c]">{i.role}</p>
                      <p className="text-sm font-semibold text-[#101828] mt-1">{i.nom}</p>
                      <p className="text-xs text-[#8b95a8] mt-0.5">{i.adresse} - {i.pays}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expédition */}
            <div className="bg-white rounded-xl border border-[#e4e7ec] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#101828] mb-4">Informations sur l'expédition</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Description des marchandises" value={data.descriptionMarchandises} />
                <Info label="Référence du transporteur" value={data.referenceTransporteur} />
                <Info label="Lieu d'expédition" value={data.lieuExpedition} />
                <Info label="Lieu de destination" value={data.lieuDestination} />
                <Info label="Date d'expédition prévue" value={new Date(data.dateExpeditionPrevue).toLocaleDateString("fr-FR")} />
                <Info label="Navire/Avion" value={data.navireAvion} />
              </div>
            </div>

            {/* Informations complémentaires */}
            <div className="bg-white rounded-xl border border-[#e4e7ec] p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#101828] mb-4">Informations complémentaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Info label="Code agence" value={data.codeAgence} />
                <Info label="Nature office des changes" value={data.natureOfficeChanges} />
                <Info label="Changement de domiciliation" value={data.changementDomiciliation} />
                <Info label="Retour de la remise" value={data.retourRemise} />
                <Info label="Escompte demandé" value={data.escompteDemande} />
                <Info label="Financement" value={data.financement} />
                <Info label="Envoi à l'agence" value="1543" />
              </div>
            </div>

            {/* Bloc à sous-onglets */}
            <RepartitionDocumentsAttaches data={data} event={event} />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e4e7ec] p-6 shadow-sm" style={{ fontFamily: "Manrope, Helvetica, Arial, sans-serif" }}>
            <h2 className="text-sm font-bold text-[#101828] mb-6">Tracking de l'envoi des documents</h2>
            <div className="relative pl-4">
              {data.suivi.map((etape, idx) => (
                <div key={idx} className="relative pb-8 last:pb-0">
                  {idx < data.suivi.length - 1 && (
                    <div className="absolute left-[9px] top-6 w-0.5 h-full bg-[#eaecf0]"></div>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="relative z-10 w-5 h-5 rounded-full bg-[#ea580c] ring-4 ring-[#fff4ed]"></div>
                    <div className="flex-1 -mt-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <h3 className="text-sm font-bold text-[#101828]">{etape.titre}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          etape.statut === "Terminé" || etape.statut === "Reçu"
                            ? "bg-[#ecfdf3] text-[#067647]"
                            : "bg-[#fff4ed] text-[#b54708]"
                        }`}>
                          {etape.statut}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {etape.champs.map((champ, cidx) => (
                          <div key={cidx}>
                            <p className="text-xs text-[#8b95a8]">{champ.label}</p>
                            <p className="text-sm font-semibold text-[#101828]">{champ.valeur}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bloc d'action Accuser réception */}
            {!etapeAccuseReçu && (
              <div className="mt-8 border-t border-[#f7f8fa] pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-bold text-[#101828]">Accusé de réception des documents</h3>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#fff4ed] text-[#b54708]">Non reçu</span>
                  <span className="text-xs text-[#b54708]">Action requise</span>
                </div>
                {!showAccuseForm ? (
                  <Button onClick={() => setShowAccuseForm(true)}>Accuser réception</Button>
                ) : (
                  <div className="bg-[#f7f8fa] rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8]">Réception effectuée par</label>
                        <p className="text-sm font-semibold text-[#101828] mt-1">Utilisateur connecté · AGC-CASA-01</p>
                        <p className="text-xs text-[#8b95a8]">Renseigné par le système</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8]">Date et heure de réception</label>
                        <p className="text-sm font-semibold text-[#101828] mt-1">{new Date().toLocaleString("fr-FR")}</p>
                        <p className="text-xs text-[#8b95a8]">Renseigné par le système</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8]">Statut</label>
                        <select
                          value={accuseStatut}
                          onChange={(e) => setAccuseStatut(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                        >
                          <option>Reçu</option>
                          <option>Reçu avec réserve</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#8b95a8]">Note / Observation</label>
                      <textarea
                        value={accuseObservation}
                        onChange={(e) => setAccuseObservation(e.target.value)}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-[#e4e7ec] px-3 py-2 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#ea580c]"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleAccuserReception}>Accuser réception</Button>
                      <Button variant="secondary" onClick={() => setShowAccuseForm(false)}>Annuler</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#f7f8fa] rounded-lg p-4">
      <p className="text-xs text-[#8b95a8] mb-1">{label}</p>
      <p className="text-sm font-semibold text-[#101828]">{value}</p>
    </div>
  );
}

function RepartitionDocumentsAttaches({ data, event }: { data: any; event: EvenementTrade }) {
  const [sousOnglet, setSousOnglet] = useState<"frais" | "recus" | "attaches">("frais");

  return (
    <div className="bg-white rounded-xl border border-[#e4e7ec] p-5 shadow-sm" style={{ fontFamily: "Manrope, Helvetica, Arial, sans-serif" }}>
      <div className="flex flex-wrap border-b border-[#e4e7ec] mb-4">
        {[
          { id: "frais", label: "Répartition des frais" },
          { id: "recus", label: "Documents reçus" },
          { id: "attaches", label: "Documents attachés" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSousOnglet(t.id as "frais" | "recus" | "attaches")}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              sousOnglet === t.id
                ? "border-[#ea580c] text-[#ea580c]"
                : "border-transparent text-[#8b95a8] hover:text-[#101828]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sousOnglet === "frais" && (
        <div>
          <div className="flex flex-wrap gap-4 mb-4">
            <Info label="Frais et commissions au Maroc" value={"Tiré"} />
            <Info label="Frais et commissions à l'étranger" value={"Tireur"} />
          </div>
          <div className="overflow-x-auto border border-[#e4e7ec] rounded-xl">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#eaecf0] text-[#8b95a8] uppercase tracking-wider text-[9px] font-bold">
                  <th className="text-left py-3 px-4">Frais</th>
                  <th className="text-right py-3 px-4">Montant</th>
                  <th className="text-left py-3 px-4">Supporté par</th>
                  <th className="text-left py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.frais.map((f: any, idx: number) => (
                  <tr key={idx} className="border-b border-[#f7f8fa]">
                    <td className="py-3 px-4 font-semibold text-[#101828]">{f.type}</td>
                    <td className="py-3 px-4 text-right font-semibold text-[#101828] whitespace-nowrap">{f.montant.toLocaleString("fr-FR")} {f.devise}</td>
                    <td className="py-3 px-4 text-[#101828]">{f.supportePar}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf3] text-[#067647]">{f.statut}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-[#f7f8fa] font-bold">
                  <td className="py-3 px-4 text-[#101828]" colSpan={2}>Total des frais</td>
                  <td className="py-3 px-4 text-right text-[#101828] whitespace-nowrap" colSpan={2}>{data.totalFrais.toLocaleString("fr-FR")} {event.devise}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sousOnglet === "recus" && (
        <div className="overflow-x-auto border border-[#e4e7ec] rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#eaecf0] text-[#8b95a8] uppercase tracking-wider text-[9px] font-bold">
                <th className="text-left py-3 px-4">Document</th>
                <th className="text-center py-3 px-4">1er envoi</th>
                <th className="text-center py-3 px-4">2ème envoi</th>
                <th className="text-center py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.documentsRecus.map((d: any, idx: number) => (
                <tr key={idx} className="border-b border-[#f7f8fa]">
                  <td className="py-3 px-4 font-semibold text-[#101828]">{d.type}</td>
                  <td className="py-3 px-4 text-center text-[#101828]">{d.premierEnvoi}</td>
                  <td className="py-3 px-4 text-center text-[#101828]">{d.deuxiemeEnvoi}</td>
                  <td className="py-3 px-4 text-center font-semibold text-[#101828]">{d.total}</td>
                </tr>
              ))}
              <tr className="bg-[#f7f8fa] font-bold">
                <td className="py-3 px-4 text-[#101828]">Total général</td>
                <td className="py-3 px-4 text-center text-[#101828]">{data.documentsRecus.reduce((a: number, d: any) => a + d.premierEnvoi, 0)}</td>
                <td className="py-3 px-4 text-center text-[#101828]">{data.documentsRecus.reduce((a: number, d: any) => a + d.deuxiemeEnvoi, 0)}</td>
                <td className="py-3 px-4 text-center text-[#101828]">{data.documentsRecus.reduce((a: number, d: any) => a + d.total, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {sousOnglet === "attaches" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {event.swifts?.map((swift, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 border border-[#e4e7ec] rounded-xl hover:border-[#ea580c] hover:bg-[#fff4ed] cursor-pointer transition group">
              <div className="w-10 h-10 rounded-lg bg-[#fff4ed] text-[#ea580c] flex items-center justify-center group-hover:bg-[#ea580c] group-hover:text-white transition">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#101828] truncate">{`${swift.type} - ${swift.reference}`}</p>
                <p className="text-xs text-[#8b95a8]">Source : Remise</p>
              </div>
              <button className="text-[#8b95a8] hover:text-[#ea580c] transition">
                <Download size={18} />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3 p-4 border border-[#e4e7ec] rounded-xl hover:border-[#ea580c] hover:bg-[#fff4ed] cursor-pointer transition group">
            <div className="w-10 h-10 rounded-lg bg-[#fff4ed] text-[#ea580c] flex items-center justify-center group-hover:bg-[#ea580c] group-hover:text-white transition">
              <FileText size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#101828] truncate">MT799 - SWIFT-2026-0405-01</p>
              <p className="text-xs text-[#8b95a8]">Source : Accusé</p>
            </div>
            <button className="text-[#8b95a8] hover:text-[#ea580c] transition">
              <Download size={18} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
