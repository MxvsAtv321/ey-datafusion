import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Download, FileText, Package, Plus } from "lucide-react";
import { EvidenceDoc } from "@/types/docs";
import { MergedFilesBundle } from "@/types/files";

interface DownloadsBarProps {
  evidenceDoc?: EvidenceDoc;
  filesBundle?: MergedFilesBundle;
  isLoading: boolean;
  onDownloadReport: () => void;
  onDownloadAllFiles: () => void;
  onAddToEvidenceBundle: (added: boolean) => void;
}

export function DownloadsBar({
  evidenceDoc,
  filesBundle,
  isLoading,
  onDownloadReport,
  onDownloadAllFiles,
  onAddToEvidenceBundle,
}: DownloadsBarProps) {
  const [isAddedToBundle, setIsAddedToBundle] = useState(false);

  const handleAddToBundle = (checked: boolean) => {
    setIsAddedToBundle(checked);
    onAddToEvidenceBundle(checked);
  };

  const handleDownloadReport = () => {
    if (!evidenceDoc) return;
    
    const blob = new Blob([evidenceDoc.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${evidenceDoc.runId}-report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    onDownloadReport();
  };

  const handleDownloadAllFiles = async () => {
    if (!filesBundle) return;

    try {
      // Create a ZIP file using JSZip (if available) or fallback to individual downloads
      const JSZip = (window as any).JSZip;
      
      if (JSZip) {
        const zip = new JSZip();
        
        // Add each file to the ZIP
        for (const file of filesBundle.files) {
          const blob = typeof file.blob === 'string' 
            ? new Blob([atob(file.blob)], { type: file.mimeType })
            : file.blob;
          zip.file(file.fileName, blob);
        }
        
        // Generate and download the ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filesBundle.runId}-merged-files.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Fallback: download files individually
        for (const file of filesBundle.files) {
          const blob = typeof file.blob === 'string' 
            ? new Blob([atob(file.blob)], { type: file.mimeType })
            : file.blob;
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }
      
      onDownloadAllFiles();
    } catch (error) {
      console.error('Failed to create ZIP file:', error);
      // Fallback to individual downloads
      for (const file of filesBundle.files) {
        const blob = typeof file.blob === 'string' 
          ? new Blob([atob(file.blob)], { type: file.mimeType })
          : file.blob;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    }
  };

  const isDisabled = isLoading || !evidenceDoc || !filesBundle;

  return (
    <div className="bg-white border-t border-gray-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleDownloadAllFiles}
              disabled={isDisabled}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="btn-download-all"
            >
              <Package className="h-4 w-4 mr-2" />
              Download Merged Files ({filesBundle?.fileCount || 0})
            </Button>
            
            <Button
              onClick={handleDownloadReport}
              disabled={isDisabled}
              variant="outline"
              data-testid="btn-download-md"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Report (.md)
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isAddedToBundle}
              onCheckedChange={handleAddToBundle}
              disabled={isDisabled}
              data-testid="toggle-add-evidence"
            />
            <label className="text-sm font-medium">
              Add to Evidence Bundle
            </label>
            <Plus className="h-4 w-4 text-gray-500" />
          </div>
        </div>

        {/* Summary */}
        {filesBundle && (
          <div className="text-sm text-gray-600 text-center">
            {filesBundle.fileCount} merged files ready for download (from {filesBundle.fileCount * 2} original files) • Generated at {new Date(filesBundle.generatedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
