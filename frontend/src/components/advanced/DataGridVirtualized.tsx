import React, { useMemo } from "react";
import { List } from "react-window";

type Props = {
  columns: string[];
  rows: any[];
  pinned?: string[];
  height?: number;
};

export default function DataGridVirtualized({ columns, rows, pinned = [], height }: Props) {
  const pins = useMemo(() => columns.filter((c) => pinned.includes(c)), [columns, pinned]);
  const others = useMemo(() => columns.filter((c) => !pinned.includes(c)), [columns, pinned]);
  const all = [...pins, ...others];
  const h = height ?? Math.min(520, Math.max(260, rows.length * 36));

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const r = rows[index];
    return (
      <div className="grid text-xs border-b hover:bg-muted/30" style={{ ...style, gridTemplateColumns: `repeat(${all.length}, minmax(120px, 1fr))` }} role="row">
        {all.map((c) => (
          <div key={c} className="px-3 py-2 font-mono truncate" role="cell">{String(r?.[c] ?? "")}</div>
        ))}
      </div>
    );
  };

  return (
    <div className="border rounded">
      <div className="grid bg-muted/50 text-xs font-semibold" style={{ gridTemplateColumns: `repeat(${all.length}, minmax(120px, 1fr))` }} role="row">
        {all.map((c) => (
          <div key={c} className="px-3 py-2" role="columnheader">{c}</div>
        ))}
      </div>
      <List height={h} itemCount={rows.length} itemSize={36} width="100%">
        {Row}
      </List>
    </div>
  );
}


