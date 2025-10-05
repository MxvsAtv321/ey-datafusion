import axios from "axios";
import {
  ProfileResponse,
  MatchResponse,
  MergeResponse,
  ValidateResponse,
  DocsResponse,
  MappingDecision,
  TableProfile,
  HealthzSchema,
  ProfileResponseSchema,
  MatchResponseSchema,
} from "./types";

const API_BASE = (import.meta as any).env?.VITE_API_BASE || "/api/v1";
const API_KEY = (import.meta as any).env?.VITE_API_KEY;

const client = axios.create({ baseURL: API_BASE });
if (API_KEY) {
  // Attach API key header for secured deployments (noop if undefined)
  (client.defaults.headers as any).common = {
    ...(client.defaults.headers as any).common,
    "X-API-Key": API_KEY,
  };
}

export const api = {
  getHealth: async (): Promise<{ service:string; version:string; regulated_mode:boolean; embeddings_enabled:boolean; masking_policy?: { match_explain:boolean; profile_examples_masked:boolean } } > => {
    const { data } = await client.get("/healthz");
    const h = HealthzSchema.parse(data);
    return { service: h.service, version: h.version, regulated_mode: h.regulated_mode, embeddings_enabled: h.embeddings_enabled, masking_policy: h.masking_policy ?? undefined };
  },
  profile: async (files: File[], runId?: string): Promise<ProfileResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await client.post("/profile", formData, {
      headers: { "Content-Type": "multipart/form-data", ...(runId ? { "X-Run-Id": runId } : {}) },
    });
    return ProfileResponseSchema.parse(response.data) as any;
  },

  match: async (files: File[], opts?: { threshold?: number }): Promise<MatchResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const url = typeof opts?.threshold === "number" ? `/match?threshold=${opts.threshold}` : "/match";
    const response = await client.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return MatchResponseSchema.parse(response.data) as any;
  },

  merge: async (
    files: File[],
    decisions: MappingDecision[],
    opts?: { limit?: number; entityResolution?: string }
  ): Promise<MergeResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("decisions", JSON.stringify(decisions));
    const qs: string[] = [];
    if (opts?.limit) qs.push(`limit=${opts.limit}`);
    if (opts?.entityResolution) qs.push(`entity_resolution=${encodeURIComponent(opts.entityResolution)}`);
    const url = "/merge" + (qs.length ? `?${qs.join("&")}` : "");
    const response = await client.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  validate: async (
    contract: string,
    mergedPreview: { rows: any[]; columns: string[] }
  ): Promise<ValidateResponse> => {
    const response = await client.post("/validate", {
      contract,
      rows: mergedPreview.rows,
    });
    return response.data;
  },

  copilotTriage: async (profiles: any, candidates: any[], targetPrecision?: number): Promise<{ proposals: any[] }> => {
    const { data } = await client.post("/copilot/triage", { profiles, candidates, target_precision: targetPrecision });
    return data;
  },

  copilotFixit: async (validateResult: any): Promise<{ proposals: any[] }> => {
    const { data } = await client.post("/copilot/fixit", { validate_result: validateResult });
    return data;
  },

  docs: async (manifest: any): Promise<DocsResponse> => {
    const response = await client.post("/docs", {
      mapping: manifest,
      run_id: manifest.runId,
      threshold: manifest.threshold,
    });
    return response.data;
  },

  driftCheck: async (
    baseline: TableProfile,
    current: TableProfile
  ): Promise<{ severity: string; changes: any[] }> => {
    const { data } = await client.post("/drift/check", { baseline, current });
    const changes: any[] = [];
    (data.added || []).forEach((col: string) => changes.push({ type: "added", col }));
    (data.removed || []).forEach((col: string) => changes.push({ type: "removed", col }));
    (data.type_changed || []).forEach((t: any) => changes.push({ type: "type_changed", col: t.col, prev: t.from, curr: t.to }));
    (data.nullrate_delta || []).forEach((n: any) => changes.push({ type: "nullrate_delta", col: n.col, delta: n.delta }));
    return { severity: data.severity || "info", changes };
  },

  runsStart: async (): Promise<{ run_id: string; started_at: string }> => {
    const { data } = await client.post("/runs/start", {});
    return data;
  },

  runsComplete: async (
    runId: string,
    status: string,
    artifacts?: Array<{ name: string; url: string }>
  ): Promise<{ run_id: string; status: string; artifacts: any[] }> => {
    const { data } = await client.post("/runs/complete", { run_id: runId, status, artifacts: artifacts || [] });
    return data;
  },

  pair: async (
    left: { tables: TableProfile[] },
    right: { tables: TableProfile[] },
    opts?: { min_score?: number; mode?: "strict"|"balanced"|"lenient" }
  ) => {
    const body: any = { left, right };
    if (opts?.min_score !== undefined) body.min_score = opts.min_score;
    if (opts?.mode) body.mode = opts.mode;
    const { data } = await client.post("/pair", body);
    return data;
  }
};

export default client;

