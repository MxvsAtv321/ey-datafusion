import { TransformSpec } from './transform';

export type CheckKind =
  | "missing_required"    // e.g., id null
  | "invalid_format"      // regex mismatch (email, phone, acct)
  | "invalid_code"        // not in allowed set
  | "duplicate_key";      // dup on chosen key

export type CheckIssue = {
  id: string;
  kind: CheckKind;
  column: string;
  rowIndex: number;
  message: string;       // human-friendly
  suggestion?: {
    label: string;       // "Trim spaces", "Cast number", "Fill with 'UNKNOWN'"
    patch: Partial<TransformSpec> | { type:"set_value"; value:any } | { type:"regex_replace"; pattern:string; replace:string };
  };
};

export type ChecksResult = {
  runId: string;
  summary: { total: number; byKind: Record<CheckKind, number> };
  issues: CheckIssue[]; // capped for demo, e.g., <= 100
};
