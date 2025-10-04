import { useState } from "react";
import { useStore } from "@/state/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Wand2, ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import MappingTable from "@/components/advanced/MappingTable";
import TransformEditor from "@/components/advanced/TransformEditor";

export default function MappingPage() {
  const { files, candidates, setCandidates, setDecisions, upsertDecision, setCurrentStep, settings } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [transformOpen, setTransformOpen] = useState(false);
  const [transformTarget, setTransformTarget] = useState<{ left: string; right: string } | null>(null);
  const [serverThreshold, setServerThreshold] = useState<number | undefined>(undefined);
  const [stats, setStats] = useState<{ total_pairs:number; auto_count:number; review_count:number; auto_pct:number; estimated_minutes_saved:number } | undefined>(undefined);
  const navigate = useNavigate();

  const handleSuggestMappings = async () => {
    if (files.length < 2) {
      toast({
        title: "Need at least 2 files",
        description: "Upload more files to generate mappings",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.match(files, { threshold: settings.threshold });
      setCandidates(result.candidates);
      setServerThreshold(result.threshold ?? settings.threshold);
      setStats(result.stats as any);
      toast({
        title: "✅ Mappings generated",
        description: `Found ${result.candidates.length} candidate mappings`,
      });
    } catch (error) {
      toast({
        title: "Failed to generate mappings",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const effectiveThreshold = typeof serverThreshold === "number" ? serverThreshold : settings.threshold;

  const handleProceed = () => {
    const decisions = candidates.map((c) => ({
      left_table: files[0].name,
      left_column: c.left_column,
      right_table: files[1].name,
      right_column: c.right_column,
      confidence: c.confidence,
      decision: c.confidence >= effectiveThreshold ? "accept" : "review",
    }));
    setDecisions(decisions as any);
    setCurrentStep(3);
    navigate("/merge");
  };

  const autoCount = candidates.filter((c) => c.confidence >= effectiveThreshold).length;
  const reviewCount = candidates.length - autoCount;
  const rightColumns = Array.from(new Set(candidates.map((c) => c.right_column)));

  const onDecisionChange = (d: any) => {
    if (upsertDecision) {
      upsertDecision(d);
    } else {
      setDecisions([d] as any);
    }
  };

  const onOpenTransform = (left: string, right: string) => {
    setTransformTarget({ left, right });
    setTransformOpen(true);
  };

  return (
    <div className="container max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Column Mapping</h2>
          <p className="text-muted-foreground mt-2">Review and adjust automated column mappings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSuggestMappings} disabled={isLoading || files.length < 2} variant="secondary">
            <Wand2 className="mr-2 h-4 w-4" />
            {isLoading ? "Analyzing..." : "Suggest Mappings"}
          </Button>
          <Button onClick={handleProceed} disabled={candidates.length === 0} size="lg">
            Next: Merge Preview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auto-accepted</p>
                  <p className="text-2xl font-bold text-success">{autoCount}</p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">≥{(effectiveThreshold * 100).toFixed(0)}%</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs review</p>
                  <p className="text-2xl font-bold text-warning">{reviewCount}</p>
                </div>
                <Badge variant="secondary" className="bg-warning/10 text-warning">Below threshold</Badge>
              </div>
            </CardContent>
          </Card>
          {stats && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Auto % (server)</p>
                    <p className="text-2xl font-bold">{stats.auto_pct.toFixed(1)}%</p>
                  </div>
                  <Badge variant="outline">~{stats.estimated_minutes_saved.toFixed(1)} min saved</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No mappings yet</p>
            <p className="text-sm text-muted-foreground">Click "Suggest Mappings" to generate automated column mappings</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Candidates ({candidates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingTable candidates={candidates as any} threshold={effectiveThreshold} rightColumns={rightColumns} decisions={[]} onDecisionChange={onDecisionChange} onOpenTransform={onOpenTransform} />
          </CardContent>
        </Card>
      )}

      <TransformEditor
        open={transformOpen}
        onClose={() => setTransformOpen(false)}
        onSave={(ops) => transformTarget && onDecisionChange({ left_table: "left", left_column: transformTarget.left, right_table: "right", right_column: transformTarget.right, decision: "manual", confidence: 0, transform_ops: ops })}
        availableFields={rightColumns}
        initialOps={[]}
      />
    </div>
  );
}
