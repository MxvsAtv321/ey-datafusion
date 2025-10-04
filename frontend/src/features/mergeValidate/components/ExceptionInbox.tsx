import React, { useMemo } from 'react';
import { ChecksResult, CheckIssue, CheckKind } from '@/types/checks';
import { TransformSpec } from '@/types/transform';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ExceptionInboxProps {
  checksResult: ChecksResult | null;
  onApplySuggestion: (issue: CheckIssue) => void;
  onApplyAllForKind: (kind: CheckKind) => void;
  isApplying?: boolean;
}

const CHECK_KIND_ICONS: Record<CheckKind, React.ReactNode> = {
  missing_required: <XCircle className="h-4 w-4" />,
  invalid_format: <AlertCircle className="h-4 w-4" />,
  invalid_code: <AlertTriangle className="h-4 w-4" />,
  duplicate_key: <CheckCircle className="h-4 w-4" />,
};

const CHECK_KIND_LABELS: Record<CheckKind, string> = {
  missing_required: 'Missing Required',
  invalid_format: 'Invalid Format',
  invalid_code: 'Invalid Code',
  duplicate_key: 'Duplicate Key',
};

const CHECK_KIND_COLORS: Record<CheckKind, string> = {
  missing_required: 'text-red-600',
  invalid_format: 'text-yellow-600',
  invalid_code: 'text-orange-600',
  duplicate_key: 'text-purple-600',
};

export const ExceptionInbox: React.FC<ExceptionInboxProps> = ({
  checksResult,
  onApplySuggestion,
  onApplyAllForKind,
  isApplying = false,
}) => {
  const issuesByKind = useMemo(() => {
    if (!checksResult) return {};
    
    return checksResult.issues.reduce((acc, issue) => {
      if (!acc[issue.kind]) {
        acc[issue.kind] = [];
      }
      acc[issue.kind].push(issue);
      return acc;
    }, {} as Record<CheckKind, CheckIssue[]>);
  }, [checksResult]);

  if (!checksResult || checksResult.issues.length === 0) {
    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Exception Inbox</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No issues found!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-lg">Exception Inbox</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4" data-testid="exception-inbox">
            {Object.entries(issuesByKind).map(([kind, issues]) => (
              <div key={kind}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {CHECK_KIND_ICONS[kind as CheckKind]}
                    <span className="font-medium text-sm">
                      {CHECK_KIND_LABELS[kind as CheckKind]}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {issues.length}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onApplyAllForKind(kind as CheckKind)}
                    disabled={isApplying}
                    data-testid={`btn-applyall-${kind}`}
                  >
                    Apply All
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="p-3 border rounded-lg space-y-2"
                      data-testid={`issue-${issue.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">
                              Row {issue.rowIndex + 1}, Column: {issue.column}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {issue.kind}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {issue.message}
                          </p>
                        </div>
                      </div>
                      
                      {issue.suggestion && (
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              Suggested fix:
                            </p>
                            <p className="text-sm font-medium">
                              {issue.suggestion.label}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onApplySuggestion(issue)}
                            disabled={isApplying}
                            data-testid={`btn-apply-${issue.id}`}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {Object.keys(issuesByKind).indexOf(kind) < Object.keys(issuesByKind).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
