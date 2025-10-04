export type TransformKind =
  | "concat"          // join fields with separator
  | "trim_spaces"     // trim + collapse internal multiple spaces
  | "to_upper"
  | "to_lower"
  | "to_title"
  | "cast_number"     // parseFloat, keep NaN as null
  | "cast_date";      // ISO yyyy-mm-dd if parseable else null

export type TransformSpec = {
  id: string; // uuid
  targetColumn: string; // output field name after mapping/merge
  kind: TransformKind;
  inputs?: string[];     // for concat: e.g., ["first_name","last_name"]
  options?: {
    separator?: string;  // default " "
    locale?: string;     // for title casing if needed
    format?: string;     // future date fmt
  };
  enabled: boolean;
};
