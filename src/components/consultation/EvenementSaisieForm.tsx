"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { useTomStore } from "@/store/useTomStore";
import type { DossierTrade, EvenementTrade, MontantAvecDevise } from "@/domain/consultation-detail";

function isMontantAvecDevise(v: unknown): v is MontantAvecDevise {
  return !!v && typeof v === "object" && "valeur" in (v as object) && "devise" in (v as object);
}

interface EvenementSaisieFormProps {
  dossier: DossierTrade;
  nature: string;
  evenement?: EvenementTrade;
  onCancel: () => void;
  onSaved: (reference: string) => void;
}

export default function EvenementSaisieForm({ dossier, nature, evenement, onCancel, onSaved }: EvenementSaisieFormProps) {
  const ajouterEvenementDossier = useTomStore((s) => s.ajouterEvenementDossier);
  const modifierEvenementDossier = useTomStore((s) => s.modifierEvenementDossier);

  const aujourdhui = new Date().toISOString().slice(0, 10);
  const encours = dossier.donnees["encours"];
  const encoursOk = isMontantAvecDevise(encours) ? encours : null;
  const montantRemise = dossier.donnees["montantRemise"];
  const montantRemiseOk = isMontantAvecDevise(montantRemise) ? montantRemise : null;
  const deviseDossier = encoursOk?.devise ?? montantRemiseOk?.devise ?? "";
  const isAcceptationDossier = String(dossier.donnees["conditionsRemiseDocuments"] ?? "").toLowerCase().includes("acceptation");

  const s = evenement?.saisieAgence;
  const p = s?.paiement;

  const DEFAUT_PAIEMENT_RECU_DE = "GLAXO DELICES DU SUD SARL\n42-44 ANGLE BLD RACHIDI ET\nABOU HAMED EL GHAZALI\n20100 CASABLANCA\nMAROC";

  const BANQUES = [
    { nom: "Société Générale Paris", pays: "France", bic: "SOGEFRPP", adresse: "29 Bd Haussmann, 75009 Paris, France" },
    { nom: "BNP Paribas", pays: "France", bic: "BNPAFRPP", adresse: "16 Bd des Italiens, 75009 Paris, France" },
    { nom: "Crédit Agricole", pays: "France", bic: "AGRIFRPP", adresse: "12 Pl. des États-Unis, 92120 Montrouge, France" },
    { nom: "Commerzbank AG", pays: "Allemagne", bic: "COBADEFF", adresse: "Kaiserstraße, 60311 Frankfurt am Main, Allemagne" },
    { nom: "Deutsche Bank", pays: "Allemagne", bic: "DEUTDEFF", adresse: "Taunusanlage 12, 60325 Frankfurt am Main, Allemagne" },
    { nom: "UniCredit", pays: "Italie", bic: "UNCRITMM", adresse: "Piazza Gae Aulenti 3, 20154 Milano, Italie" },
    { nom: "Banco Santander", pays: "Espagne", bic: "BSCHESMM", adresse: "Av. de Cantabria, 28660 Boadilla del Monte, Madrid, Espagne" },
    { nom: "HSBC Bank plc", pays: "Royaume-Uni", bic: "HBUKGB4B", adresse: "8 Canada Square, London E14 5HQ, Royaume-Uni" },
    { nom: "Attijariwafa Bank", pays: "Maroc", bic: "BCMAMAMC", adresse: "2 Bd Moulay Youssef, 20100 Casablanca, Maroc" },
    { nom: "Banque Populaire", pays: "Maroc", bic: "BCPOMAMC", adresse: "101 Bd Mohamed Zerktouni, 20100 Casablanca, Maroc" },
    { nom: "BMCE Bank", pays: "Maroc", bic: "BMCEMAMC", adresse: "140 Av. Hassan II, 20070 Casablanca, Maroc" },
  ];

  const [popupBanque, setPopupBanque] = useState<"banque" | "partie" | null>(null);
  const [rechNom, setRechNom] = useState("");
  const [rechBic, setRechBic] = useState("");
  const [rechPays, setRechPays] = useState("");
  const banquesFiltrees = BANQUES.filter(b =>
    b.nom.toLowerCase().includes(rechNom.toLowerCase()) &&
    b.bic.toLowerCase().includes(rechBic.toLowerCase()) &&
    b.pays.toLowerCase().includes(rechPays.toLowerCase())
  );
  const fermerPopupBanque = () => { setPopupBanque(null); setRechNom(""); setRechBic(""); setRechPays(""); };
  const choisirBanque = (b: { nom: string; adresse: string }) => {
    if (popupBanque === "partie") {
      setPaiementForm(f => ({ ...f, partieAPayer: b.nom, adressePartieAPayer: b.adresse }));
    } else {
      setPaiementForm(f => ({ ...f, banqueBeneficiaire: b.nom, adresseBanqueBeneficiaire: b.adresse }));
    }
    fermerPopupBanque();
  };

  const [dateEvenement, setDateEvenement] = useState(s?.dateEvenement ?? aujourdhui);

  const [montant, setMontant] = useState(
    evenement?.montant
    ?? (nature === "Paiement" ? (encoursOk?.valeur ?? 0)
      : nature === "Acceptation & Aval de la traite" ? (montantRemiseOk?.valeur ?? 0)
      : 0)
  );
  const [datePaiement, setDatePaiement] = useState(s?.datePaiement ?? aujourdhui);
  const [effet, setEffet] = useState<"Avec aval" | "Sans aval">(s?.effet ?? "Avec aval");
  const echDossier = dossier.donnees["dateEcheance"];
  const [dateEcheanceEvt, setDateEcheanceEvt] = useState(
    s?.dateEcheance ?? (nature === "Acceptation & Aval de la traite" && echDossier ? String(echDossier).slice(0, 10) : "")
  );
  const [motif, setMotif] = useState(s?.motif ?? "Refus de paiement");
  const [destinataire, setDestinataire] = useState(s?.destinataire ?? dossier.client ?? "");

  const [paiementForm, setPaiementForm] = useState({
    referencePaiementRecu: p?.referencePaiementRecu ?? "",
    partieOriginePaiement: p?.partieOriginePaiement ?? "Tiré",
    paiementRecuDe: p?.paiementRecuDe ?? DEFAUT_PAIEMENT_RECU_DE,
    dateReception: p?.dateReception ?? aujourdhui,
    instructionPaiement: p?.instructionPaiement ?? "",
    naturePartieAPayer: p?.naturePartieAPayer ?? "Banque étrangère",
    partieAPayer: p?.partieAPayer ?? "",
    adressePartieAPayer: p?.adressePartieAPayer ?? "",
    referenceBeneficiaire: p?.referenceBeneficiaire ?? "",
    modePaiement: p?.modePaiement ?? "Payer",
    banqueBeneficiaire: p?.banqueBeneficiaire ?? "",
    adresseBanqueBeneficiaire: p?.adresseBanqueBeneficiaire ?? "",
    compteBeneficiaire: p?.compteBeneficiaire ?? "",
    remiseAExpirer: p?.remiseAExpirer ?? false,
    paiementAvecRecours: p?.paiementAvecRecours ?? false,
    coursApplique: p?.coursApplique != null ? String(p.coursApplique) : "",
    montantPaye: p?.montantPaye != null ? String(p.montantPaye) : "",
    contrevaleurDirhams: p?.contrevaleurDirhams != null ? String(p.contrevaleurDirhams) : "",
    naturePaiement: p?.naturePaiement ?? (isAcceptationDossier ? "Contre acceptation" : "Contre paiement"),
    montantRestant: p?.montantRestant != null ? String(p.montantRestant) : "",
    numeroUetr: p?.numeroUetr ?? "",
    dateValeur: p?.dateValeur ?? aujourdhui,
    compteDebite: p?.compteDebite ?? "",
    agenceDomiciliation: p?.agenceDomiciliation ?? "",
  });
  const setP = (k: keyof typeof paiementForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setPaiementForm(f => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const montantRequis = nature === "Paiement" || nature === "Acceptation & Aval de la traite";

  function enregistrer() {
    const saisie = {
      nature,
      montant: montantRequis ? montant : null,
      devise: deviseDossier,
      saisieAgence: {
        dateEvenement,

        datePaiement: nature === "Paiement" ? datePaiement : undefined,
        effet: nature === "Acceptation & Aval de la traite" ? effet : undefined,
        dateEcheance: nature === "Acceptation & Aval de la traite" && dateEcheanceEvt ? dateEcheanceEvt : undefined,
        motif: nature === "Retour des documents" ? motif : undefined,
        destinataire: nature === "Demande de remise des documents" ? destinataire : undefined,
        paiement: nature === "Paiement" ? {
          referencePaiementRecu: paiementForm.referencePaiementRecu || undefined,
          partieOriginePaiement: paiementForm.partieOriginePaiement || undefined,
          paiementRecuDe: paiementForm.paiementRecuDe || undefined,
          dateReception: paiementForm.dateReception || undefined,
          instructionPaiement: paiementForm.instructionPaiement || undefined,
          naturePartieAPayer: paiementForm.naturePartieAPayer || undefined,
          partieAPayer: paiementForm.partieAPayer || undefined,
          adressePartieAPayer: paiementForm.adressePartieAPayer || undefined,
          referenceBeneficiaire: paiementForm.referenceBeneficiaire || undefined,
          modePaiement: paiementForm.modePaiement || undefined,
          banqueBeneficiaire: paiementForm.banqueBeneficiaire || undefined,
          adresseBanqueBeneficiaire: paiementForm.adresseBanqueBeneficiaire || undefined,
          compteBeneficiaire: paiementForm.compteBeneficiaire || undefined,
          remiseAExpirer: paiementForm.remiseAExpirer,
          paiementAvecRecours: paiementForm.paiementAvecRecours,
          coursApplique: paiementForm.coursApplique ? Number(paiementForm.coursApplique) : undefined,
          montantPaye: paiementForm.montantPaye ? Number(paiementForm.montantPaye) : undefined,
          contrevaleurDirhams: paiementForm.contrevaleurDirhams ? Number(paiementForm.contrevaleurDirhams) : undefined,
          naturePaiement: paiementForm.naturePaiement || undefined,
          montantRestant: paiementForm.montantRestant ? Number(paiementForm.montantRestant) : undefined,
          numeroUetr: paiementForm.numeroUetr || undefined,
          dateValeur: paiementForm.dateValeur || undefined,
          compteDebite: paiementForm.compteDebite || undefined,
          agenceDomiciliation: paiementForm.agenceDomiciliation || undefined,
        } : undefined,
      },
    };
    if (evenement) {
      modifierEvenementDossier(dossier.reference, evenement.reference, saisie);
      onSaved(evenement.reference);
    } else {
      const ev = ajouterEvenementDossier(dossier.reference, saisie);
      onSaved(ev.reference);
    }
  }

  return (
    <div>
      <div className="bg-[#FAEEDA] text-[#854F0B] text-xs rounded-lg p-2 mb-4">
        {evenement
          ? "L'événement reste en statut En attente. L'encours et le dossier seront mis à jour après validation."
          : "L'événement sera créé en statut En attente. L'encours et le dossier seront mis à jour après validation."}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="text-label">Référence de la remise</label>
          <input className="input w-full bg-gray-50" value={dossier.reference} readOnly />
        </div>
        <div>
          <label className="text-label">Date de création</label>
          <input
            className="input w-full bg-gray-50"
            value={dossier.evenements[0]?.dateCreation ? new Date(dossier.evenements[0].dateCreation).toLocaleDateString("fr-FR") : "—"}
            readOnly
          />
        </div>
        <div>
          <label className="text-label">Conditions de remise des documents</label>
          <input className="input w-full bg-gray-50" value={String(dossier.donnees["conditionsRemiseDocuments"] ?? "—")} readOnly />
        </div>

        {nature === "Acceptation & Aval de la traite" && (
          <>
            <div>
              <label className="text-label">Effet</label>
              <select className="input w-full" value={effet} onChange={(e) => setEffet(e.target.value as "Avec aval" | "Sans aval")}>
                <option value="Avec aval">Avec aval</option>
                <option value="Sans aval">Sans aval</option>
              </select>
            </div>
            <div>
              <label className="text-label">Date d'échéance</label>
              <input type="date" className="input w-full" value={dateEcheanceEvt} onChange={(e) => setDateEcheanceEvt(e.target.value)} />
            </div>
          </>
        )}

        {nature === "Retour des documents" && (
          <div>
            <label className="text-label">Motif</label>
            <select className="input w-full" value={motif} onChange={(e) => setMotif(e.target.value)}>
              <option>Refus de paiement</option>
              <option>Refus d'acceptation</option>
              <option>Documents non conformes</option>
              <option>Demande du remettant</option>
              <option>Autre</option>
            </select>
          </div>
        )}

        {nature === "Demande de remise des documents" && (
          <div>
            <label className="text-label">Destinataire</label>
            <input className="input w-full" value={destinataire} onChange={(e) => setDestinataire(e.target.value)} />
          </div>
        )}
      </div>

      {/* ===== Blocs Paiement — mêmes blocs que la page de consultation ===== */}
      {nature === "Paiement" && (
        <div className="space-y-4 mb-4">

          {/* Détails du paiement reçu */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails du paiement reçu</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">Partie à l'origine du paiement</label>
                <select className="input w-full" value={paiementForm.partieOriginePaiement} onChange={setP("partieOriginePaiement")}>
                  <option>Tiré</option>
                  <option>Tireur</option>
                  <option>Banque remettante</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-label">Référence du paiement reçu</label>
                <input className="input w-full" value={paiementForm.referencePaiementRecu} onChange={setP("referencePaiementRecu")} placeholder="Ex. LIC3344992" />
              </div>
              <div>
                <label className="text-label">Date de réception</label>
                <input type="date" className="input w-full" value={paiementForm.dateReception} onChange={setP("dateReception")} />
              </div>
              <div>
                <label className="text-label">Paiement reçu de</label>
                <textarea className="input w-full" rows={3} value={paiementForm.paiementRecuDe} onChange={setP("paiementRecuDe")} placeholder="Nom et adresse du payeur" />
              </div>
              <div className="md:col-span-2">
                <label className="text-label">Instruction du paiement</label>
                <textarea className="input w-full" rows={3} value={paiementForm.instructionPaiement} onChange={setP("instructionPaiement")} />
              </div>
            </div>
          </div>

          {/* Bénéficiaire du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Bénéficiaire du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-label">Nature de la partie à payer</label>
                <select className="input w-full" value={paiementForm.naturePartieAPayer} onChange={setP("naturePartieAPayer")}>
                  <option>Banque étrangère</option>
                  <option>Tireur</option>
                  <option>Autre</option>
                </select>
              </div>
              <div>
                <label className="text-label">Banque du bénéficiaire</label>
                <div className="relative">
                  <input className="input w-full pr-9" value={paiementForm.banqueBeneficiaire} onChange={setP("banqueBeneficiaire")} />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#e8632b] transition"
                    onClick={() => setPopupBanque("banque")}
                    title="Rechercher une banque"
                  >
                    <Search size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-label">Référence</label>
                <input className="input w-full" value={paiementForm.referenceBeneficiaire} onChange={setP("referenceBeneficiaire")} />
              </div>
              <div>
                <label className="text-label">Partie à payer</label>
                <div className="relative">
                  <textarea
                    className={`input w-full ${paiementForm.naturePartieAPayer === "Banque étrangère" ? "pr-9" : ""}`}
                    rows={3}
                    value={paiementForm.partieAPayer}
                    onChange={setP("partieAPayer")}
                    placeholder="Nom de la partie à payer"
                  />
                  {paiementForm.naturePartieAPayer === "Banque étrangère" && (
                    <button
                      type="button"
                      className="absolute right-2 top-3 text-[#94a3b8] hover:text-[#e8632b] transition"
                      onClick={() => setPopupBanque("partie")}
                      title="Rechercher une banque"
                    >
                      <Search size={15} />
                    </button>
                  )}
                </div>
              </div>
              <div>
                <textarea
                  className="input w-full bg-gray-50"
                  rows={3}
                  value={paiementForm.adresseBanqueBeneficiaire}
                  onChange={setP("adresseBanqueBeneficiaire")}
                  placeholder="Adresse de la banque"
                />
              </div>
              <div>
                <label className="text-label">Mode de paiement</label>
                <select className="input w-full" value={paiementForm.modePaiement} onChange={setP("modePaiement")}>
                  <option>Payer</option>
                  <option>Paiement avec financement</option>
                  <option>Offre de financement</option>
                </select>
              </div>
              <div>
                <textarea
                  className="input w-full bg-gray-50"
                  rows={3}
                  value={paiementForm.adressePartieAPayer}
                  onChange={setP("adressePartieAPayer")}
                  placeholder="Adresse de la partie à payer"
                />
              </div>
              <div>
                <label className="text-label">Numéro de compte du bénéficiaire</label>
                <input className="input w-full" value={paiementForm.compteBeneficiaire} onChange={setP("compteBeneficiaire")} />
              </div>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.remiseAExpirer} onChange={setP("remiseAExpirer")} />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Remise à expirer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" checked={paiementForm.paiementAvecRecours} onChange={setP("paiementAvecRecours")} />
                  <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Paiement avec recours</span>
                </label>
              </div>
            </div>
          </div>

          {/* Détails du paiement */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Détails du paiement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant des documents</label>
                  <input className="input w-full bg-gray-50" value={montantRemiseOk ? `${montantRemiseOk.valeur.toLocaleString("fr-FR")} ${montantRemiseOk.devise}` : "—"} readOnly />
                </div>
                <div>
                  <label className="text-label">Nature du paiement</label>
                  <select className="input w-full" value={paiementForm.naturePaiement} onChange={setP("naturePaiement")}>
                    <option>Contre paiement</option>
                    <option>Contre acceptation</option>
                  </select>
                </div>
                <div>
                  <label className="text-label">Montant restant à régler</label>
                  <input type="number" className="input w-full" value={paiementForm.montantRestant} onChange={setP("montantRestant")} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Montant à payer</label>
                  <input type="number" className="input w-full" value={paiementForm.montantPaye} onChange={setP("montantPaye")} />
                </div>
                <div>
                  <label className="text-label">Cours appliqué</label>
                  <input type="number" step="0.0001" className="input w-full" value={paiementForm.coursApplique} onChange={setP("coursApplique")} placeholder="Ex. 10,85" />
                </div>
                <div>
                  <label className="text-label">Contrevaleur en dirhams</label>
                  <input type="number" className="input w-full" value={paiementForm.contrevaleurDirhams} onChange={setP("contrevaleurDirhams")} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-label">Date de valeur</label>
                  <input type="date" className="input w-full" value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Informations sur le règlement */}
          <div className="border border-[#e5e8ec] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"></div>
              <div className="text-sm font-semibold text-[#0f172a]">Informations sur le règlement</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-label">Numéro UETR</label>
                <input className="input w-full" value={paiementForm.numeroUetr} onChange={setP("numeroUetr")} placeholder="Ex. 56f0c1ce-…" />
              </div>
              <div>
                <label className="text-label">Date de valeur</label>
                <input type="date" className="input w-full" value={paiementForm.dateValeur} onChange={setP("dateValeur")} />
              </div>
              <div>
                <label className="text-label">Numéro du compte débité</label>
                <input className="input w-full" value={paiementForm.compteDebite} onChange={setP("compteDebite")} />
              </div>
              <div>
                <label className="text-label">Agence de domiciliation</label>
                <input className="input w-full" value={paiementForm.agenceDomiciliation} onChange={setP("agenceDomiciliation")} placeholder="Ex. AGC-135 Rabat" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel}>Annuler</button>
        <button className="btn-primary" disabled={montantRequis && montant <= 0} onClick={enregistrer}>
          {evenement ? "Enregistrer les modifications" : "Enregistrer l'événement"}
        </button>
      </div>

      {/* Popup recherche banque */}
      {popupBanque && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={fermerPopupBanque} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ec]">
              <div className="text-sm font-semibold text-[#0f172a]">Rechercher une banque</div>
              <button
                className="h-8 w-8 rounded-lg border border-[#e5e8ec] text-[#64748b] hover:text-[#e8632b] hover:border-[#e8632b] transition flex items-center justify-center"
                onClick={fermerPopupBanque}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#e5e8ec]">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-label">Nom</label>
                  <input className="input w-full" value={rechNom} onChange={(e) => setRechNom(e.target.value)} autoFocus />
                </div>
                <div>
                  <label className="text-label">Code BIC</label>
                  <input className="input w-full font-mono" value={rechBic} onChange={(e) => setRechBic(e.target.value)} />
                </div>
                <div>
                  <label className="text-label">Pays</label>
                  <input className="input w-full" value={rechPays} onChange={(e) => setRechPays(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="overflow-y-auto py-2">
              {banquesFiltrees.length === 0 && (
                <div className="px-5 py-6 text-sm text-[#64748b] text-center">Aucune banque trouvée.</div>
              )}
              {banquesFiltrees.map((b) => (
                <button
                  key={b.nom}
                  type="button"
                  className="w-full text-left px-5 py-3 hover:bg-orange-50 transition"
                  onClick={() => choisirBanque(b)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-[#0f172a]">{b.nom}</div>
                    <div className="font-mono text-[11px] text-[#64748b]">{b.bic}</div>
                  </div>
                  <div className="text-xs text-[#64748b]">{b.adresse} · {b.pays}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
