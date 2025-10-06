import { MergedRow } from '@/types/merge';

/**
 * Convert merged data to CSV format
 * Escapes quotes and handles newlines properly
 */
export function toCSV(columns: string[], rows: MergedRow[]): string {
  const escapeCell = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) {
      return '';
    }
    
    const str = String(value);
    
    // Escape double quotes by doubling them
    const escaped = str.replace(/"/g, '""');
    
    // Wrap in quotes if contains comma, newline, or quote
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
      return `"${escaped}"`;
    }
    
    return escaped;
  };

  // Header row
  const header = columns.map(col => escapeCell(col)).join(',');
  
  // Data rows - extract value from MergedCell
  const dataRows = rows.map(row => {
    return columns.map(col => {
      const cell = row[col];
      const value = cell?.value ?? null;
      return escapeCell(value);
    }).join(',');
  });

  return [header, ...dataRows].join('\n');
}

/**
 * Download CSV file to browser
 */
export function downloadCSV(columns: string[], rows: MergedRow[], filename: string): void {
  const csv = toCSV(columns, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
