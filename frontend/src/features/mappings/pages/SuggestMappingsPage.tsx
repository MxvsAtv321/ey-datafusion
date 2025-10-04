import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { suggestMappings } from '@/api/mappings';
import { MappingCandidate, MappingDecision, ThresholdStats } from '@/types/mapping';
import { secureMode } from '@/config/app';
import { ThresholdSlider } from '../components/ThresholdSlider';
import { ImpactMeter, calculateThresholdStats } from '../components/ImpactMeter';
import { SuggestedMappingsTable } from '../components/SuggestedMappingsTable';

export const SuggestMappingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [threshold, setThreshold] = useState(0.70);
  const [decisions, setDecisions] = useState<Map<string, MappingDecision>>(new Map());

  // Get runId from navigation state or global store
  // For now, we'll use a mock runId - in real app this would come from navigation state
  const runId = 'RUN-20251004-1015-9f3a';

  const { data: suggestData, isLoading, error } = useQuery({
    queryKey: ['suggestMappings', runId],
    queryFn: () => suggestMappings(runId),
    enabled: !!runId,
  });

  // Initialize decisions as pending for all candidates
  useEffect(() => {
    if (suggestData?.candidates) {
      const newDecisions = new Map<string, MappingDecision>();
      suggestData.candidates.forEach(candidate => {
        newDecisions.set(candidate.id, 'pending');
      });
      setDecisions(newDecisions);
    }
  }, [suggestData?.candidates]);

  // Calculate threshold stats
  const thresholdStats: ThresholdStats = useMemo(() => {
    if (!suggestData?.candidates) {
      return {
        threshold,
        autoCount: 0,
        reviewCount: 0,
        total: 0,
        autoPct: 0,
        estMinutesSaved: 0,
      };
    }
    return calculateThresholdStats(suggestData.candidates, threshold);
  }, [suggestData?.candidates, threshold]);

  const handleDecisionChange = (candidateId: string, decision: MappingDecision) => {
    setDecisions(prev => new Map(prev.set(candidateId, decision)));
  };

  const handleSelectAllAboveThreshold = () => {
    if (!suggestData?.candidates) return;
    
    const newDecisions = new Map(decisions);
    suggestData.candidates.forEach(candidate => {
      if (candidate.confidence >= threshold) {
        newDecisions.set(candidate.id, 'approved');
      } else {
        newDecisions.set(candidate.id, 'pending');
      }
    });
    setDecisions(newDecisions);
  };

  const handleResetDecisions = () => {
    if (!suggestData?.candidates) return;
    
    const newDecisions = new Map<string, MappingDecision>();
    suggestData.candidates.forEach(candidate => {
      newDecisions.set(candidate.id, 'pending');
    });
    setDecisions(newDecisions);
  };

  const handleContinueToTransform = () => {
    const approvedCount = Array.from(decisions.values()).filter(d => d === 'approved').length;
    if (approvedCount === 0) {
      toast.error('Please approve at least one mapping before continuing');
      return;
    }

    // In a real app, this would persist the decisions and navigate to the transform step
    toast.success(`Continuing with ${approvedCount} approved mappings`);
    // navigate('/transform'); // Uncomment when transform page exists
  };

  const approvedCount = Array.from(decisions.values()).filter(d => d === 'approved').length;
  const canContinue = approvedCount > 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading mapping suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Mappings</h1>
          <p className="text-gray-600 mb-4">Failed to load mapping suggestions. Please try again.</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!suggestData?.candidates || suggestData.candidates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Mapping Suggestions</h1>
          <p className="text-gray-600 mb-4">No mapping candidates were found for this run.</p>
          <Button onClick={() => navigate('/upload')}>
            Start a new run
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="suggest-page">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Suggest Mappings</h1>
          <p className="text-gray-600 mt-1">
            Review and approve column mappings between Bank A and Bank B
          </p>
        </div>
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
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Mapping Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <ThresholdSlider
              value={threshold}
              onChange={setThreshold}
            />
            <ImpactMeter stats={thresholdStats} />
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleSelectAllAboveThreshold}
                data-testid="btn-select-above-threshold"
              >
                Select all above threshold
              </Button>
              <Button
                variant="outline"
                onClick={handleResetDecisions}
                data-testid="btn-reset-decisions"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset decisions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mappings Table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestedMappingsTable
            candidates={suggestData.candidates}
            threshold={threshold}
            decisions={decisions}
            onDecisionChange={handleDecisionChange}
          />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Auto ≥ {Math.round(threshold * 100)}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span>Review &lt; {Math.round(threshold * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleResetDecisions}
          >
            Reset decisions
          </Button>
          <Button
            onClick={handleContinueToTransform}
            disabled={!canContinue}
            data-testid="btn-continue-transform"
          >
            Continue to Transform
          </Button>
        </div>
      </div>
    </div>
  );
};
