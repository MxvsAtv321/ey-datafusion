/**
 * Profile Page
 * 
 * Displays detailed profile data for Bank A and Bank B datasets
 * Shows after starting a run from the Upload & Profile page
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { useProfileDatasets } from "@/api/profile";
import { ProfileSummary } from "@/features/uploadProfile/components/ProfileSummary";
import { BankSelector } from "@/features/uploadProfile/components/BankSelector";
import { DatasetProfile } from "@/types/profile";
import { toast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [profiles, setProfiles] = useState<{ bankA: DatasetProfile; bankB: DatasetProfile } | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState<"bankA" | "bankB">("bankA");

  const profileMutation = useProfileDatasets();

  // Get run data from location state or URL params
  useEffect(() => {
    const state = location.state as any;
    if (state?.runId) {
      setRunId(state.runId);
    }
    if (state?.profiles) {
      setProfiles(state.profiles);
    }
  }, [location.state]);

  const handleRefresh = async () => {
    if (!runId) {
      toast({
        title: "No run ID",
        description: "Cannot refresh without a run ID",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // For demo purposes, we'll just reload the same data
      // In a real app, this would make a new API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Profile refreshed",
        description: "Profile data has been updated",
      });
    } catch (error) {
      toast({
        title: "Failed to refresh",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToUpload = () => {
    navigate("/");
  };

  const handleNextToMapping = () => {
    navigate("/mapping");
  };

  const handleBankChange = (bank: "bankA" | "bankB") => {
    setSelectedBank(bank);
  };

  // Calculate stats for each bank
  const getBankStats = (profile: DatasetProfile) => ({
    rowCount: profile.rowCountSampled,
    columnCount: profile.columns.length,
    highBlanksCount: profile.columns.filter(col => col.blanksPct > 10).length,
    likelyKeysCount: profile.likelyKeys.length,
  });

  const bankAStats = profiles ? getBankStats(profiles.bankA) : { rowCount: 0, columnCount: 0, highBlanksCount: 0, likelyKeysCount: 0 };
  const bankBStats = profiles ? getBankStats(profiles.bankB) : { rowCount: 0, columnCount: 0, highBlanksCount: 0, likelyKeysCount: 0 };

  if (!runId) {
    return (
      <div className="container max-w-7xl p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No run data found. Please start a run from the Upload & Profile page.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={handleBackToUpload}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload & Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dataset Profiles</h1>
          <p className="text-muted-foreground mt-2">
            Detailed analysis of your uploaded datasets
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Run: {runId}</span>
          </Badge>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bank Selector */}
      {profiles && !isLoading && (
        <BankSelector
          selectedBank={selectedBank}
          onBankChange={handleBankChange}
          bankAStats={bankAStats}
          bankBStats={bankBStats}
        />
      )}

      {/* Profile Data */}
      {profiles && !isLoading && (
        <div className="space-y-6">
          <div className="transition-all duration-300 ease-in-out">
            <ProfileSummary 
              profile={selectedBank === "bankA" ? profiles.bankA : profiles.bankB} 
              testId={selectedBank} 
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBackToUpload}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <Button
              onClick={handleNextToMapping}
              size="lg"
            >
              Next: Column Mapping
            </Button>
          </div>
        </div>
      )}

      {/* No Profile Data */}
      {!profiles && !isLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Profile data is being generated. This may take a few moments.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}