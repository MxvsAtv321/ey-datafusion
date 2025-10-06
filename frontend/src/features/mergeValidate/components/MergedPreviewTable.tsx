import React, { useState } from 'react';
import { MergedRow, Lineage } from '@/types/merge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { AlertCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MergedPreviewTableProps {
  columns: string[];
  rows: MergedRow[];
  loading?: boolean;
  error?: string | null;
  secureMode?: boolean;
  filter?: {
    issuesOnly?: boolean;
    query?: string;
  };
  issueRowIndices?: Set<number>;
  className?: string;
  onRetry?: () => void;
}

const LineageTooltip: React.FC<{ lineage: Lineage[]; secureMode: boolean }> = ({
  lineage,
  secureMode,
}) => {
  return (
    <div className="space-y-2 text-xs">
      <p className="font-semibold">Data Lineage:</p>
      {lineage.map((lin, idx) => (
        <div key={idx} className="space-y-0.5 border-l-2 border-primary/50 pl-2">
          <p>
            <span className="font-medium">Source:</span>{' '}
            {secureMode ? '••••••' : lin.dataset}
          </p>
          <p>
            <span className="font-medium">Column:</span>{' '}
            {secureMode ? '••••••' : lin.column}
          </p>
          <p>
            <span className="font-medium">Row:</span> {lin.rowIndex}
          </p>
          {lin.transformsApplied && lin.transformsApplied.length > 0 && (
            <p>
              <span className="font-medium">Transforms:</span>{' '}
              {lin.transformsApplied.join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

const SkeletonRow: React.FC<{ columns: number }> = ({ columns }) => (
  <TableRow data-testid="skeleton-row" className="animate-pulse">
    {Array.from({ length: columns }).map((_, idx) => (
      <TableCell key={idx}>
        <div className="h-4 bg-muted rounded w-full" />
      </TableCell>
    ))}
  </TableRow>
);

export const MergedPreviewTable: React.FC<MergedPreviewTableProps> = ({
  columns,
  rows,
  loading = false,
  error = null,
  secureMode = false,
  filter,
  issueRowIndices = new Set(),
  className,
  onRetry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Apply filters
  const filteredRows = React.useMemo(() => {
    let filtered = rows;

    // Filter by issues
    if (filter?.issuesOnly) {
      filtered = filtered.filter((_, idx) => issueRowIndices.has(idx));
    }

    // Filter by search query
    const query = (filter?.query || searchQuery).toLowerCase();
    if (query) {
      filtered = filtered.filter((row) => {
        return columns.some((col) => {
          const value = row[col]?.value;
          return value && String(value).toLowerCase().includes(query);
        });
      });
    }

    return filtered;
  }, [rows, columns, filter, searchQuery, issueRowIndices]);

  const truncateValue = (value: string | number | boolean | null): string => {
    if (value === null || value === undefined) return '—';
    const str = String(value);
    if (str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    return str;
  };

  if (error) {
    return (
      <div className={cn('rounded-lg border border-destructive/50 bg-destructive/5 p-8', className)}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-destructive">Error Loading Preview</h3>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-primary hover:underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search bar */}
      {!loading && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredRows.length} of {rows.length} rows
          </p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border bg-white dark:bg-gray-950 shadow-sm">
        <div className="max-h-[600px] overflow-auto" data-testid="merge-preview-table">
          <Table>
            <TableHeader className="sticky top-0 bg-gray-50 dark:bg-gray-900 z-10">
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="font-semibold whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 8 }).map((_, idx) => (
                  <SkeletonRow key={idx} columns={columns.length} />
                ))
              ) : filteredRows.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No rows match your filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                filteredRows.map((row, rowIdx) => {
                  const originalRowIdx = rows.indexOf(row);
                  const hasIssue = issueRowIndices.has(originalRowIdx);

                  return (
                    <TableRow
                      key={rowIdx}
                      className={cn(
                        hasIssue && 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50'
                      )}
                    >
                      {columns.map((col, colIdx) => {
                        const cell = row[col];
                        const value = cell?.value;
                        const lineage = cell?.lineage;

                        return (
                          <TableCell
                            key={col}
                            data-testid={`cell-r${rowIdx}-c${colIdx}`}
                            className="relative"
                            title={String(value ?? '')}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="flex-1">
                                {truncateValue(value)}
                              </span>
                              {lineage && lineage.length > 0 && (
                                <TooltipProvider>
                                  <Tooltip delayDuration={100}>
                                    <TooltipTrigger asChild>
                                      <button
                                        className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary rounded-full"
                                        data-testid={`lineage-dot-r${rowIdx}-c${colIdx}`}
                                        aria-label={`View lineage for ${col}`}
                                      >
                                        <div
                                          className={cn(
                                            'h-2 w-2 rounded-full',
                                            lineage[0].dataset === 'bankA'
                                              ? 'bg-blue-500'
                                              : 'bg-purple-500'
                                          )}
                                        />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      className="max-w-xs"
                                    >
                                      <LineageTooltip
                                        lineage={lineage}
                                        secureMode={secureMode}
                                      />
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};