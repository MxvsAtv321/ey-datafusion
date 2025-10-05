export type DType = "integer"|"number"|"boolean"|"datetime"|"string";
export type SemanticTag = "email_like"|"phone_like"|"canadian_postal_code"|"date_iso"|"currency_amount_like"|"iban_like";

export interface ColumnProfile { name:string; dtype:DType; null_count:number; unique_count_sampled:number; candidate_primary_key_sampled:boolean; examples:string[]; semantic_tags:SemanticTag[]; }
export interface TableProfile { table:string; rows:number; columns:number; sample_n:number; columns_profile:ColumnProfile[]; }
export interface ProfileResponse { profiles: Record<string, TableProfile>; examples_masked?: boolean }

export type ScoreKey = "name"|"type"|"value_overlap"|"embedding";
export interface CandidateMapping {
  left_column:string;
  right_column:string;
  scores: Record<ScoreKey, number>;
  confidence:number;
  decision:"auto"|"review";
  reasons?: string[];
  warnings?: string[];
  explain?: { left_examples:string[]; right_examples:string[] };
}
export interface MatchResponse { candidates: CandidateMapping[]; threshold?: number; run_id?: string; stats?: { total_pairs:number; auto_count:number; review_count:number; auto_pct:number; estimated_minutes_saved:number } }

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

// zod runtime schemas for API responses (contract validation)
import { z } from "zod";

export const HealthzSchema = z.object({
  service: z.string(),
  version: z.string(),
  regulated_mode: z.boolean(),
  embeddings_enabled: z.boolean(),
  masking_policy: z
    .object({ match_explain: z.boolean(), profile_examples_masked: z.boolean() })
    .nullable()
    .optional(),
});

export const ProfileResponseSchema = z.object({
  profiles: z.record(
    z.object({
      table: z.string(),
      rows: z.number(),
      columns: z.number().optional(),
      sample_n: z.number().optional(),
      columns_profile: z
        .array(
          z.object({
            name: z.string(),
            dtype: z.string(),
            null_count: z.number().optional(),
            unique_count_sampled: z.number().optional(),
            candidate_primary_key_sampled: z.boolean().optional(),
            examples: z.array(z.string()).optional(),
            semantic_tags: z.array(z.string()).optional(),
          })
        )
        .optional(),
    })
  ),
  examples_masked: z.boolean().optional(),
});

export const CandidateSchema = z.object({
  left_column: z.string(),
  right_column: z.string(),
  scores: z.object({ name: z.number(), type: z.number(), value_overlap: z.number(), embedding: z.number() }),
  confidence: z.number(),
  decision: z.union([z.literal("auto"), z.literal("review")]),
  reasons: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  explain: z
    .object({ left_examples: z.array(z.string()).optional(), right_examples: z.array(z.string()).optional() })
    .optional(),
});

export const MatchResponseSchema = z.object({
  candidates: z.array(CandidateSchema),
  threshold: z.number().optional(),
  run_id: z.string().nullable().optional(),
  stats: z
    .object({ total_pairs: z.number(), auto_count: z.number(), review_count: z.number(), auto_pct: z.number(), estimated_minutes_saved: z.number() })
    .optional(),
});


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
