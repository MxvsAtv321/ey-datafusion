import { Pair } from "@/types/pairing";
import { Progress } from "@/components/ui/progress";

export default function PairTable({ pairs }: { pairs: Pair[] }) {
  return (
    <div className="space-y-2">
      {pairs.map((p) => (
        <div key={`${p.left_table}:${p.right_table}`} className="flex items-center justify-between border rounded-md p-3">
          <div>
            <div className="font-medium">{p.left_table} → {p.right_table}</div>
            <div className="text-xs text-muted-foreground">{p.entity_type} • {p.reasons.slice(0,2).join("; ")}</div>
          </div>
          <div className="flex items-center gap-2 min-w-[220px]">
            <Progress value={Math.round(p.score * 100)} className="h-2" />
            <span className="text-sm font-mono w-12 text-right">{Math.round(p.score * 100)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
