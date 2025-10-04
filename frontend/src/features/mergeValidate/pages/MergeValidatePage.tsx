import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TransformSpec } from '@/types/transform';
import { MergePreview } from '@/types/merge';
import { useMergePreview, ApprovedMapping } from '@/api/merge';
import { MergedPreviewTable } from '../components/MergedPreviewTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { secureMode } from '@/config/app';
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Merge & Validate Page
 * 
 * This page shows a preview of the merged data with lineage tracking.
 * 
 * In mock mode, uses MockService with local fixtures.
 * In production, would call real API endpoints.
 */
export const MergeValidatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  
  // State
  const [transforms] = useState<TransformSpec[]>([]);

  // Mock approved mappings - in real app, this would come from previous step
  const approvedMappings: ApprovedMapping[] = useMemo(() => [
    { candidateId: 'map1', fromColumn: 'account_number', toColumn: 'account_number' },
    { candidateId: 'map2', fromColumn: 'acct_id', toColumn: 'account_number' },
    { candidateId: 'map3', fromColumn: 'first_name', toColumn: 'first_name' },
    { candidateId: 'map4', fromColumn: 'fname', toColumn: 'first_name' },
    { candidateId: 'map5', fromColumn: 'last_name', toColumn: 'last_name' },
    { candidateId: 'map6', fromColumn: 'lname', toColumn: 'last_name' },
    { candidateId: 'map7', fromColumn: 'email', toColumn: 'email' },
    { candidateId: 'map8', fromColumn: 'email_addr', toColumn: 'email' },
    { candidateId: 'map9', fromColumn: 'phone', toColumn: 'phone' },
    { candidateId: 'map10', fromColumn: 'phone_num', toColumn: 'phone' },
    { candidateId: 'map11', fromColumn: 'balance', toColumn: 'balance' },
    { candidateId: 'map12', fromColumn: 'acct_balance', toColumn: 'balance' },
    { candidateId: 'map13', fromColumn: 'open_date', toColumn: 'open_date' },
    { candidateId: 'map14', fromColumn: 'created_date', toColumn: 'open_date' },
  ], []);

  // API hooks
  const { data: mergePreview, isLoading: isLoadingPreview } = useMergePreview(
    runId || '',
    approvedMappings,
    transforms
  );

  // Redirect if no runId
  useEffect(() => {
    if (!runId) {
      navigate('/mappings/suggest');
    }
  }, [runId, navigate]);


  if (!runId) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="merge-validate-page">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Merge & Validate</h1>
            <p className="text-muted-foreground mt-1">
              Preview merged data with lineage tracking
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge 
              variant={secureMode ? "default" : "secondary"}
              className="flex items-center space-x-2"
              data-testid="secure-badge"
              aria-live="polite"
            >
              {secureMode ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Secure Mode: ON</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Secure Mode: OFF</span>
                </>
              )}
            </Badge>
            <Button
              onClick={() => navigate('/docs')}
              data-testid="btn-continue-docs"
            >
              Continue to Docs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Main Content - Full Width Preview */}
        <div className="w-full">
          <MergedPreviewTable
            preview={mergePreview}
            className="w-full"
          />
        </div>

        {/* Loading States */}
        {isLoadingPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <p>Loading preview...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
