import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilePickerProps {
  label: string;
  accept: string[];
  onChange: (files: File[]) => void;
  value?: File[];
  testId: string;
  maxFiles?: number;
}

export const FilePicker = ({ label, accept, onChange, value = [], testId, maxFiles = 8 }: FilePickerProps) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedExtensions = accept.map(ext => ext.replace(".", ""));
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    
    if (file.size > maxSize) {
      return "File size must be less than 20MB";
    }
    
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return `File must be one of: ${allowedExtensions.join(", ")}`;
    }
    
    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setError(null);
    
    if (files.length === 0) return;
    
    // Check if adding these files would exceed maxFiles
    if (value.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed. You have ${value.length} files and trying to add ${files.length} more.`);
      return;
    }
    
    // Validate each file
    const validFiles: File[] = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
    }
    
    onChange([...value, ...validFiles]);
  };

  const handleClear = () => {
    onChange([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index);
    onChange(newFiles);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalSize = value.reduce((sum, file) => sum + file.size, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`file-input-${testId}`} className="sr-only">
            Select {label} file
          </Label>
          <Input
            ref={fileInputRef}
            id={`file-input-${testId}`}
            type="file"
            accept={accept.join(",")}
            onChange={handleFileChange}
            className="hidden"
            data-testid={`file-input-${testId}`}
            multiple
          />
          
          {value.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer",
                "border-gray-300 hover:border-gray-400 transition-colors",
                "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              )}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={handleKeyDown}
              tabIndex={0}
              role="button"
              aria-label={`Select ${label} files`}
              data-testid={testId}
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                Click to select files or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                {accept.join(", ").toUpperCase()} (max {maxFiles} files)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {value.length} file{value.length !== 1 ? 's' : ''} selected
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(totalSize)} total
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    aria-label="Clear all files"
                    data-testid={`clear-${testId}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {value.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                      aria-label={`Remove ${file.name}`}
                      data-testid={`remove-${testId}-${index}`}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
        
        {value.length === 0 && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            data-testid={`select-${testId}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </Button>
        )}
        
        {value.length > 0 && value.length < maxFiles && (
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="w-full"
            data-testid={`add-more-${testId}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Add More Files ({maxFiles - value.length} remaining)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

