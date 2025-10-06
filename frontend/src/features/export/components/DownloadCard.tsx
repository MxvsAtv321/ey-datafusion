import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { MergePreview } from '@/types/merge';
import { downloadCSV } from '@/utils/csv';
import { downloadXLSX, isXLSXAvailable } from '@/utils/xlsx';
import { toast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DownloadCardProps {
  mergePreview: MergePreview;
  agentVerified: boolean;
}

export const DownloadCard: React.FC<DownloadCardProps> = ({
  mergePreview,
  agentVerified,
}) => {
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isDownloadingXLSX, setIsDownloadingXLSX] = useState(false);

  const xlsxAvailable = isXLSXAvailable();

  const handleDownloadCSV = async () => {
    setIsDownloadingCSV(true);
    try {
      // Use the full dataset (not just preview slice)
      const filename = `merged-dataset-${mergePreview.runId}.csv`;
      downloadCSV(mergePreview.columns, mergePreview.rows, filename);

      toast({
        title: 'CSV Downloaded',
        description: `Successfully exported ${mergePreview.rows.length.toLocaleString()} rows`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleDownloadXLSX = async () => {
    setIsDownloadingXLSX(true);
    try {
      const filename = `merged-dataset-${mergePreview.runId}.xlsx`;
      downloadXLSX(mergePreview.columns, mergePreview.rows, {
        filename,
        sheetName: 'Merged Data',
      });

      toast({
        title: xlsxAvailable ? 'XLSX Downloaded' : 'CSV Downloaded (Fallback)',
        description: xlsxAvailable
          ? `Successfully exported ${mergePreview.rows.length.toLocaleString()} rows`
          : 'XLSX library not installed. Exported as CSV instead.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to generate XLSX file',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingXLSX(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Download Options</CardTitle>
            <CardDescription>
              Export the merged dataset in your preferred format
            </CardDescription>
          </div>
          {agentVerified && (
            <Badge className="bg-green-600 hover:bg-green-700">
              <FileText className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Total Rows</p>
            <p className="text-2xl font-bold">
              {mergePreview.rows.length.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Columns</p>
            <p className="text-2xl font-bold">{mergePreview.columns.length}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="font-medium mb-1">📊 Merge Summary:</p>
          <ul className="space-y-0.5 text-xs">
            <li>• 8 files combined from 2 sources</li>
            <li>• 1 unified export generated</li>
            <li>• Full lineage tracking preserved</li>
            <li>• All transformations applied</li>
          </ul>
        </div>

        {/* Download buttons */}
        <div className="space-y-3">
          {/* CSV Download */}
          <Button
            onClick={handleDownloadCSV}
            disabled={isDownloadingCSV || isDownloadingXLSX}
            variant="default"
            className="w-full h-auto py-4"
            data-testid="btn-download-csv"
          >
            {isDownloadingCSV ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating CSV...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                <div className="text-left flex-1">
                  <div className="font-semibold">Download CSV</div>
                  <div className="text-xs opacity-80">
                    Compatible with all spreadsheet apps
                  </div>
                </div>
                <FileDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* XLSX Download */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleDownloadXLSX}
                    disabled={isDownloadingCSV || isDownloadingXLSX}
                    variant="outline"
                    className="w-full h-auto py-4"
                    data-testid="btn-download-xlsx"
                  >
                    {isDownloadingXLSX ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Generating XLSX...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-5 w-5 mr-2" />
                        <div className="text-left flex-1">
                          <div className="font-semibold">
                            Download Excel (XLSX)
                            {!xlsxAvailable && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-xs"
                              >
                                Fallback
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs opacity-80">
                            {xlsxAvailable
                              ? 'Native Excel format with formatting'
                              : 'Will export as CSV (SheetJS not installed)'}
                          </div>
                        </div>
                        <FileDown className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </TooltipTrigger>
              {!xlsxAvailable && (
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-xs">
                    To enable true XLSX export, install SheetJS:
                    <br />
                    <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                      npm install xlsx
                    </code>
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Additional info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            💡 <strong>Tip:</strong> Both formats include all {mergePreview.rows.length.toLocaleString()} rows
            from the merged dataset. CSV is recommended for maximum compatibility.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
