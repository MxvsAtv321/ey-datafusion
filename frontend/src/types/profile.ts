export type ColumnType = "string" | "number" | "boolean" | "date" | "unknown";

export type ColumnSummary = {
  name: string;
  inferredType: ColumnType;
  blanksPct: number;         // 0..100
  exampleValues: string[];   // masked when secureMode = true
};

export type LikelyKey = {
  column: string;
  score: number;             // 0..1
  reason: string;            // short human-readable explanation
};

export type DatasetProfile = {
  datasetId: "bankA" | "bankB";
  fileHash: string;          // hex string
  rowCountSampled: number;
  columns: ColumnSummary[];
  likelyKeys: LikelyKey[];
  sampleRows: Record<string, string | number | boolean | null>[]; // masked when secureMode = true
};

