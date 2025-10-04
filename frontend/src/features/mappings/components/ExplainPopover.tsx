import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MappingCandidate } from '@/types/mapping';
import { HelpCircle } from 'lucide-react';
import { secureMode } from '@/config/app';

interface ExplainPopoverProps {
  candidate: MappingCandidate;
}

export const ExplainPopover: React.FC<ExplainPopoverProps> = ({ candidate }) => {
  const [open, setOpen] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          data-testid={`explain-${candidate.id}-open`}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="h-8 w-8 p-0"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Explain this match</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-4" 
        data-testid={`explain-${candidate.id}-dialog`}
        onKeyDown={handleKeyDown}
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Match Reasons</h4>
            <div className="space-y-2">
              {candidate.reasons.map((reason, index) => (
                <div key={index} className="text-sm">
                  <div className="font-medium text-gray-900">{reason.title}</div>
                  <div className="text-gray-600">{reason.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {candidate.examplePairs.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Example Pairs</h4>
              <div className="space-y-1">
                {candidate.examplePairs.map((pair, index) => (
                  <div key={index} className="flex justify-between text-sm font-mono bg-gray-50 p-2 rounded">
                    <span className="text-blue-600">{pair.from}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600">{pair.to}</span>
                  </div>
                ))}
              </div>
              {secureMode && (
                <p className="text-xs text-gray-500 mt-1">
                  Examples may be masked in Secure Mode.
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
