import React from 'react';
import { ChecksResult, CheckKind } from '@/types/checks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Filter } from 'lucide-react';

interface ValidationPanelProps {
  checksResult: ChecksResult | null;
  isRunning: boolean;
  onRunChecks: () => void;
  showOnlyIssues: boolean;
  onToggleIssuesFilter: (show: boolean) => void;
}

const CHECK_KIND_LABELS: Record<CheckKind, string> = {
  missing_required: 'Missing Required',
  invalid_format: 'Invalid Format',
  invalid_code: 'Invalid Code',
  duplicate_key: 'Duplicate Key',
};

const CHECK_KIND_COLORS: Record<CheckKind, string> = {
  missing_required: 'bg-red-100 text-red-800',
  invalid_format: 'bg-yellow-100 text-yellow-800',
  invalid_code: 'bg-orange-100 text-orange-800',
  duplicate_key: 'bg-purple-100 text-purple-800',
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  checksResult,
  isRunning,
  onRunChecks,
  showOnlyIssues,
  onToggleIssuesFilter,
}) => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Validation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onRunChecks}
          disabled={isRunning}
          className="w-full"
          data-testid="btn-run-checks"
        >
          <Play className="h-4 w-4 mr-2" />
          {isRunning ? 'Running Checks...' : 'Run Checks'}
        </Button>

        {checksResult && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="issues-filter" className="text-sm font-medium">
                  Show only rows with issues
                </Label>
                <Switch
                  id="issues-filter"
                  checked={showOnlyIssues}
                  onCheckedChange={onToggleIssuesFilter}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Summary</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(checksResult.summary.byKind).map(([kind, count]) => (
                  <div key={kind} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {CHECK_KIND_LABELS[kind as CheckKind]}
                    </span>
                    <Badge
                      variant="secondary"
                      className={CHECK_KIND_COLORS[kind as CheckKind]}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Issues</span>
                  <Badge variant="destructive">
                    {checksResult.summary.total}
                  </Badge>
                </div>
              </div>
            </div>
          </>
        )}

        {!checksResult && !isRunning && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              Click "Run Checks" to validate the merged data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
