import React from 'react';
import { ThresholdStats } from '@/types/mapping';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ImpactMeterProps {
  stats: ThresholdStats;
}


export const ImpactMeter: React.FC<ImpactMeterProps> = ({ stats }) => {
  const { autoPct, estMinutesSaved } = stats;

  return (
    <div className="flex items-center space-x-2" data-testid="impact-meter">
      <div className="text-sm">
        <span className="font-medium text-green-600">Auto {autoPct}%</span>
        <span className="text-gray-500 mx-1">(~{estMinutesSaved} min saved)</span>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Minutes saved and auto% are computed by the server for this run.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// Helper function to calculate threshold stats
export const calculateThresholdStats = (
  candidates: any[],
  threshold: number
): ThresholdStats => {
  const total = candidates.length;
  const autoCount = candidates.filter(c => c.confidence >= threshold).length;
  const reviewCount = total - autoCount;
  const autoPct = total > 0 ? Math.round((autoCount / total) * 100) : 0;
  const estMinutesSaved = Math.round((autoCount * REVIEW_SECONDS_PER_MATCH) / 60);

  return {
    threshold,
    autoCount,
    reviewCount,
    total,
    autoPct,
    estMinutesSaved,
  };
};
