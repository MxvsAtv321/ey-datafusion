import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/state/store";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { files, setFiles, setProfiles, setCurrentStep } = useStore();
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files).filter(
        (file) =>
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xlsx") ||
          file.name.endsWith(".json")
      );
      setFiles([...files, ...newFiles]);
    }
  }, [files, setFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleProfile = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one file to profile",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.profile(files);
      setProfiles(result.profiles);
      setCurrentStep(1);
      navigate("/profile");
      toast({
        title: "✅ Profiling complete",
        description: `Successfully profiled ${Object.keys(result.profiles).length} files`,
      });
    } catch (error) {
      toast({
        title: "Profiling failed",
        description: "Could not profile files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Upload Data Files</h2>
        <p className="text-muted-foreground mt-2">
          Upload CSV, XLSX, or JSON files to begin the data fusion process
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bank 1 Data Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank 1 Data</CardTitle>
              <CardDescription>
                Upload CSV, XLSX, or JSON files from Bank 1
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Bank 1 file upload"
                />
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, XLSX, JSON
                </p>
              </div>
            </CardContent>
          </Card>

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Files ({files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {files.map((file, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-5 w-5 flex-shrink-0 text-primary" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(idx)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleProfile}
            disabled={files.length === 0 || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Profiling..." : "Profile Selected Files"}
          </Button>
        </div>

        {/* Bank 2 Data Upload */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank 2 Data</CardTitle>
              <CardDescription>
                Upload CSV, XLSX, or JSON files from Bank 2
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                  dragActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="Bank 2 file upload"
                />
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports CSV, XLSX, JSON
                </p>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleProfile}
            disabled={files.length === 0 || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? "Profiling..." : "Profile Selected Files"}
          </Button>
        </div>
      </div>
    </div>
  );
}
