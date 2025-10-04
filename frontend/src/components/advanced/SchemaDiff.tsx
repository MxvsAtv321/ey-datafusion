import React, { useMemo } from "react";

type Change = { type: string; col?: string; prev?: string; curr?: string; delta?: number };
type Props = { diff: { severity: string; changes: Change[] }; onFocusField?: (name: string) => void };

export default function SchemaDiff({ diff, onFocusField }: Props) {
  const groups = useMemo(() => {
    const g: Record<string, Change[]> = { added: [], removed: [], type_changed: [], nullrate_delta: [] };
    (diff?.changes || []).forEach((c) => {
      if (!g[c.type]) g[c.type] = [];
      g[c.type].push(c);
    });
    return g;
  }, [diff]);

  const Section = ({ title, type }: { title: string; type: string }) => {
    const items = groups[type] || [];
    if (!items.length) return null;
    return (
      <div className="space-y-2">
        <div className="font-semibold text-sm">{title}</div>
        <div className="flex flex-wrap gap-2">
          {items.map((c, i) => (
            <button key={i} onClick={() => c.col && onFocusField?.(c.col)} className="text-xs border rounded px-2 py-1 hover:bg-muted">
              {c.col || type}
              {c.prev && c.curr && <span className="ml-1 text-muted-foreground">({c.prev} → {c.curr})</span>}
              {typeof c.delta === "number" && <span className="ml-1 text-muted-foreground">Δ{(c.delta * 100).toFixed(1)}%</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${diff.severity === "critical" ? "bg-destructive" : diff.severity === "warning" ? "bg-amber-500" : "bg-green-600"}`} />
        <div className="text-sm">Severity: {diff.severity.toUpperCase()}</div>
      </div>
      <Section title="Added" type="added" />
      <Section title="Removed" type="removed" />
      <Section title="Type Changed" type="type_changed" />
      <Section title="Null Rate Delta" type="nullrate_delta" />
    </div>
  );
}


