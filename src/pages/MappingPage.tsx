import { useState } from "react";
import { useStore } from "@/state/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Wand2, ArrowRight, HelpCircle } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function MappingPage() {
  const { files, candidates, setCandidates, setDecisions, setCurrentStep, settings } = useStore();
  const [isLoading, setIsLoading] = useState(false);
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
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Left Column
                    </th>
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Right Column
                    </th>
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Scores
                    </th>
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Confidence
                    </th>
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Decision
                    </th>
                    <th className="sticky-header px-4 py-3 text-left text-sm font-semibold">
                      Explain
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="data-cell font-mono font-medium">
                        {candidate.left_column}
                      </td>
                      <td className="data-cell font-mono font-medium">
                        {candidate.right_column}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            N:{(candidate.scores.name * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            T:{(candidate.scores.type * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            O:{(candidate.scores.value_overlap * 100).toFixed(0)}%
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            E:{(candidate.scores.embedding * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <div className="space-y-1">
                          <div className="confidence-bar">
                            <div
                              className={cn("confidence-fill", getConfidenceClass(candidate.confidence))}
                              style={{ width: `${candidate.confidence * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {(candidate.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={candidate.decision === "auto" ? "default" : "secondary"}
                          className={
                            candidate.decision === "auto"
                              ? "bg-success text-success-foreground"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {candidate.decision === "auto" ? "Auto" : "Review"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {candidate.explain && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <HelpCircle className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Why this match?</h4>
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Scoring Formula:
                                    </p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded">
                                      (name × 0.3) + (type × 0.2) + (overlap × 0.25) + (embedding × 0.25)
                                    </code>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Left examples:
                                    </p>
                                    <div className="font-mono text-xs bg-muted p-2 rounded">
                                      {candidate.explain.left_examples.slice(0, 3).join(", ")}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      Right examples:
                                    </p>
                                    <div className="font-mono text-xs bg-muted p-2 rounded">
                                      {candidate.explain.right_examples.slice(0, 3).join(", ")}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
