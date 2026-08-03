import { Bell, CircleUser, ChevronDown, Search, SlidersHorizontal } from "lucide-react";

interface HeaderProps {
  title?: string;
  userName?: string;
  userRole?: string;
  onSearch?: (value: string) => void;
}

export default function Header({ title = "Trade Portal", userName = "Agent agence", userRole = "Agence Casablanca", onSearch }: HeaderProps) {
  return (
    <header className="h-16 bg-dark-900 border-b border-dark-800 flex items-center px-6 gap-4 shadow-header">
      {/* Application Title */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-500 text-white grid place-items-center font-bold text-lg">
          T
        </div>
        <div>
          <div className="text-base font-semibold leading-none text-white">{title}</div>
          <div className="text-xs text-dark-50 mt-1">Orchestration Trade</div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-2xl mx-8">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
          <input
            type="text"
            placeholder="Rechercher un dossier, client, référence..."
            className="input-lg pl-12 w-full"
            onChange={(e) => onSearch?.(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-text-light hover:text-primary-500 transition">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <button className="btn-ghost text-white hover:bg-dark-700 h-10 w-10 rounded-lg">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-dark-800">
          <CircleUser size={32} className="text-dark-50" />
          <div className="text-sm leading-tight">
            <div className="font-semibold text-white">{userName}</div>
            <div className="text-xs text-dark-50">{userRole}</div>
          </div>
          <ChevronDown size={16} className="text-dark-50" />
        </div>
      </div>
    </header>
  );
}
