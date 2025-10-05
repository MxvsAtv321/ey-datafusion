import { useEffect, useState } from "react";
import { useStore } from "@/state/store";
import { api } from "@/api/client";
import type { Pair } from "@/types/pairing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function PairingPage() {
  const { profiles, setPairings, pairings, acceptAll, setMatrix } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!profiles || Object.keys(profiles).length === 0) return;
      setLoading(true);
      try {
        // Split profiles by dataset name heuristic (Bank A on left, Bank B on right)
        const leftTables = Object.values(profiles).filter((t) => /bank1|banka|bank_?a/i.test(t.table));
        const rightTables = Object.values(profiles).filter((t) => /bank2|bankb|bank_?b/i.test(t.table));
        const resp = await api.pair({ tables: leftTables as any }, { tables: rightTables as any }, { mode: "balanced" });
        setPairings(resp.pairs as Pair[]);
        if (resp.matrix) setMatrix(resp.matrix);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [profiles, setPairings, setMatrix]);

  return (
    <div className="container max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Pairing</h1>
          <p className="text-muted-foreground mt-2">Review auto-proposed pairs before column mapping</p>
        </div>
        <Button onClick={acceptAll} disabled={pairings.length === 0 || loading}>Accept All</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposed Pairs ({pairings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> : (
            <div className="space-y-2">
              {pairings.map((p) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
