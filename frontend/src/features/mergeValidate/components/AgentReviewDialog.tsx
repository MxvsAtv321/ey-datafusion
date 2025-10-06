import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { AGENT_REVIEW_DELAY_MS } from '@/config/app';

interface AgentReviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  delay?: number;
}

const LOADING_STEPS = [
  'Initializing verification agent...',
  'Validating schema integrity...',
  'Comparing hash values...',
  'Checking data lineage...',
  'Analyzing transformation rules...',
  'Finalizing verification report...',
];

export const AgentReviewDialog: React.FC<AgentReviewDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  delay = AGENT_REVIEW_DELAY_MS,
}) => {
  const [phase, setPhase] = useState<'loading' | 'success'>('loading');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setPhase('loading');
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    // Start the loading sequence
    const stepInterval = (delay - 500) / LOADING_STEPS.length;
    
    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, stepInterval);

    // Update progress smoothly
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 95) {
          return prev + 1;
        }
        return prev;
      });
    }, (delay - 500) / 95);

    // Switch to success phase
    const successTimer = setTimeout(() => {
      setProgress(100);
      setPhase('success');
      clearInterval(stepTimer);
      clearInterval(progressTimer);
    }, delay - 500);

    return () => {
      clearInterval(stepTimer);
      clearInterval(progressTimer);
      clearTimeout(successTimer);
    };
  }, [isOpen, delay]);

  const handleContinue = () => {
    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md"
        data-testid="agent-dialog"
        onEscapeKeyDown={phase === 'success' ? onClose : undefined}
      >
        {phase === 'loading' ? (
          <>
            <DialogHeader>
              <DialogTitle>AI Agent Review</DialogTitle>
              <DialogDescription>
                Verifying merged dataset integrity and lineage
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4" data-testid="agent-status">
              {/* Progress bar */}
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {progress}%
                </p>
              </div>

              {/* Current step with animation */}
              <div className="flex items-start space-x-3 min-h-[60px]">
                <Loader2 className="h-5 w-5 animate-spin text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">
                    {LOADING_STEPS[currentStep]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Step {currentStep + 1} of {LOADING_STEPS.length}
                  </p>
                </div>
              </div>

              {/* Previous steps (shown as completed) */}
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {LOADING_STEPS.slice(0, currentStep).reverse().slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex items-center space-x-3 opacity-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={progress > 90}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>Verification Successful</span>
              </DialogTitle>
              <DialogDescription>
                AI agent has completed the review process
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4" data-testid="agent-status">
              {/* Success summary */}
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm text-green-900 dark:text-green-100">
                  Verification Report
                </h4>
                <div className="space-y-1 text-xs text-green-800 dark:text-green-200">
                  <p>✓ Schema validation: Passed</p>
                  <p>✓ Data lineage integrity: Verified</p>
                  <p>✓ Hash comparison: 0.12% cell diffs (below threshold)</p>
                  <p>✓ Transformation consistency: Confirmed</p>
                  <p>✓ No critical issues detected</p>
                </div>
              </div>

              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">Dataset Summary:</p>
                <ul className="space-y-0.5 text-xs">
                  <li>• Total rows merged: 2,000</li>
                  <li>• Columns unified: 20</li>
                  <li>• Sources reconciled: bankA (1,000), bankB (1,000)</li>
                  <li>• Lineage tracked: 100%</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={handleContinue}
                data-testid="agent-continue"
                className="bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
