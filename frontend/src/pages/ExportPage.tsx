import { useState } from "react";
import { useStore } from "@/state/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { FileDown, Copy, FileText, AlertCircle, Check } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import SchemaDiff from "@/components/advanced/SchemaDiff";

export default function ExportPage() {
  const { decisions, manifest, setManifest, settings, baselineProfile, profiles, violations } = useStore();
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [driftData, setDriftData] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const gateBlocked = violations?.gate_blocked === true;
  const navigate = useNavigate();
  const toValidation = () => navigate("/validation", { state: { focus: "violations" } });

  const handleGenerateDocs = async () => {
    const manifestData = {
      version: "1.0",
      threshold: settings.threshold,
      fields: decisions,
      runId: `df-${Date.now()}`,
    };

    setIsLoadingDocs(true);
    try {
      const result = await api.docs(manifestData);
      setManifest({ ...manifestData, markdown: result.markdown, json: result.json });
      toast({
        title: "✅ Documentation generated",
        description: "Ready to export",
      });
    } catch (error) {
      toast({
        title: "Failed to generate docs",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleCheckDrift = async () => {
    if (!baselineProfile) {
      toast({
        title: "No baseline profile",
        description: "Set a baseline in the Profile page first",
        variant: "destructive",
      });
      return;
    }

    const currentProfile = Object.values(profiles)[0];
    if (!currentProfile) return;

    try {
      const result = await api.driftCheck(baselineProfile, currentProfile);
      setDriftData(result);
      toast({
        title: "Drift check complete",
        description: `${result.changes.length} changes detected`,
      });
    } catch (error) {
      toast({
        title: "Drift check failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied!",
      description: "Text copied to clipboard",
    });
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container max-w-7xl p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Export & Documentation</h2>
        <p className="text-muted-foreground mt-2">
          Generate documentation and export your data fusion manifest
        </p>
      </div>

      {gateBlocked && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-900 mb-4">
          <div className="font-medium">Export blocked by validation gates</div>
          <div className="text-sm">
            Resolve required rules before exporting.
            <button className="ml-2 underline underline-offset-2" onClick={toValidation}>Go to Validation</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Button
          onClick={handleGenerateDocs}
          disabled={isLoadingDocs || decisions.length === 0 || gateBlocked}
          size="lg"
          className="h-auto py-6"
        >
          <FileText className="mr-2 h-5 w-5" />
          {isLoadingDocs ? "Generating..." : "Generate Docs"}
        </Button>
        <Button
          onClick={handleCheckDrift}
          disabled={!baselineProfile}
          variant="secondary"
          size="lg"
          className="h-auto py-6"
        >
          <AlertCircle className="mr-2 h-5 w-5" />
          Check Schema Drift
        </Button>
        <Button
          onClick={() => manifest && handleDownload(manifest.json || "", "manifest.json")}
          disabled={!manifest}
          variant="outline"
          size="lg"
          className="h-auto py-6"
        >
          <FileDown className="mr-2 h-5 w-5" />
          Download JSON
        </Button>
      </div>

      {driftData && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Schema Drift Analysis</CardTitle>
              <Badge
                variant={
                  driftData.severity === "critical"
                    ? "destructive"
                    : driftData.severity === "warning"
                    ? "secondary"
                    : "default"
                }
                className={
                  driftData.severity === "warning"
                    ? "bg-warning/10 text-warning"
                    : driftData.severity === "info"
                    ? "bg-info/10 text-info"
                    : ""
                }
              >
                {driftData.severity.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <SchemaDiff diff={driftData} />
          </CardContent>
        </Card>
      )}

      {manifest?.markdown ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Markdown Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/30 rounded-lg p-6 mb-4 max-h-[600px] overflow-y-auto">
                <ReactMarkdown>{manifest.markdown}</ReactMarkdown>
              </div>
              <Button
                onClick={() => handleDownload(manifest.markdown || "", "manifest.md")}
                variant="outline"
                className="w-full"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download Markdown
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Manifest ID</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-xs overflow-x-auto">
                    {manifest.runId}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(manifest.runId || "", "runId")}
                  >
                    {copiedId === "runId" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Configuration</label>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="font-mono">{(settings.threshold * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mappings:</span>
                    <span className="font-mono">{decisions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-mono">{manifest.version}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">JSON Manifest</label>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                  {manifest.json}
                </pre>
                <Button
                  variant="outline"
                  onClick={() => handleCopy(manifest.json || "", "json")}
                  className="w-full"
                >
                  {copiedId === "json" ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy JSON
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-2">No documentation generated</p>
            <p className="text-sm text-muted-foreground">
              Click "Generate Docs" to create documentation
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
