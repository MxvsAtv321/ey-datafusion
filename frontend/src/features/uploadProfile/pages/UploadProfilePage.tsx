/**
 * Upload & Profile Page
 * 
 * How to test:
 * 1. Set VITE_MOCK=1 in your .env file to use mock data
 * 2. Select two files (CSV or XLSX) for Bank A and Bank B
 * 3. Click "Start Run" to begin profiling
 * 4. View the generated profiles with column statistics and sample data
 * 5. Toggle "View Sample" to see sample rows
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, CheckCircle, AlertCircle, Play } from "lucide-react";
import { useStartRun } from "@/api/run";
import { useProfileDatasets } from "@/api/profile";
import { FilePicker } from "../components/FilePicker";
import { DatasetProfile } from "@/types/profile";
import { toast } from "@/hooks/use-toast";

export const UploadProfilePage = () => {
  const navigate = useNavigate();
  const [bankAFiles, setBankAFiles] = useState<File[]>([]);
  const [bankBFiles, setBankBFiles] = useState<File[]>([]);
  const [actionKey, setActionKey] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const startRunMutation = useStartRun();
  const profileMutation = useProfileDatasets();

  const handleStartRun = async () => {
    if (bankAFiles.length === 0 || bankBFiles.length === 0) {
      toast({
        title: "Missing files",
        description: "Please select files for both Bank A and Bank B",
        variant: "destructive",
      });
      return;
    }

    try {
      const runInfo = await startRunMutation.mutateAsync(actionKey || undefined);
      setRunId(runInfo.runId);
      const profileData = await profileMutation.mutateAsync({ runId: runInfo.runId, bankAFiles, bankBFiles });
      toast({ title: "Run started successfully", description: `Run ${runInfo.runId} is now profiling your datasets (${bankAFiles.length} + ${bankBFiles.length} files)` });
      setTimeout(() => {
        navigate("/profile", { state: { runId: runInfo.runId, profiles: profileData, bankAFiles, bankBFiles } });
      }, 400);
    } catch (error) {
      toast({ title: "Failed to start run", description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, variant: "destructive" });
    }
  };

  const handleCopyRunId = async () => {
    if (runId) {
      await navigator.clipboard.writeText(runId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied to clipboard", description: "Run ID copied to clipboard" });
    }
  };

  const canStartRun = bankAFiles.length > 0 && bankBFiles.length > 0;

  return (
    <div className="container max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Files</h1>
          <p className="text-muted-foreground mt-2">Upload your bank datasets and generate detailed profiles</p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FilePicker label="Bank A" accept={[".csv", ".xlsx"]} onChange={setBankAFiles} value={bankAFiles} testId="bankA" maxFiles={8} />
        <FilePicker label="Bank B" accept={[".csv", ".xlsx"]} onChange={setBankBFiles} value={bankBFiles} testId="bankB" maxFiles={8} />
      </div>

      {/* Optional Action Key field */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="action-key">Action Key (optional)</Label>
            <Input id="action-key" type="password" placeholder="Enter action key if required" value={actionKey} onChange={(e) => setActionKey(e.target.value)} data-testid="action-key-input" />
          </div>
        </CardContent>
      </Card>

      {/* Start Run Button */}
      <div className="flex justify-center">
        <Button onClick={handleStartRun} disabled={!canStartRun || startRunMutation.isPending} size="lg" data-testid="start-run">
          {startRunMutation.isPending ? (<><div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />Starting Run...</>) : (<><Play className="w-4 h-4 mr-2" />Start Run</>)}
        </Button>
      </div>

      {/* Run ID Display */}
      {runId && !startRunMutation.isPending && !profileMutation.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Run ID</p>
                <p className="text-lg font-mono">{runId}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyRunId} data-testid="run-id">
                {copied ? (<><CheckCircle className="w-4 h-4 mr-2" />Copied</>) : (<><Copy className="w-4 h-4 mr-2" />Copy</>)}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {profileMutation.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to generate profiles. Please try again.</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

