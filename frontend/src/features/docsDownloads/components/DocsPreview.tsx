import React from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { RefreshCw, Shield } from "lucide-react";
import { EvidenceDoc } from "@/types/docs";

interface DocsPreviewProps {
  evidenceDoc?: EvidenceDoc;
  isLoading: boolean;
  isError: boolean;
  onRegenerate: () => void;
  secureMode: boolean;
}

export function DocsPreview({ 
  evidenceDoc, 
  isLoading, 
  isError, 
  onRegenerate, 
  secureMode 
}: DocsPreviewProps) {
  if (isLoading) {
    return (
      <div 
        data-testid="docs-preview"
        className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border"
      >
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-500" />
          <p className="text-gray-600">Generating documentation...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div 
        data-testid="docs-preview"
        className="flex items-center justify-center h-96 bg-red-50 rounded-lg border border-red-200"
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to generate documentation</p>
          <Button onClick={onRegenerate} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!evidenceDoc) {
    return (
      <div 
        data-testid="docs-preview"
        className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border"
      >
        <p className="text-gray-600">No documentation available</p>
      </div>
    );
  }

  return (
    <div data-testid="docs-preview" className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">Merge Report</h2>
          <p className="text-sm text-gray-600">
            Run ID: {evidenceDoc.runId} • Generated: {new Date(evidenceDoc.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {secureMode && (
            <div className="flex items-center gap-1 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
              <Shield className="h-4 w-4" />
              Examples masked for security
            </div>
          )}
          <Button 
            onClick={onRegenerate} 
            variant="outline" 
            size="sm"
            data-testid="btn-regenerate-docs"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* Markdown Content */}
      <div className="flex-1 overflow-auto">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{evidenceDoc.markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
