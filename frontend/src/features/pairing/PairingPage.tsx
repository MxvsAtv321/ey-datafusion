import { useEffect, useState } from "react";
import { useStore } from "@/state/store";
import { api } from "@/api/client";
import type { Pair } from "@/types/pairing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PairTable from "./components/PairTable";
import MatrixHeatmap from "./components/MatrixHeatmap";
import { useNavigate } from "react-router-dom";

export default function PairingPage() {
  const navigate = useNavigate();
  const { profiles, setPairings, pairings, acceptAll, setMatrix, pairingMatrix, setProfiles, setPair } = useStore();
  const bank1Files = useStore(s => s.bank1Files);
  const bank2Files = useStore(s => s.bank2Files);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if ((bank1Files?.length || 0) === 0 || (bank2Files?.length || 0) === 0) return;
      setLoading(true);
      try {
        // Profile left and right from the currently selected files
        const leftResp = await api.profile(bank1Files as File[]);
        const rightResp = await api.profile(bank2Files as File[]);
        // Merge into global store for later usage
        const merged: any = { ...(profiles || {}), ...(leftResp.profiles || {}), ...(rightResp.profiles || {}) };
        setProfiles(merged);
        const leftTables = Object.values(leftResp.profiles || {});
        const rightTables = Object.values(rightResp.profiles || {});
        const resp = await api.pair({ tables: leftTables as any }, { tables: rightTables as any }, { mode: "balanced" });
        setPairings(resp.pairs as Pair[]);
        // Select first auto pair by default
        if ((resp.pairs || []).length > 0) {
          const first = resp.pairs[0];
          setPair(first.left_table, first.right_table);
        }
        if (resp.matrix) setMatrix(resp.matrix);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [bank1Files?.length, bank2Files?.length]);

  return (
    <div className="container max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Table Pairing</h1>
          <p className="text-muted-foreground mt-2">Review auto-proposed pairs before column mapping</p>
        </div>
        <Button onClick={() => { acceptAll(); if (pairings.length > 0) setPair(pairings[0].left_table, pairings[0].right_table); navigate('/mapping'); }} disabled={pairings.length === 0 || loading}>Accept All</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposed Pairs ({pairings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div>Loading...</div> : <PairTable pairs={pairings} />}
        </CardContent>
      </Card>

      {pairingMatrix && (
        <Card>
          <CardHeader>
            <CardTitle>Similarity Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <MatrixHeatmap matrix={pairingMatrix} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
