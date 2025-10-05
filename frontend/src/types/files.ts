export type MergedFile = {
  fileName: string;     // original name preserved
  mimeType: string;     // "text/csv" | "application/json" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" | etc.
  blob: Blob | string;   // mock as base64 string
};

export type MergedFilesBundle = {
  runId: string;
  fileCount: number;     // Number of files per bank (e.g., 4 if each bank uploaded 4 files)
  files: MergedFile[];
  generatedAt: string;
};
