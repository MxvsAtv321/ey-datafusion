import { http, HttpResponse } from "msw";
import {
  ProfileResponse,
  MatchResponse,
  MergeResponse,
  ValidateResponse,
  DocsResponse,
  DriftResponse,
} from "./types";

const mockProfiles: ProfileResponse = {
  profiles: {
    "bank_a.csv": {
      table: "bank_a",
      row_count: 15420,
      candidate_primary_keys_sampled: ["account_id"],
      columns: [
        {
          name: "account_id",
          dtype: "string",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 15420,
          examples: ["ACC001", "ACC002", "ACC003"],
          semantic_tags: [],
        },
        {
          name: "customer_email",
          dtype: "string",
          nullable: true,
          null_count: 42,
          unique_count_sampled: 15378,
          examples: ["john.doe@example.com", "jane.smith@test.ca", "bob@company.org"],
          semantic_tags: ["email_like"],
        },
        {
          name: "balance",
          dtype: "number",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 8234,
          examples: ["1250.50", "89234.12", "450.00"],
          semantic_tags: ["currency_amount_like"],
        },
        {
          name: "open_date",
          dtype: "datetime",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 1245,
          examples: ["2021-03-15", "2022-07-22", "2020-11-05"],
          semantic_tags: ["date_iso"],
        },
      ],
    },
    "bank_b.csv": {
      table: "bank_b",
      row_count: 12800,
      candidate_primary_keys_sampled: ["acct_number"],
      columns: [
        {
          name: "acct_number",
          dtype: "string",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 12800,
          examples: ["B-001", "B-002", "B-003"],
          semantic_tags: [],
        },
        {
          name: "email_address",
          dtype: "string",
          nullable: true,
          null_count: 38,
          unique_count_sampled: 12762,
          examples: ["john.doe@example.com", "jane.smith@test.ca", "alice@demo.com"],
          semantic_tags: ["email_like"],
        },
        {
          name: "current_balance",
          dtype: "number",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 7123,
          examples: ["1250.50", "89234.12", "12.99"],
          semantic_tags: ["currency_amount_like"],
        },
        {
          name: "date_opened",
          dtype: "datetime",
          nullable: false,
          null_count: 0,
          unique_count_sampled: 1189,
          examples: ["2021-03-15", "2022-07-22", "2021-01-10"],
          semantic_tags: ["date_iso"],
        },
      ],
    },
  },
};

const mockMatches: MatchResponse = {
  candidates: [
    {
      left_column: "account_id",
      right_column: "acct_number",
      scores: { name: 0.72, type: 1.0, value_overlap: 0.0, embedding: 0.68 },
      confidence: 0.6,
      decision: "review",
      explain: {
        left_examples: ["ACC001", "ACC002", "ACC003"],
        right_examples: ["B-001", "B-002", "B-003"],
      },
    },
    {
      left_column: "customer_email",
      right_column: "email_address",
      scores: { name: 0.88, type: 1.0, value_overlap: 0.85, embedding: 0.92 },
      confidence: 0.91,
      decision: "auto",
      explain: {
        left_examples: ["john.doe@example.com", "jane.smith@test.ca"],
        right_examples: ["john.doe@example.com", "jane.smith@test.ca"],
      },
    },
    {
      left_column: "balance",
      right_column: "current_balance",
      scores: { name: 0.75, type: 1.0, value_overlap: 0.78, embedding: 0.81 },
      confidence: 0.79,
      decision: "auto",
      explain: {
        left_examples: ["1250.50", "89234.12", "450.00"],
        right_examples: ["1250.50", "89234.12", "12.99"],
      },
    },
    {
      left_column: "open_date",
      right_column: "date_opened",
      scores: { name: 0.82, type: 1.0, value_overlap: 0.73, embedding: 0.86 },
      confidence: 0.85,
      decision: "auto",
      explain: {
        left_examples: ["2021-03-15", "2022-07-22", "2020-11-05"],
        right_examples: ["2021-03-15", "2022-07-22", "2021-01-10"],
      },
    },
  ],
};

const mockMerge: MergeResponse = {
  columns: [
    "_source_bank",
    "_source_file",
    "_transform_chain",
    "account_id",
    "customer_email",
    "balance",
    "open_date",
  ],
  preview_rows: Array.from({ length: 100 }, (_, i) => ({
    _source_bank: i % 2 === 0 ? "bank_a" : "bank_b",
    _source_file: i % 2 === 0 ? "bank_a.csv" : "bank_b.csv",
    _transform_chain: "[]",
    account_id: `ACC${String(i + 1).padStart(5, "0")}`,
    customer_email: `user${i}@example.com`,
    balance: (Math.random() * 100000).toFixed(2),
    open_date: `202${Math.floor(Math.random() * 4)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
  })),
};

const mockValidation: ValidateResponse = {
  status: "pass",
  violations: [
    {
      rule: "email_format",
      count: 3,
      severity: "warning",
      sample: [12, 45, 87],
    },
    {
      rule: "balance_range",
      count: 1,
      severity: "error",
      sample: [33],
    },
  ],
  summary: {
    rows: 28220,
    columns: 7,
    warnings: 3,
  },
};

const mockDocs: DocsResponse = {
  markdown: `# Data Fusion Manifest

## Overview
Merged data from 2 source files with 4 mappings applied.

## Mappings
| Left Column | Right Column | Confidence | Decision |
|------------|--------------|------------|----------|
| customer_email | email_address | 91% | auto |
| balance | current_balance | 79% | auto |
| open_date | date_opened | 85% | auto |

## Configuration
- **Threshold**: 0.70
- **Run ID**: df-20250104-1234
- **Total Rows**: 28,220
- **Status**: ✅ Validated

Generated on: ${new Date().toISOString()}
`,
  json: JSON.stringify(
    {
      version: "1.0",
      runId: "df-20250104-1234",
      threshold: 0.7,
      mappings: 4,
      status: "validated",
    },
    null,
    2
  ),
};

const mockDrift: DriftResponse = {
  changes: [
    {
      type: "added",
      col: "loyalty_points",
    },
    {
      type: "type_changed",
      col: "balance",
      prev: "integer",
      curr: "number",
    },
    {
      type: "nullrate_delta",
      col: "customer_email",
      delta: 0.15,
    },
  ],
  severity: "warning",
};

export const handlers = [
  http.post("/api/v1/profile", async () => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return HttpResponse.json(mockProfiles);
  }),

  http.post("/api/v1/match", async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return HttpResponse.json(mockMatches);
  }),

  http.post("/api/v1/merge", async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return HttpResponse.json(mockMerge);
  }),

  http.post("/api/v1/validate", async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return HttpResponse.json(mockValidation);
  }),

  http.post("/api/v1/docs", async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return HttpResponse.json(mockDocs);
  }),

  http.post("/api/v1/drift/check", async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json(mockDrift);
  }),
];
