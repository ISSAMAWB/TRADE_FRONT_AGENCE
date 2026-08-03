import { ReactNode } from "react";
import Shell from "./Shell";

interface ConsultationLayoutProps {
  children: ReactNode;
  onFilterToggle?: () => void;
  isFilterOpen?: boolean;
}

export default function ConsultationLayout({ children, onFilterToggle, isFilterOpen }: ConsultationLayoutProps) {
  return (
    <Shell
      showFilterButton={!!onFilterToggle}
      onFilterToggle={onFilterToggle}
      isFilterOpen={isFilterOpen}
    >
      {children}
    </Shell>
  );
}
