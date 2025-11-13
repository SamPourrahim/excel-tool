
import React from 'react';

interface ColumnSelectorProps {
  id: string;
  label: string;
  columns: string[];
  selectedColumn: string;
  onColumnChange: (column: string) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ id, label, columns, selectedColumn, onColumnChange }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">
        {label}
      </label>
      <select
        id={id}
        value={selectedColumn}
        onChange={(e) => onColumnChange(e.target.value)}
        className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
      >
        <option value="" disabled>یک ستون را انتخاب کنید...</option>
        {columns.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    </div>
  );
};
