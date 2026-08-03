import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Lock } from "lucide-react";
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

interface SidebarProps {
  groups: NavGroup[];
  onReset?: () => void;
}

export default function Sidebar({ groups, onReset }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex flex-col bg-dark-900 border-r border-dark-800">
      {/* Logo Section */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-dark-800">
        <div className="h-10 w-10 rounded-lg bg-primary-500 text-white grid place-items-center font-bold text-lg">
          T
        </div>
        <div>
          <div className="text-sm font-semibold leading-none text-white">Trade Portal</div>
          <div className="text-xs text-dark-50 mt-1">Orchestration Trade</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-auto">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-4">
            {group.title && (
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-dark-50 mb-2">
                {group.title}
              </div>
            )}
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
              if (item.disabled) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 cursor-not-allowed text-dark-400"
                    title="Hors périmètre MVP actuel"
                  >
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    <span className="flex-1">{item.label}</span>
                    <Lock size={12} />
                  </div>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
                    active
                      ? "bg-primary-500/10 text-primary-500 font-semibold border-l-4 border-primary-500"
                      : "text-dark-50 hover:bg-dark-800"
                  }`}
                >
                  <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {onReset && (
        <div className="p-4 border-t border-dark-800">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-xs text-dark-50 hover:text-white transition w-full px-3 py-2 rounded-lg hover:bg-dark-800"
          >
            <Settings size={14} />
            Réinitialiser démo
          </button>
        </div>
      )}
    </aside>
  );
}
