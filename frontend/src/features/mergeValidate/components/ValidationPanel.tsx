import React from 'react';
import { CheckKind, CheckIssue } from '@/types/checks';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, AlertTriangle, Ban, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationPanelProps {
  issues: CheckIssue[];
  selectedKind: CheckKind | null;
  onKindSelect: (kind: CheckKind | null) => void;
  className?: string;
}

const KIND_CONFIG: Record<CheckKind, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  missing_required: {
    label: 'Missing',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900',
  },
  invalid_format: {
    label: 'Invalid Format',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900',
  },
  invalid_code: {
    label: 'Invalid Code',
    icon: <Ban className="h-3.5 w-3.5" />,
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-950 hover:bg-orange-200 dark:hover:bg-orange-900',
  },
  duplicate_key: {
    label: 'Duplicates',
    icon: <Copy className="h-3.5 w-3.5" />,
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950 hover:bg-purple-200 dark:hover:bg-purple-900',
  },
};

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  selectedKind,
  onKindSelect,
  className,
}) => {
  // Count issues by kind
  const counts = React.useMemo(() => {
    const counts: Record<CheckKind, number> = {
      missing_required: 0,
      invalid_format: 0,
      invalid_code: 0,
      duplicate_key: 0,
    };

    issues.forEach((issue) => {
      counts[issue.kind]++;
    });

    return counts;
  }, [issues]);

  const totalIssues = issues.length;

  const handleChipClick = (kind: CheckKind) => {
    // Toggle: if already selected, deselect; otherwise select
    if (selectedKind === kind) {
      onKindSelect(null);
    } else {
      onKindSelect(kind);
    }
  };

  return (
    <Card className={cn('', className)} data-testid="validation-panel">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Validation Results</span>
          <Badge variant={totalIssues === 0 ? 'default' : 'destructive'}>
            {totalIssues} {totalIssues === 1 ? 'Issue' : 'Issues'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary text */}
          <p className="text-sm text-muted-foreground">
            {totalIssues === 0
              ? 'No validation issues detected. Your data looks great!'
              : 'Click on an issue type below to filter the table and see affected rows.'}
          </p>

          {/* Issue chips */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(Object.keys(KIND_CONFIG) as CheckKind[]).map((kind) => {
              const count = counts[kind];
              const config = KIND_CONFIG[kind];
              const isSelected = selectedKind === kind;
              const isDisabled = count === 0;

              return (
                <button
                  key={kind}
                  data-testid={`chip-${kind.replace('_', '-')}`}
                  onClick={() => !isDisabled && handleChipClick(kind)}
                  disabled={isDisabled}
                  className={cn(
                    'flex flex-col items-start space-y-1 rounded-lg border-2 p-3 text-left transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                    isSelected && 'border-primary ring-2 ring-primary/20',
                    !isSelected && !isDisabled && 'border-transparent',
                    isDisabled && 'opacity-40 cursor-not-allowed',
                    !isDisabled && 'cursor-pointer',
                    !isDisabled && config.bgColor
                  )}
                  aria-label={`Filter by ${config.label}`}
                  aria-pressed={isSelected}
                >
                  <div className={cn('flex items-center space-x-1.5', config.color)}>
                    {config.icon}
                    <span className="text-xs font-semibold">{config.label}</span>
                  </div>
                  <p className={cn('text-2xl font-bold', config.color)}>
                    {count}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Selected filter indicator */}
          {selectedKind && (
            <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
              <p className="text-sm font-medium">
                Filtering by: <span className="font-bold">{KIND_CONFIG[selectedKind].label}</span>
              </p>
              <button
                onClick={() => onKindSelect(null)}
                className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Issue list (optional - show a few examples) */}
          {totalIssues > 0 && (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                Recent Issues
              </h4>
              {issues.slice(0, 5).map((issue) => {
                const config = KIND_CONFIG[issue.kind];
                return (
                  <div
                    key={issue.id}
                    className="flex items-start space-x-2 rounded border p-2 text-xs"
                  >
                    <div className={config.color}>{config.icon}</div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-medium">{issue.column}</p>
                      <p className="text-muted-foreground">{issue.message}</p>
                      <p className="text-muted-foreground">Row: {issue.rowIndex}</p>
                    </div>
                  </div>
                );
              })}
              {issues.length > 5 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                  + {issues.length - 5} more issues
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};