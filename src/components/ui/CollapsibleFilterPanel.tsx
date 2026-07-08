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
        {children}
        <div className="flex justify-end gap-2 mt-4">
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
