import { useMemo } from "react";
import type { PairingMatrix } from "@/types/pairing";

export default function MatrixHeatmap({ matrix }: { matrix: PairingMatrix }) {
  const max = useMemo(() => Math.max(0, ...matrix.scores.flat()), [matrix]);
  return (
    <div className="overflow-auto border rounded-md" aria-label="pairing-heatmap">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="p-2"></th>
            {matrix.right.map((r) => (
              <th key={r} className="p-2 text-left whitespace-nowrap">{r}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.left.map((l, i) => (
            <tr key={l}>
              <td className="p-2 pr-4 font-medium whitespace-nowrap">{l}</td>
              {matrix.scores[i].map((s, j) => {
                const pct = max > 0 ? Math.round((s / max) * 100) : 0;
                return (
                  <td key={`${i}:${j}`} className="p-1">
                    <div className="h-6 w-16 rounded" style={{ background: `linear-gradient(90deg, rgba(16,185,129,0.6) ${pct}%, rgba(229,231,235,0.6) ${pct}%)` }} title={`${Math.round(s*100)}%`} />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
