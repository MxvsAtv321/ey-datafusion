import axios from "axios";
import {
  ProfileResponse,
  MatchResponse,
  MergeResponse,
  ValidateResponse,
  DocsResponse,
  DriftResponse,
  MappingDecision,
  TableProfile,
} from "./types";

const client = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
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
    mergedPreview: any
  ): Promise<ValidateResponse> => {
    const response = await client.post("/validate", {
      contract,
      preview: mergedPreview,
    });
    return response.data;
  },

  docs: async (manifest: any): Promise<DocsResponse> => {
    const response = await client.post("/docs", manifest);
    return response.data;
  },

  driftCheck: async (
    baseline: TableProfile,
    current: TableProfile
  ): Promise<DriftResponse> => {
    const response = await client.post("/drift/check", { baseline, current });
    return response.data;
  },
};

export default client;

