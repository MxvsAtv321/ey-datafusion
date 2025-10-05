export type Pair = {
  left_table: string;
  right_table: string;
  score: number;
  decision: "auto" | "review";
  entity_type: string;
  reasons: string[];
  warnings: string[];
};

export type PairingMatrix = {
  left: string[];
  right: string[];
  scores: number[][];
};

export type PairResponse = {
  settings: { weights: Record<string, number>; min_score: number };
  pairs: Pair[];
  unpaired_left: string[];
  unpaired_right: string[];
  matrix?: PairingMatrix;
};

