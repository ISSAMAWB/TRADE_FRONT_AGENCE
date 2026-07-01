import { ReactNode } from "react";
import Button from "./Button";

interface CollapsibleFilterPanelProps {
  isOpen: boolean;
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
}

export default function CollapsibleFilterPanel({ isOpen, children, onSearch, onReset }: CollapsibleFilterPanelProps) {
  return (
    <div
      className={`overflow-hidden ${
        isOpen ? "filter-panel-enter" : "filter-panel-exit"
      }`}
    >
      <div className="card mt-4 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {children}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onReset}>
            Reset
          </Button>
          <Button variant="primary" onClick={onSearch}>
            Search
          </Button>
        </div>
      </div>
    </div>
  );
}
