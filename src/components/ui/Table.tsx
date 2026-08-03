import { ReactNode } from "react";

interface TableProps {
  columns: { key: string; label: string; className?: string }[];
  data: Record<string, ReactNode>[];
  emptyMessage?: string;
  className?: string;
}

export default function Table({ columns, data, emptyMessage = "Aucune donnée", className = "" }: TableProps) {
  return (
    <div className={`table-container ${className}`}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className={column.className || ""}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center text-text-muted py-8">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column.key}>{row[column.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
