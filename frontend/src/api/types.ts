export type DType = "integer"|"number"|"boolean"|"datetime"|"string";
export type SemanticTag = "email_like"|"phone_like"|"canadian_postal_code"|"date_iso"|"currency_amount_like"|"iban_like";

export interface ColumnProfile { name:string; dtype:DType; null_count:number; unique_count_sampled:number; candidate_primary_key_sampled:boolean; examples:string[]; semantic_tags:SemanticTag[]; }
export interface TableProfile { table:string; rows:number; columns:number; sample_n:number; columns_profile:ColumnProfile[]; }
export interface ProfileResponse { profiles: Record<string, TableProfile>; }

export type ScoreKey = "name"|"type"|"value_overlap"|"embedding";
export interface CandidateMapping {
  left_column:string;
  right_column:string;
  scores: Record<ScoreKey, number>;
  confidence:number;
  decision:"auto"|"review";
  explain?: { left_examples:string[]; right_examples:string[] };
}
export interface MatchResponse { candidates: CandidateMapping[]; }

export interface MappingDecision {
  left_table:string; left_column:string;
  right_table:string; right_column:string;
  decision:"accept"|"reject"|"manual"|"auto";
  confidence:number;
  transform_ops?: Array<{ op:string; args?:Record<string,any> }>;
}
export interface MergeResponse { columns:string[]; preview_rows:Array<Record<string,any>>; }

export interface ValidationViolation { rule:string; count:number; severity:"error"|"warning"; sample:number[]; }
export interface ValidateResponse { status:"pass"|"fail"; violations:ValidationViolation[]; summary:{rows:number; columns:number; warnings:number}; }

export interface DocsResponse { markdown:string; json:string; }
export type DType = "integer" | "number" | "boolean" | "datetime" | "string";
export type SemanticTag =
  | "email_like"
  | "phone_like"
  | "canadian_postal_code"
  | "date_iso"
  | "currency_amount_like"
  | "iban_like";

export interface ColumnProfile {
  name: string;
  dtype: DType;
  nullable: boolean;
  null_count: number;
  unique_count_sampled: number;
  examples: string[];
  semantic_tags: SemanticTag[];
}

export interface TableProfile {
  table: string;
  row_count: number;
  columns: ColumnProfile[];
  candidate_primary_keys_sampled: string[];
}

export interface ProfileResponse {
  profiles: Record<string, TableProfile>;
}

export interface CandidateMapping {
  left_column: string;
  right_column: string;
  scores: {
    name: number;
    type: number;
    value_overlap: number;
    embedding: number;
  };
  confidence: number;
  decision: "auto" | "review";
  explain?: {
    left_examples: string[];
    right_examples: string[];
  };
}

export interface MatchResponse {
  candidates: CandidateMapping[];
}

export type TransformOp = {
  op: string;
  args?: Record<string, any>;
};

export interface MappingDecision {
  left_table: string;
  left_column: string;
  right_table: string;
  right_column: string;
  confidence: number;
  decision: "accept" | "reject" | "manual" | "auto";
  transform_ops?: TransformOp[];
}

export interface MergeResponse {
  columns: string[];
  preview_rows: Array<Record<string, any>>;
}

export interface ValidationViolation {
  rule: string;
  count: number;
  severity: "error" | "warning";
  sample: number[]; // row indices
}

export interface ValidateResponse {
  status: "pass" | "fail";
  violations: ValidationViolation[];
  summary: {
    rows: number;
    columns: number;
    warnings: number;
  };
}

export interface DocsResponse {
  markdown: string;
  json: string;
}

export interface DriftChange {
  type: "added" | "removed" | "renamed" | "type_changed" | "nullrate_delta";
  from?: string;
  to?: string;
  col?: string;
  delta?: number;
  prev?: any;
  curr?: any;
}

export interface DriftResponse {
  changes: DriftChange[];
  severity: "info" | "warning" | "critical";
}
