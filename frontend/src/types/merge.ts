import { TransformKind } from './transform';

export type Lineage = {
  dataset: "bankA" | "bankB";
  column: string;
  rowIndex: number;  // index within sampled preview
  transformsApplied: TransformKind[]; // order applied
};

export type MergedCell = {
  value: string | number | boolean | null;
  lineage: Lineage[]; // if combined, multiple lineages
};

export type MergedRow = Record<string, MergedCell>;

export type MergePreview = {
  runId: string;
  columns: string[]; // merged output columns (after mappings + transforms)
  rows: MergedRow[]; // sampled preview (<= 200)
};
