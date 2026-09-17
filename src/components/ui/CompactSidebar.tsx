"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, ChevronRight, ChevronDown, ChevronLeft } from "lucide-react";
import { ReactNode, useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  isSubItem?: boolean;
  badge?: number;
  children?: NavItem[];
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

interface CompactSidebarProps {
  groups: NavGroup[];
  onReset?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function CompactSidebar({ groups, onReset, isCollapsed = false, onToggleCollapse }: CompactSidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (label: string, depth: number) => {
    if (depth === 0) return;
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (item: NavItem): boolean => {
    if (item.href === "#") return false;
    return pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
  };

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false;
    return item.children.some(child => isActive(child) || isChildActive(child));
  };

  const NavItemRenderer = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const active = isActive(item);
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = depth === 0 || expandedItems.has(item.label);
    const childActive = isChildActive(item);

    if (item.disabled) {
      return (
        <div
          key={item.href + depth}
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg cursor-not-allowed text-slate-500`}
          title={item.label}
          style={{ marginLeft: isCollapsed ? 0 : depth * 12 }}
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {item.icon}
          </div>
          {!isCollapsed && <span className="text-sm text-slate-500">{item.label}</span>}
        </div>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.label + depth} className="w-full">
          {/* Parent Item */}
          <button
            onClick={() => !isCollapsed && toggleExpanded(item.label, depth)}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-all ${
              childActive || active
                ? "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500"
                : "text-slate-300 hover:bg-slate-800"
            }`}
            title={item.label}
            style={{ marginLeft: isCollapsed ? 0 : depth * 12 }}
          >
            <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                {item.icon}
              </div>
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </div>
            {!isCollapsed && hasChildren && depth > 0 && (isExpanded ? (
              <ChevronDown size={14} className="text-slate-400" />
            ) : (
              <ChevronRight size={14} className="text-slate-400" />
            ))}
          </button>

          {/* Children - hidden in collapsed mode */}
          {!isCollapsed && isExpanded && item.children && (
            <div className="mt-1 space-y-1">
              {item.children.map((child) => (
                <NavItemRenderer key={child.label + (depth + 1)} item={child} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href + depth}
        href={item.href}
        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all ${
          active
            ? "bg-orange-500/10 text-orange-500 border-l-2 border-orange-500"
            : "text-slate-300 hover:bg-slate-800"
        }`}
        title={item.label}
        style={{ marginLeft: isCollapsed ? 0 : depth * 12 }}
      >
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
          {item.icon}
        </div>
        {!isCollapsed && <span className="text-sm font-medium flex-1">{item.label}</span>}
        {!isCollapsed && item.badge != null && item.badge > 0 && (
          <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-white text-[10px] font-semibold grid place-items-center">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300`}>
      {/* Logo Section */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-4'} border-b border-slate-800`}>
        <img
          src="/logo-attijariwafa.png"
          alt="Attijariwafa"
          className="h-10 w-10 object-contain"
        />
        {!isCollapsed && (
          <span className="ml-3 text-lg font-semibold text-white">BORJ TRADE</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-auto flex flex-col gap-1">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="w-full">
            {/* Group Title - hidden in collapsed mode */}
            {!isCollapsed && group.title && (
              <div className="px-3 py-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {group.title}
                </span>
              </div>
            )}

            {/* Group Items */}
            {group.items.map((item) => (
              <NavItemRenderer key={item.label} item={item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition w-full mb-2`}
            title={isCollapsed ? "Développer" : "Réduire"}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!isCollapsed && <span className="text-sm">Réduire</span>}
          </button>
        )}
        {onReset && (
          <button
            onClick={onReset}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition w-full`}
            title="Réinitialiser démo"
          >
            <Settings size={16} />
            {!isCollapsed && <span className="text-sm">Reset</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
