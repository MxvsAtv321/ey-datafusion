import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield } from "lucide-react";
import { DocsPreview } from "../components/DocsPreview";
import { DownloadsBar } from "../components/DownloadsBar";
import { useExportDocs } from "@/api/docs";
import { useExportMergedFiles } from "@/api/files";

/**
 * Docs & Downloads Page
 * 
 * This page generates and previews a human-readable Markdown report summarizing the merge run,
 * and provides one-click downloads of both the Markdown report and a bundle of 8 merged files.
 * Users can optionally "Add to Evidence Bundle" for later ZIP packaging.
 */
export function DocsDownloadsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const runId = searchParams.get("runId");

  // Redirect if no runId
  useEffect(() => {
    if (!runId) {
      navigate("/");
    }
  }, [runId, navigate]);

  // Fetch documentation and files in parallel
  const {
    data: evidenceDoc,
    isLoading: docsLoading,
    isError: docsError,
    refetch: refetchDocs,
  } = useExportDocs(runId || "");

  const {
    data: filesBundle,
    isLoading: filesLoading,
    isError: filesError,
  } = useExportMergedFiles(runId || "");

  const isLoading = docsLoading || filesLoading;
  const isError = docsError || filesError;

  // Mock secure mode for now - in real app this would come from context/store
  const secureMode = true;

  const handleRegenerateDocs = () => {
    refetchDocs();
  };

  const handleDownloadReport = () => {
    // Analytics or logging could go here
    console.log("Report downloaded for run:", runId);
  };

  const handleDownloadAllFiles = () => {
    // Analytics or logging could go here
    console.log("All files downloaded for run:", runId);
  };

  const handleAddToEvidenceBundle = (added: boolean) => {
    // Store in context/store for later use in Step 5
    console.log("Evidence bundle", added ? "added to" : "removed from", "bundle for run:", runId);
  };

  if (!runId) {
    return null; // Will redirect
  }

  return (
    <div 
      data-testid="docs-downloads-page"
      className="min-h-screen bg-gray-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Documentation & Downloads
            </h1>
            <div className="flex items-center gap-2">
              {secureMode && (
                <div 
                  className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200"
                  data-testid="secure-badge"
                >
                  <Shield className="h-4 w-4" />
                  Secure Mode
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Docs Preview - takes up most of the viewport */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto h-full">
            <div className="bg-white rounded-lg border border-gray-200 h-full">
              <DocsPreview
                evidenceDoc={evidenceDoc}
                isLoading={isLoading}
                isError={isError}
                onRegenerate={handleRegenerateDocs}
                secureMode={secureMode}
              />
            </div>
          </div>
        </div>

        {/* Downloads Bar - fixed at bottom */}
        <DownloadsBar
          evidenceDoc={evidenceDoc}
          filesBundle={filesBundle}
          isLoading={isLoading}
          onDownloadReport={handleDownloadReport}
          onDownloadAllFiles={handleDownloadAllFiles}
          onAddToEvidenceBundle={handleAddToEvidenceBundle}
        />
      </div>
    </div>
  );
}
