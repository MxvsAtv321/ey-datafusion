import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from "@/api/client";
import { useStore } from "@/state/store";
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { MappingCandidate, MappingDecision, ThresholdStats } from '@/types/mapping';
import { ThresholdSlider } from '../components/ThresholdSlider';
import { ImpactMeter, calculateThresholdStats } from '../components/ImpactMeter';
import { SuggestedMappingsTable } from '../components/SuggestedMappingsTable';

const DEBOUNCE_MS = 250;

export const SuggestMappingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, setCandidates } = useStore();
  const bank1Files = useStore(s => s.bank1Files);
  const bank2Files = useStore(s => s.bank2Files);
  const setFiles = useStore(s => s.setFiles);
  const [threshold, setThreshold] = useState(0.70);
  const [decisions, setDecisions] = useState<Map<string, MappingDecision>>(new Map());
  const [stats, setStats] = useState<{ auto_pct:number; estimated_minutes_saved:number } | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<number | undefined>(undefined);

  // Candidates from server are stored in global store after api.match
  const candidatesFromStore = useStore(s => s.candidates);
  // Ensure we have a 2-file pair in store when entering the page
  useEffect(() => {
    if ((!files || files.length < 2) && bank1Files && bank2Files && bank1Files.length > 0 && bank2Files.length > 0) {
      setFiles([bank1Files[0], bank2Files[0]]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bank1Files?.length, bank2Files?.length]);


  useEffect(() => {
    if (candidatesFromStore && candidatesFromStore.length > 0) {
      const newDecisions = new Map<string, MappingDecision>();
      (candidatesFromStore as any[]).forEach((candidate: any, idx: number) => {
        const id = (candidate as any).id ?? `${candidate.left_column}:${candidate.right_column}:${idx}`;
        newDecisions.set(id, 'pending');
      });
      setDecisions(newDecisions);
    }
  }, [candidatesFromStore]);

  const thresholdStats: ThresholdStats = useMemo(() => ({
    threshold,
    autoCount: 0,
    reviewCount: 0,
    total: 0,
    autoPct: stats ? stats.auto_pct : 0,
    estMinutesSaved: stats ? stats.estimated_minutes_saved : 0,
  }), [threshold, stats]);

  // Initial fetch on mount or when files pair becomes available
  useEffect(() => {
    if (!candidatesFromStore || candidatesFromStore.length === 0) {
      fetchMatches(threshold);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files?.length]);

  const fetchMatches = async (t: number) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const res = await api.match(files, { threshold: t });
      setThreshold(res.threshold ?? t);
      setCandidates(res.candidates);
      if (res.stats) setStats({ auto_pct: res.stats.auto_pct as number, estimated_minutes_saved: res.stats.estimated_minutes_saved as number });
    } finally {
      setLoading(false);
    }
  };

  const onThresholdChange = (t: number) => {
    setThreshold(t);
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    // @ts-ignore
    debounceTimer.current = window.setTimeout(() => fetchMatches(t), DEBOUNCE_MS);
  };

  const handleDecisionChange = (candidateId: string, decision: MappingDecision) => {
    setDecisions(prev => new Map(prev.set(candidateId, decision)));
  };

  const handleSelectAllAboveThreshold = () => {
    if (!candidatesFromStore || candidatesFromStore.length === 0) return;
    const newDecisions = new Map(decisions);
    (candidatesFromStore as any[]).forEach((candidate: any, idx: number) => {
      const id = candidate.id ?? `${candidate.left_column}:${candidate.right_column}:${idx}`;
      if (candidate.confidence >= threshold) newDecisions.set(id, 'approved'); else newDecisions.set(id, 'pending');
    });
    setDecisions(newDecisions);
  };

  const handleResetDecisions = () => {
    if (!candidatesFromStore || candidatesFromStore.length === 0) return;
    const newDecisions = new Map<string, MappingDecision>();
    (candidatesFromStore as any[]).forEach((candidate: any, idx: number) => {
      const id = candidate.id ?? `${candidate.left_column}:${candidate.right_column}:${idx}`;
      newDecisions.set(id, 'pending');
    });
    setDecisions(newDecisions);
  };

  const handleContinueToTransform = () => {
    const approvedCount = Array.from(decisions.values()).filter(d => d === 'approved').length;
    if (approvedCount === 0) {
      toast.error('Please approve at least one mapping before continuing');
      return;
    }
    toast.success(`Continuing with ${approvedCount} approved mappings`);
  };

  const approvedCount = Array.from(decisions.values()).filter(d => d === 'approved').length;
  const canContinue = approvedCount > 0;
  if (!candidatesFromStore || candidatesFromStore.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Mapping Suggestions</h1>
          <p className="text-gray-600 mb-4">No mapping candidates were found for this run.</p>
          <Button onClick={() => navigate('/') }>
            Start a new run
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="suggest-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Suggest Mappings</h1>
          <p className="text-gray-600 mt-1">Review and approve column mappings between Bank A and Bank B</p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Mapping Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <ThresholdSlider value={threshold} onChange={onThresholdChange} />
            <ImpactMeter stats={thresholdStats} />
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleSelectAllAboveThreshold} data-testid="btn-select-above-threshold">Select all above threshold</Button>
              <Button variant="outline" onClick={handleResetDecisions} data-testid="btn-reset-decisions"><RotateCcw className="h-4 w-4 mr-2" />Reset decisions</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Suggested Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <SuggestedMappingsTable candidates={candidatesFromStore as unknown as MappingCandidate[]} threshold={threshold} decisions={decisions} onDecisionChange={handleDecisionChange} />
        </CardContent>
      </Card>

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
          <Button variant="outline" onClick={handleResetDecisions}>Reset decisions</Button>
          <Button onClick={handleContinueToTransform} disabled={!canContinue} data-testid="btn-continue-transform">Continue to Transform</Button>
        </div>
      </div>
    </div>
  );
};
