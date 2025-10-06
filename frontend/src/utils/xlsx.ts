import { MergedRow } from '@/types/merge';
import { toCSV } from './csv';

/**
 * XLSX Export Utility
 * 
 * NOTE: This project does not currently have the 'xlsx' library installed.
 * To enable true .xlsx export, install SheetJS:
 * 
 *   npm install xlsx
 * 
 * Then uncomment the implementation below and remove the CSV fallback.
 * 
 * For now, this creates a CSV file with .xlsx extension as a demo fallback.
 */

export interface XLSXExportOptions {
  sheetName?: string;
  filename: string;
}

/**
 * Export to XLSX format (or CSV fallback if xlsx not installed)
 */
export function downloadXLSX(
  columns: string[], 
  rows: MergedRow[], 
  options: XLSXExportOptions
): void {
  const { filename } = options;
  
  // Check if xlsx is available (would be: import * as XLSX from 'xlsx')
  // @ts-ignore - checking for optional dependency
  if (typeof window !== 'undefined' && window.XLSX) {
    // @ts-ignore
    const XLSX = window.XLSX;
    
    // Convert MergedRow[] to array of plain objects
    const data = rows.map(row => {
      const obj: Record<string, any> = {};
      columns.forEach(col => {
        obj[col] = row[col]?.value ?? null;
      });
      return obj;
    });
    
    // Create workbook
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, options.sheetName || 'Data');
    
    // Download
    XLSX.writeFile(wb, filename);
  } else {
    // Fallback: CSV with warning in console
    console.warn(
      'xlsx library not installed. Exporting as CSV instead. ' +
      'To enable XLSX export, run: npm install xlsx'
    );
    
    // Use CSV export but keep .xlsx extension to show intent
    const csv = toCSV(columns, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    // Change extension to .csv for the fallback
    link.download = filename.replace(/\.xlsx$/, '.csv');
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Check if XLSX export is truly available
 */
export function isXLSXAvailable(): boolean {
  // @ts-ignore
  return typeof window !== 'undefined' && !!window.XLSX;
}
