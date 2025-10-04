import React, { useMemo } from "react";
import type { CandidateMapping, MappingDecision } from "@/api/types";
import { List } from "react-window";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ExplainPopover from "./ExplainPopover";

type Props = {
  candidates: CandidateMapping[];
  threshold: number;
  rightColumns: string[];
  decisions: MappingDecision[];
  onDecisionChange: (d: MappingDecision) => void;
  onOpenTransform: (left: string, right: string) => void;
};

export default function MappingTable({ candidates, threshold, rightColumns, decisions, onDecisionChange, onOpenTransform }: Props) {
  const rows = useMemo(() => candidates, [candidates]);
  const height = Math.min(480, Math.max(240, rows.length * 44));

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const c = rows[index];
    const conf = c.confidence;
    const auto = conf >= threshold;
    return (
      <div className="grid grid-cols-12 items-center gap-2 px-2 py-2 border-b text-sm" style={style} role="row">
        <div className="col-span-2 font-mono" role="cell">{c.left_column}</div>
        <div className="col-span-3" role="cell">
          <Select value={c.right_column} onValueChange={(val) => onDecisionChange({ left_table: "left", left_column: c.left_column, right_table: "right", right_column: val, decision: auto ? "auto" : "review", confidence: conf })}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select right column" />
            </SelectTrigger>
            <SelectContent>
              {rightColumns.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-3 flex gap-1" role="cell">
          <Badge variant="outline" className="text-xs">N:{(c.scores.name * 100).toFixed(0)}%</Badge>
          <Badge variant="outline" className="text-xs">T:{(c.scores.type * 100).toFixed(0)}%</Badge>
          <Badge variant="outline" className="text-xs">O:{(c.scores.value_overlap * 100).toFixed(0)}%</Badge>
          <Badge variant="outline" className="text-xs">E:{(c.scores.embedding * 100).toFixed(0)}%</Badge>
        </div>
        <div className="col-span-2" role="cell">
          <div className="h-2 bg-muted rounded">
            <div className={`h-2 rounded ${auto ? "bg-green-600" : "bg-amber-500"}`} style={{ width: `${conf * 100}%` }} />
          </div>
          <span className="text-xs">{(conf * 100).toFixed(0)}%</span>
        </div>
        <div className="col-span-1" role="cell">
          <Badge variant={auto ? "default" : "secondary"}>{auto ? "Auto" : "Review"}</Badge>
        </div>
        <div className="col-span-1 flex gap-1 justify-end" role="cell">
          <Button variant="ghost" size="sm" onClick={() => onOpenTransform(c.left_column, c.right_column)}>Transform</Button>
          <ExplainPopover candidate={c} />
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded">
      <div className="grid grid-cols-12 gap-2 px-2 py-2 bg-muted/50 text-xs font-semibold">
        <div className="col-span-2">Left</div>
        <div className="col-span-3">Right</div>
        <div className="col-span-3">Signals</div>
        <div className="col-span-2">Confidence</div>
        <div className="col-span-1">Decision</div>
        <div className="col-span-1 text-right">Explain</div>
      </div>
      <List height={height} itemCount={rows.length} itemSize={44} width="100%">
        {Row}
      </List>
    </div>
  );
}


