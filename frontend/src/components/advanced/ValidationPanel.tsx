import React from "react";
import type { ValidateResponse } from "@/api/types";
import { Badge } from "@/components/ui/badge";

type Props = { result?: ValidateResponse; onFilterSample?: (indices: number[]) => void };

export default function ValidationPanel({ result, onFilterSample }: Props) {
  if (!result) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant={result.status === "pass" ? "default" : "destructive"}>{result.status.toUpperCase()}</Badge>
        <div className="text-sm text-muted-foreground">rows: {result.summary.rows} · columns: {result.summary.columns} · warnings: {result.summary.warnings}</div>
      </div>
      <div className="grid gap-2">
        {result.violations.map((v, i) => (
          <div key={i} className="flex items-start gap-3 border rounded p-3">
            <div className={`h-2 w-2 mt-1 rounded-full ${v.severity === "error" ? "bg-destructive" : "bg-amber-500"}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-medium text-sm">{v.rule}</div>
                <Badge variant={v.severity === "error" ? "destructive" : "secondary"}>{v.severity}</Badge>
                <div className="text-xs text-muted-foreground">count: {v.count}</div>
              </div>
              {onFilterSample && v.sample?.length > 0 && (
                <button className="text-xs underline" onClick={() => onFilterSample(v.sample)}>View sample</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


