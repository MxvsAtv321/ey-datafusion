import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { MergePreview } from '@/types/merge';
import { DownloadCard } from '../components/DownloadCard';
import { EXPORT_PAGE_SKELETON_DELAY_MS } from '@/config/app';

// Import mock data
import mergedMockData from '@/fixtures/merged.mock.json';

/**
 * Export Page
 * 
 * This page allows users to download the merged dataset in CSV or XLSX format.
 * Shows a summary of the merge operation and verification status.
 * 
 * Features:
 * - Interstitial loading screen on entry
 * - Run summary with stats
 * - Download options for CSV and XLSX
 * - Verified badge if AI agent review completed
 */
export const ExportPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [agentVerified, setAgentVerified] = useState(false);

  // Load data on mount with interstitial delay
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Simulate loading with interstitial screen
      await new Promise((resolve) =>
        setTimeout(resolve, EXPORT_PAGE_SKELETON_DELAY_MS)
      );

      // Load merge preview from mock
      const data = mergedMockData as MergePreview;
      setMergePreview(data);

      // Check if agent verification was completed (from router state)
      const state = location.state as any;
      if (state?.agentVerified) {
        setAgentVerified(true);
      }

      setIsLoading(false);
    };

    loadData();
  }, [location.state]);

  // Interstitial loading screen
  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"
        data-testid="export-page"
      >
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Preparing Export</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Loading merged dataset...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!mergePreview) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No data available</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the merge & validate step first.
          </p>
          <Button onClick={() => navigate('/merge-validate')}>
            Go to Merge & Validate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="export-page"
    >
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Export & Downloads</h1>
            <p className="text-muted-foreground mt-1">
              Download your merged dataset in multiple formats
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Mock Data badge */}
            <Badge variant="outline" className="text-xs">
              Mock Data
            </Badge>

            {/* Verified badge */}
            {agentVerified && (
              <Badge
                className="bg-green-600 hover:bg-green-700"
                data-testid="badge-verified"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified by AI Agent
              </Badge>
            )}
          </div>
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/merge-validate')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Merge & Validate
        </Button>

        {/* Main content - 2 column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Run Summary Card */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Run Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Info grid */}
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Run ID</span>
                  <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {mergePreview.runId}
                  </code>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Generated At</span>
                  <span className="text-sm font-medium">
                    {new Date().toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Rows</span>
                  <span className="text-lg font-bold">
                    {mergePreview.rows.length.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-muted-foreground">Total Columns</span>
                  <span className="text-lg font-bold">
                    {mergePreview.columns.length}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Verification Status</span>
                  <Badge variant={agentVerified ? 'default' : 'secondary'}>
                    {agentVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
              </div>

              {/* Demo note */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-900 dark:text-blue-100">
                  <strong>ℹ️ Demo Mode:</strong> This page uses mock data for
                  demonstration. In production, data would be fetched from the merge
                  API endpoint.
                </p>
              </div>

              {/* Column list (collapsible preview) */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Output Columns</h4>
                <div className="max-h-[200px] overflow-y-auto bg-muted/30 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {mergePreview.columns.map((col) => (
                      <div
                        key={col}
                        className="text-xs font-mono bg-background px-2 py-1 rounded border"
                      >
                        {col}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right: Download Card */}
          <DownloadCard
            mergePreview={mergePreview}
            agentVerified={agentVerified}
          />
        </div>

        {/* Additional Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">
                Your merged dataset is ready for download. Here's what you can do next:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-3">
                <li>
                  <strong>CSV Format:</strong> Open in Excel, Google Sheets, or any
                  spreadsheet application for analysis
                </li>
                <li>
                  <strong>XLSX Format:</strong> Native Excel format with better
                  support for complex data types
                </li>
                <li>
                  <strong>Data Lineage:</strong> Each cell's provenance is tracked
                  but not included in the export (view in Merge & Validate page)
                </li>
                <li>
                  <strong>Automation:</strong> In production, this export can be
                  scheduled or triggered via API
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
