import { SlidersHorizontal } from "lucide-react";

interface FilterToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export default function FilterToggleButton({ isOpen, onClick, className = "" }: FilterToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
        isOpen
          ? "bg-orange-500 text-white"
          : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
      } ${className}`}
      title={isOpen ? "Fermer les filtres" : "Ouvrir les filtres"}
    >
      <SlidersHorizontal size={18} />
    </button>
  );
}
