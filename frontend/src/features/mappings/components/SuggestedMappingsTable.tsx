import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MappingCandidate, MappingDecision } from '@/types/mapping';
import { ExplainPopover } from './ExplainPopover';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface SuggestedMappingsTableProps {
  candidates: MappingCandidate[];
  threshold: number;
  decisions: Map<string, MappingDecision>;
  onDecisionChange: (candidateId: string, decision: MappingDecision) => void;
}

export const SuggestedMappingsTable: React.FC<SuggestedMappingsTableProps> = ({
  candidates,
  threshold,
  decisions,
  onDecisionChange,
}) => {
  const getDecisionIcon = (decision: MappingDecision) => {
    switch (decision) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getDecisionBadge = (decision: MappingDecision) => {
    switch (decision) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const isAutoMatch = (confidence: number) => confidence >= threshold;

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From (Bank A)</TableHead>
            <TableHead>To (Bank B)</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Explain</TableHead>
            <TableHead>Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-testid="table-suggestions">
          {candidates.map((candidate) => {
            const decision = decisions.get(candidate.id) || 'pending';
            const isAuto = isAutoMatch(candidate.confidence);
            
            return (
              <TableRow 
                key={candidate.id} 
                data-testid={`row-${candidate.id}`}
                className={isAuto ? 'bg-green-50' : 'bg-yellow-50'}
              >
                <TableCell className="font-medium">
                  {candidate.fromColumn}
                </TableCell>
                <TableCell>
                  {candidate.toColumn}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Progress 
                        value={candidate.confidence * 100} 
                        className="flex-1 h-2"
                        role="meter"
                        aria-valuenow={candidate.confidence}
                        aria-valuemin={0}
                        aria-valuemax={1}
                        aria-label={`Confidence: ${Math.round(candidate.confidence * 100)}%`}
                      />
                      <span className="text-sm font-mono min-w-[3rem]">
                        {Math.round(candidate.confidence * 100)}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs">
                      {isAuto ? (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-green-600 font-medium">Auto</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-yellow-600" />
                          <span className="text-yellow-600 font-medium">Review</span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <ExplainPopover candidate={candidate} />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <RadioGroup
                      value={decision}
                      onValueChange={(value) => onDecisionChange(candidate.id, value as MappingDecision)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="approved" 
                          id={`approve-${candidate.id}`}
                          data-testid={`approve-${candidate.id}`}
                        />
                        <Label htmlFor={`approve-${candidate.id}`} className="text-sm">
                          Approve
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="rejected" 
                          id={`reject-${candidate.id}`}
                          data-testid={`reject-${candidate.id}`}
                        />
                        <Label htmlFor={`reject-${candidate.id}`} className="text-sm">
                          Reject
                        </Label>
                      </div>
                    </RadioGroup>
                    <div className="flex items-center space-x-1">
                      {getDecisionIcon(decision)}
                      {getDecisionBadge(decision)}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
