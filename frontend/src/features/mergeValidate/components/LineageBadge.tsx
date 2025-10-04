import React from 'react';
import { Lineage } from '@/types/merge';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LineageBadgeProps {
  lineage: Lineage[];
  className?: string;
}

export const LineageBadge: React.FC<LineageBadgeProps> = ({ lineage, className }) => {
  if (lineage.length === 0) return null;

  const primaryLineage = lineage[0];
  const hasMultiple = lineage.length > 1;
  const transformsText = primaryLineage.transformsApplied.length > 0 
    ? ` · ${primaryLineage.transformsApplied.join(',')}`
    : '';

  const badgeText = `${primaryLineage.dataset}:${primaryLineage.column}${transformsText}`;

  const tooltipContent = (
    <div className="space-y-1">
      {lineage.map((l, index) => (
        <div key={index} className="text-xs">
          <div className="font-medium">
            {l.dataset}: {l.column}
          </div>
          <div className="text-muted-foreground">
            Row {l.rowIndex}
            {l.transformsApplied.length > 0 && (
              <span> • Transforms: {l.transformsApplied.join(', ')}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant={primaryLineage.dataset === 'bankA' ? 'default' : 'secondary'}
            className={`text-xs ${className}`}
          >
            {badgeText}
            {hasMultiple && ' +'}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
