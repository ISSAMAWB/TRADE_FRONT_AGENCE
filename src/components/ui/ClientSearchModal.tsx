import { useState } from "react";
import { Search, X } from "lucide-react";
import Button from "./Button";
import dossiersData from "@/mocks/dossiers.json";

interface ClientSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientSelect: (client: { nom: string; compte: string }) => void;
}

export default function ClientSearchModal({ isOpen, onClose, onClientSelect }: ClientSearchModalProps) {
  const [raisonSociale, setRaisonSociale] = useState("");
  const [numeroCompte, setNumeroCompte] = useState("");

  const dossiers = dossiersData as any[];

  const clients = Array.from(new Set(dossiers.map((d: any) => d.client.compte))).map((compte: string) => {
    const dossier = dossiers.find((d: any) => d.client.compte === compte);
    return {
      nom: dossier?.client?.nom || "",
      compte: compte,
    };
  });

  const filteredClients = clients.filter((client) => {
    const matchRaison = !raisonSociale.trim() || client.nom.toLowerCase().includes(raisonSociale.toLowerCase().replace("%", ""));
    const matchCompte = !numeroCompte.trim() || client.compte.toLowerCase().includes(numeroCompte.toLowerCase());
    return matchRaison && matchCompte;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Rechercher un client</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-label">RAISON SOCIALE</label>
            <input
              value={raisonSociale}
              onChange={(e) => setRaisonSociale(e.target.value)}
              placeholder="Ex. Société% (contient Société)"
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-label">NUMÉRO DE COMPTE</label>
            <input
              value={numeroCompte}
              onChange={(e) => setNumeroCompte(e.target.value)}
              placeholder="Ex. 123456789"
              className="input w-full"
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600 mb-2">
              {filteredClients.length} client(s) trouvé(s)
            </div>
            <div className="max-h-64 overflow-auto border border-gray-200 rounded-lg">
              {filteredClients.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  Aucun client ne correspond à vos critères
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredClients.map((client, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onClientSelect(client);
                        onClose();
                        setRaisonSociale("");
                        setNumeroCompte("");
                      }}
                      className="w-full text-left p-3 hover:bg-gray-50 transition"
                    >
                      <div className="font-medium text-gray-900">{client.nom}</div>
                      <div className="text-sm text-gray-600">{client.compte}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
