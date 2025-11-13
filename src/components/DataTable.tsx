import React from 'react';
import type { TableRow } from '../types';

interface DataTableProps {
  data: TableRow[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-slate-500 p-8">داده‌ای برای نمایش وجود ندارد.</p>;
  }

  // Filter out internal properties like _diffs from the headers
  const headers = Object.keys(data[0]).filter(key => key !== '_diffs');

  return (
    <div className="overflow-x-auto max-h-[600px]">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {headers.map(header => (
              <th key={header} scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50">
              {headers.map(header => {
                const isDifferent = row._diffs && row._diffs[header];
                const cellClasses = `px-6 py-4 whitespace-nowrap text-sm text-slate-700 ${isDifferent ? 'bg-yellow-200' : ''}`;
                return (
                  <td key={`${rowIndex}-${header}`} className={cellClasses}>
                    {row[header]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};