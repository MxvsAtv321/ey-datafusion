import React, { useMemo, useState } from 'react';
import { MergePreview } from '@/types/merge';
import { LineageBadge } from './LineageBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface MergedPreviewTableProps {
  preview: MergePreview | null;
  className?: string;
}

export const MergedPreviewTable: React.FC<MergedPreviewTableProps> = ({
  preview,
  className,
}) => {
  const [rowLimit, setRowLimit] = useState<number>(10);

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.slice(0, rowLimit);
  }, [preview, rowLimit]);

  if (!preview) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Merged Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No preview data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Merged Preview</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="row-limit" className="text-sm font-medium">
                Show rows:
              </Label>
              <Select
                value={rowLimit.toString()}
                onValueChange={(value) => setRowLimit(parseInt(value))}
              >
                <SelectTrigger id="row-limit" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline">
              {filteredRows.length} of {preview.rows.length} rows
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table data-testid="merge-preview-table" className="w-full">
            <TableHeader>
              <TableRow>
                {preview.columns.map(column => (
                  <TableHead key={column} className="min-w-[150px] text-sm font-semibold">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {preview.columns.map(column => {
                    const cell = row[column];
                    if (!cell) {
                      return (
                        <TableCell key={column} data-testid={`cell-r${rowIndex}-c${column}`}>
                          <span className="text-muted-foreground">—</span>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={column} data-testid={`cell-r${rowIndex}-c${column}`} className="py-3">
                        <div className="flex items-center space-x-3">
                          <span className="truncate max-w-[300px] text-sm">
                            {cell.value === null ? (
                              <span className="text-muted-foreground">null</span>
                            ) : (
                              String(cell.value)
                            )}
                          </span>
                          <LineageBadge lineage={cell.lineage} />
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
      </CardContent>
    </Card>
  );
};
