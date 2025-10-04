import axios from "axios";
import {
  ProfileResponse,
  MatchResponse,
  MergeResponse,
  ValidateResponse,
  DocsResponse,
  MappingDecision,
  TableProfile,
} from "./types";

const client = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || "/api/v1",
});

export const api = {
  profile: async (files: File[]): Promise<ProfileResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await client.post("/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  match: async (files: File[]): Promise<MatchResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await client.post("/match", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  merge: async (
    files: File[],
    decisions: MappingDecision[]
  ): Promise<MergeResponse> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("decisions", JSON.stringify(decisions));
    const response = await client.post("/merge", formData, {
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
};

export default client;

