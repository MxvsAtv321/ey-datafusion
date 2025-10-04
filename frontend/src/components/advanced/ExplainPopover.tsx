import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import type { CandidateMapping } from "@/api/types";

type Props = { candidate: CandidateMapping };

export default function ExplainPopover({ candidate }: Props) {
  const s = candidate.scores;
  const reasons = candidate.reasons || [];
  const warnings = candidate.warnings || [];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Explain mapping">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" side="top" align="center">
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Why this match?</h4>
          {(reasons.length > 0 || warnings.length > 0) && (
            <div className="space-y-1">
              {reasons.map((r, i) => (
                <div key={`r-${i}`} className="text-xs text-foreground">• {r}</div>
              ))}
              {warnings.map((w, i) => (
                <div key={`w-${i}`} className="text-xs text-amber-600">• {w}</div>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Scoring formula: <code>0.45*name + 0.20*type + 0.20*overlap + 0.15*embedding</code>
          </div>
          <table className="w-full text-xs">
            <tbody>
              <tr><td className="pr-2">Name</td><td className="font-mono">{(s.name * 100).toFixed(0)}%</td></tr>
              <tr><td className="pr-2">Type</td><td className="font-mono">{(s.type * 100).toFixed(0)}%</td></tr>
              <tr><td className="pr-2">Value overlap</td><td className="font-mono">{(s.value_overlap * 100).toFixed(0)}%</td></tr>
              <tr><td className="pr-2">Embedding</td><td className="font-mono">{(s.embedding * 100).toFixed(0)}%</td></tr>
            </tbody>
          </table>
          {candidate.explain && (
            <div className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Left examples</div>
                <div className="font-mono text-xs bg-muted p-2 rounded">{(candidate.explain.left_examples || []).slice(0, 3).join(", ")}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Right examples</div>
                <div className="font-mono text-xs bg-muted p-2 rounded">{(candidate.explain.right_examples || []).slice(0, 3).join(", ")}</div>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


