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
      const result = await api.match(files);
      setCandidates(result.candidates);
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

  const handleProceed = () => {
    const decisions = candidates.map((c) => ({
      left_table: files[0].name,
      left_column: c.left_column,
      right_table: files[1].name,
      right_column: c.right_column,
      confidence: c.confidence,
      decision: c.confidence >= settings.threshold ? "accept" : "review",
    }));
    setDecisions(decisions as any);
    setCurrentStep(3);
    navigate("/merge");
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= settings.threshold) return "confidence-high";
    if (confidence >= 0.6) return "confidence-medium";
    return "confidence-low";
  };

  const autoCount = candidates.filter((c) => c.confidence >= settings.threshold).length;
  const reviewCount = candidates.length - autoCount;
  const rightColumns = Array.from(new Set(candidates.map((c) => c.right_column)));

  const onDecisionChange = (d: any) => {
    if (upsertDecision) {
      upsertDecision(d);
    } else {
      // fallback: append to decisions list
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
          <p className="text-muted-foreground mt-2">
            Review and adjust automated column mappings
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSuggestMappings}
            disabled={isLoading || files.length < 2}
            variant="secondary"
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isLoading ? "Analyzing..." : "Suggest Mappings"}
          </Button>
          <Button
            onClick={handleProceed}
            disabled={candidates.length === 0}
            size="lg"
          >
            Next: Merge Preview
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="mb-6 flex gap-4">
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auto-accepted</p>
                  <p className="text-2xl font-bold text-success">{autoCount}</p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">
                  ≥{(settings.threshold * 100).toFixed(0)}% confidence
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs review</p>
                  <p className="text-2xl font-bold text-warning">{reviewCount}</p>
                </div>
                <Badge variant="secondary" className="bg-warning/10 text-warning">
                  Below threshold
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {candidates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wand2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No mappings yet</p>
            <p className="text-sm text-muted-foreground">
              Click "Suggest Mappings" to generate automated column mappings
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mapping Candidates ({candidates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingTable candidates={candidates as any} threshold={settings.threshold} rightColumns={rightColumns} decisions={[]} onDecisionChange={onDecisionChange} onOpenTransform={onOpenTransform} />
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
