import { useState } from "react";
import { useStore } from "@/state/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { GitMerge, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import DataGridVirtualized from "@/components/advanced/DataGridVirtualized";
import ValidationPanel from "@/components/advanced/ValidationPanel";

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

            <ValidationPanel result={violations} />
          </CardContent>
        </Card>
      )}

      {mergedPreview ? (
        <Card>
          <CardHeader>
            <CardTitle>Merged Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataGridVirtualized columns={mergedPreview.columns} rows={mergedPreview.rows} pinned={["_source_bank","_source_file","_transform_chain"]} />
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
