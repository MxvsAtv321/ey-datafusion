export type Confidence = number; // 0..1

export type ExamplePair = {
  from: string; // masked in secureMode
  to: string;   // masked in secureMode
};

export type MatchReason = {
  title: string;     // e.g., "Name similarity", "Value distribution overlap"
  detail: string;    // human-friendly, 1-2 sentences
};

export type MappingCandidate = {
  id: string;                  // unique per candidate
  fromDataset: "bankA";
  toDataset: "bankB";
  fromColumn: string;
  toColumn: string;
  confidence: Confidence;
  reasons: MatchReason[];
  examplePairs: ExamplePair[]; // 0-3 pairs max
};

export type SuggestResponse = {
  runId: string;
  candidates: MappingCandidate[];
  computedAt: string;          // ISO
};

export type MappingDecision = "approved" | "rejected" | "pending";

export type MappingRowState = {
  candidateId: string;
  decision: MappingDecision; // default "pending"
};

export type ThresholdStats = {
  threshold: Confidence;             // current slider value
  autoCount: number;                 // count of candidates >= threshold
  reviewCount: number;               // count below threshold
  total: number;
  autoPct: number;                   // 0..100
  estMinutesSaved: number;           // computed (see IMPACT formula)
};
