import { useState, useCallback } from "react";
import { Upload, FileText, X, CheckCircle, FileSpreadsheet, FileJson, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useStore } from "@/state/store";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [isLoadingBank1, setIsLoadingBank1] = useState(false);
  const [isLoadingBank2, setIsLoadingBank2] = useState(false);
  const [uploadProgressBank1, setUploadProgressBank1] = useState(0);
  const [uploadProgressBank2, setUploadProgressBank2] = useState(0);
  const { 
    bank1Files, 
    bank2Files, 
    addBank1Files, 
    addBank2Files, 
    removeBank1File, 
    removeBank2File, 
    setProfiles, 
    setCurrentStep 
  } = useStore();
  const navigate = useNavigate();

  // Helper function to get file icon and color based on file type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'csv':
        return { 
          icon: FileText, 
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'xlsx':
      case 'xls':
        return { 
          icon: FileSpreadsheet, 
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'json':
        return { 
          icon: FileJson, 
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return { 
          icon: File, 
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, bank: 'bank1' | 'bank2') => {
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
      
      if (bank === 'bank1') {
        addBank1Files(newFiles);
      } else {
        addBank2Files(newFiles);
      }
    }
  }, [addBank1Files, addBank2Files]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, bank: 'bank1' | 'bank2') => {
    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      
      if (bank === 'bank1') {
        addBank1Files(newFiles);
      } else {
        addBank2Files(newFiles);
      }
    }
  };

  const handleProfile = async (bank: 'bank1' | 'bank2') => {
    const filesToProfile = bank === 'bank1' ? bank1Files : bank2Files;
    const setIsLoading = bank === 'bank1' ? setIsLoadingBank1 : setIsLoadingBank2;
    const setProgress = bank === 'bank1' ? setUploadProgressBank1 : setUploadProgressBank2;
    
    if (filesToProfile.length === 0) {
      toast({
        title: "No files selected",
        description: `Please upload at least one file to ${bank === 'bank1' ? 'Bank 1' : 'Bank 2'} to profile`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setProgress(0);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const result = await api.profile(filesToProfile);
      
      // Complete the progress
      clearInterval(progressInterval);
      setProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setProfiles(result.profiles);
        setCurrentStep(1);
        navigate("/profile");
        toast({
          title: "✅ Profiling complete",
          description: `Successfully profiled ${Object.keys(result.profiles).length} files from ${bank === 'bank1' ? 'Bank 1' : 'Bank 2'}`,
        });
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
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
        <h2 className="text-3xl font-bold tracking-tight">Upload Data</h2>
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
                onDrop={(e) => handleDrop(e, 'bank1')}
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
                  onChange={(e) => handleFileInput(e, 'bank1')}
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

          {bank1Files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank 1 Selected Files ({bank1Files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bank1Files.map((file, idx) => {
                    const fileIcon = getFileIcon(file.name);
                    const IconComponent = fileIcon.icon;
                    
                    return (
                      <li
                        key={idx}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:shadow-sm ${fileIcon.bgColor} ${fileIcon.borderColor}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-md ${fileIcon.bgColor} ${fileIcon.borderColor} border`}>
                            <IconComponent className={`h-5 w-5 ${fileIcon.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span className="capitalize">{file.name.split('.').pop()?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBank1File(idx)}
                          aria-label={`Remove ${file.name}`}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {isLoadingBank1 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing files...</span>
                    <span>{Math.round(uploadProgressBank1)}%</span>
                  </div>
                  <Progress value={uploadProgressBank1} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => handleProfile('bank1')}
            disabled={bank1Files.length === 0 || isLoadingBank1}
            size="lg"
            className="w-full"
          >
            {isLoadingBank1 ? "Profiling..." : "Profile Bank 1 Files"}
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
                onDrop={(e) => handleDrop(e, 'bank2')}
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
                  onChange={(e) => handleFileInput(e, 'bank2')}
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

          {bank2Files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank 2 Selected Files ({bank2Files.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {bank2Files.map((file, idx) => {
                    const fileIcon = getFileIcon(file.name);
                    const IconComponent = fileIcon.icon;
                    
                    return (
                      <li
                        key={idx}
                        className={`flex items-center justify-between rounded-lg border p-3 transition-colors hover:shadow-sm ${fileIcon.bgColor} ${fileIcon.borderColor}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-md ${fileIcon.bgColor} ${fileIcon.borderColor} border`}>
                            <IconComponent className={`h-5 w-5 ${fileIcon.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-gray-900">{file.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">{formatFileSize(file.size)}</span>
                              <span>•</span>
                              <span className="capitalize">{file.name.split('.').pop()?.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeBank2File(idx)}
                          aria-label={`Remove ${file.name}`}
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {isLoadingBank2 && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing files...</span>
                    <span>{Math.round(uploadProgressBank2)}%</span>
                  </div>
                  <Progress value={uploadProgressBank2} className="w-full" />
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={() => handleProfile('bank2')}
            disabled={bank2Files.length === 0 || isLoadingBank2}
            size="lg"
            className="w-full"
          >
            {isLoadingBank2 ? "Profiling..." : "Profile Bank 2 Files"}
          </Button>
        </div>
      </div>
    </div>
  );
}
