import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  userName?: string;
  userRole?: string;
  navGroups?: any[];
  onSearch?: (value: string) => void;
  onReset?: () => void;
}

export default function PageLayout({
  children,
  title,
  userName,
  userRole,
  navGroups,
  onSearch,
  onReset,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header title={title} userName={userName} userRole={userRole} onSearch={onSearch} />
      <div className="flex flex-1">
        {navGroups && <Sidebar groups={navGroups} onReset={onReset} />}
        <main className="flex-1 overflow-auto p-6 bg-bg-secondary">
          {children}
        </main>
      </div>
    </div>
  );
}
