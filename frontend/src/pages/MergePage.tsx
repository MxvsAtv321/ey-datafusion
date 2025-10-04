import { useState } from "react";
import { useStore } from "@/state/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { GitMerge, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";

export default function MergePage() {
  const { files, decisions, mergedPreview, setMergedPreview, violations, setViolations, setCurrentStep } = useStore();
  const [isLoadingMerge, setIsLoadingMerge] = useState(false);
  const [isLoadingValidate, setIsLoadingValidate] = useState(false);
  const navigate = useNavigate();

  const handleMerge = async () => {
    if (files.length === 0 || decisions.length === 0) {
      toast({
        title: "Missing data",
        description: "Need files and decisions to merge",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingMerge(true);
    try {
      const result = await api.merge(files, decisions);
      setMergedPreview({ columns: result.columns, rows: result.preview_rows });
      toast({
        title: "✅ Merge complete",
        description: `Generated preview with ${result.preview_rows.length} rows`,
      });
    } catch (error) {
      toast({
        title: "Merge failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMerge(false);
    }
  };

  const handleValidate = async () => {
    if (!mergedPreview) {
      toast({
        title: "No preview available",
        description: "Merge data first",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingValidate(true);
    try {
      const result = await api.validate("customers", mergedPreview);
      setViolations(result);
      toast({
        title: result.status === "pass" ? "✅ Validation passed" : "⚠️ Validation issues",
        description: `${result.violations.length} violations found`,
      });
    } catch (error) {
      toast({
        title: "Validation failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingValidate(false);
    }
  };

  const handleProceed = () => {
    setCurrentStep(4);
    navigate("/export");
  };

  return (
    <div className="container max-w-7xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Merge & Validate</h2>
          <p className="text-muted-foreground mt-2">
            Preview merged data and validate quality
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleMerge}
            disabled={isLoadingMerge || files.length === 0}
            variant="secondary"
          >
            <GitMerge className="mr-2 h-4 w-4" />
            {isLoadingMerge ? "Merging..." : "Merge with Decisions"}
          </Button>
          <Button
            onClick={handleValidate}
            disabled={isLoadingValidate || !mergedPreview}
            variant="secondary"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isLoadingValidate ? "Validating..." : "Validate"}
          </Button>
          <Button
            onClick={handleProceed}
            disabled={!violations}
            size="lg"
          >
            Proceed to Export
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {violations && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Validation Results</CardTitle>
              <Badge
                variant={violations.status === "pass" ? "default" : "destructive"}
                className={violations.status === "pass" ? "bg-success" : ""}
              >
                {violations.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{violations.summary.rows.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Columns</p>
                <p className="text-2xl font-bold">{violations.summary.columns}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-warning">{violations.summary.warnings}</p>
              </div>
            </div>

            {violations.violations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Violations</h4>
                {violations.violations.map((v, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-lg border p-4"
                  >
                    <AlertTriangle
                      className={`h-5 w-5 mt-0.5 ${
                        v.severity === "error" ? "text-destructive" : "text-warning"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{v.rule.replace(/_/g, " ")}</p>
                        <Badge
                          variant={v.severity === "error" ? "destructive" : "secondary"}
                          className={v.severity === "warning" ? "bg-warning/10 text-warning" : ""}
                        >
                          {v.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {v.count} violation{v.count !== 1 ? "s" : ""} found (sample rows: {v.sample.join(", ")})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mergedPreview ? (
        <Card>
          <CardHeader>
            <CardTitle>Merged Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {mergedPreview.columns.map((col, idx) => (
                      <th
                        key={idx}
                        className="sticky-header px-3 py-2 text-left text-xs font-semibold"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedPreview.rows.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                      {mergedPreview.columns.map((col, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 text-xs font-mono truncate max-w-xs">
                          {String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Showing first 50 rows of {mergedPreview.rows.length}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitMerge className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No preview available</p>
            <p className="text-sm text-muted-foreground">
              Click "Merge with Decisions" to generate a preview
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
