import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MergePreview } from '@/types/merge';
import { ChecksResult } from '@/types/checks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowRight, CheckCircle2, Shield, ShieldOff } from 'lucide-react';
import { MergedPreviewTable } from '../components/MergedPreviewTable';
import { AgentReviewDialog } from '../components/AgentReviewDialog';
import { SAMPLE_ROW_CAP, MERGE_PAGE_SKELETON_DELAY_MS } from '@/config/app';
import { toast } from '@/hooks/use-toast';

// Import mock data
import mergedMockData from '@/fixtures/merged.mock.json';
import checksResultsData from '@/fixtures/checks.results.json';

/**
 * Merge & Validate Page
 * 
 * This page shows a preview of the merged data with lineage tracking,
 * validation results, and AI agent review capability.
 * 
 * Features:
 * - Preview table with 200-row sample (SAMPLE_ROW_CAP)
 * - Lineage tooltips showing data provenance
 * - Validation panel with issue filtering
 * - AI agent review with progress indicators
 * - Secure mode toggle for masking sensitive data
 */
export const MergeValidatePage: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [checksResult, setChecksResult] = useState<ChecksResult | null>(null);
  const [secureMode, setSecureMode] = useState(false);
  const [agentVerified, setAgentVerified] = useState(false);
  const [showAgentDialog, setShowAgentDialog] = useState(false);

  // Load mock data on mount with skeleton delay
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate loading with skeleton
      await new Promise((resolve) => setTimeout(resolve, MERGE_PAGE_SKELETON_DELAY_MS));

      // Load the full dataset from mock
      const fullData = mergedMockData as MergePreview;
      setMergePreview(fullData);

      // Load validation results
      setChecksResult(checksResultsData as ChecksResult);

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Compute preview slice (first SAMPLE_ROW_CAP rows)
  const previewRows = useMemo(() => {
    if (!mergePreview) return [];
    return mergePreview.rows.slice(0, SAMPLE_ROW_CAP);
  }, [mergePreview]);

  // Get all issue row indices for highlighting
  const issueRowIndices = useMemo(() => {
    if (!checksResult) return new Set<number>();
    return new Set(checksResult.issues.map((issue) => issue.rowIndex));
  }, [checksResult]);

  // Handle agent review
  const handleStartAgentReview = () => {
    setShowAgentDialog(true);
  };

  const handleAgentSuccess = () => {
    setAgentVerified(true);
    toast({
      title: 'Verification Successful',
      description: 'AI agent has verified the merged dataset integrity.',
      duration: 5000,
    });
  };

  const handleContinueToExport = () => {
    navigate('/export', {
      state: {
        agentVerified,
        runId: mergePreview?.runId,
      },
    });
  };

  if (!mergePreview && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No data available</h2>
          <p className="text-muted-foreground mb-4">
            Please complete the previous steps first.
          </p>
          <Button onClick={() => navigate('/mapping')}>Go to Mapping</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      data-testid="merge-validate-page"
    >
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Merge & Validate</h1>
            <p className="text-muted-foreground mt-1">
              Preview merged data with lineage tracking and validation
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Mock Data badge */}
            <Badge variant="outline" className="text-xs">
              Mock Data
            </Badge>

            {/* Secure Mode toggle */}
            <div className="flex items-center space-x-2 border rounded-lg px-3 py-2">
              {secureMode ? (
                <Shield className="h-4 w-4 text-green-600" />
              ) : (
                <ShieldOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="secure-mode" className="text-xs cursor-pointer">
                Secure Mode
              </Label>
              <Switch
                id="secure-mode"
                checked={secureMode}
                onCheckedChange={setSecureMode}
              />
            </div>

            {/* Verified badge */}
            {agentVerified && (
              <Badge className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white dark:bg-gray-950 rounded-lg border">
          <div className="flex items-center space-x-4">
            {/* Stats */}
            {mergePreview && (
              <div className="text-sm text-muted-foreground">
                {mergePreview.rows.length.toLocaleString()} total rows •{' '}
                {mergePreview.columns.length} columns •{' '}
                Showing {Math.min(SAMPLE_ROW_CAP, mergePreview.rows.length)} preview
              </div>
            )}
          </div>

          {/* Agent Review Button */}
          <Button
            onClick={handleStartAgentReview}
            disabled={agentVerified}
            variant={agentVerified ? 'outline' : 'default'}
            className="whitespace-nowrap"
          >
            {agentVerified ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Review Complete
              </>
            ) : (
              'Review by AI Agent'
            )}
          </Button>
        </div>

        {/* Main Content - Full Width Preview Table */}
        <div>
          {mergePreview && (
            <MergedPreviewTable
              columns={mergePreview.columns}
              rows={previewRows}
              loading={isLoading}
              secureMode={secureMode}
              issueRowIndices={issueRowIndices}
            />
          )}
        </div>

        {/* Footer - Continue Button */}
        <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-950 rounded-lg border">
          <div className="text-sm text-muted-foreground">
            {agentVerified ? (
              <span className="text-green-600 font-medium">
                ✓ Ready to export
              </span>
            ) : (
              'Complete AI agent review to continue'
            )}
          </div>
          <Button
            onClick={handleContinueToExport}
            disabled={!agentVerified}
            size="lg"
            data-testid="btn-continue-export"
          >
            Continue to Export
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Agent Review Dialog */}
      <AgentReviewDialog
        isOpen={showAgentDialog}
        onClose={() => setShowAgentDialog(false)}
        onSuccess={handleAgentSuccess}
      />
    </div>
  );
};