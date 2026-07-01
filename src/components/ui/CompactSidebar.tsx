import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mail, FileSpreadsheet, FolderOpen, Clock, Bell, Settings, Lock } from "lucide-react";
import { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface CompactSidebarProps {
  groups: NavGroup[];
  onReset?: () => void;
}

export default function CompactSidebar({ groups, onReset }: CompactSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-20 flex flex-col bg-slate-900 border-r border-slate-800">
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-center border-b border-slate-800">
        <div className="h-10 w-10 rounded-lg bg-orange-500 text-white grid place-items-center font-bold text-lg">
          T
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-auto flex flex-col items-center gap-2">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="w-full">
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg cursor-not-allowed text-slate-400"
                    title={item.label}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-[10px] text-center leading-tight line-clamp-2">{item.label}</span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all ${
                    active
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-slate-50 hover:bg-slate-800"
                  }`}
                  title={item.label}
                >
                  <div className="w-8 h-8 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[10px] text-center leading-tight line-clamp-2">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {onReset && (
        <div className="p-2 border-t border-slate-800">
          <button
            onClick={onReset}
            className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-slate-50 hover:text-white hover:bg-slate-800 transition w-full"
            title="Réinitialiser démo"
          >
            <Settings size={16} />
            <span className="text-[10px]">Reset</span>
          </button>
        </div>
      )}
    </aside>
  );
}
