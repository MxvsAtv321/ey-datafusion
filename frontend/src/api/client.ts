import axios from "axios";
import type { ProfileResponse, MatchResponse } from "./types";

const api = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_BASE || "/api/v1",
});

export async function profile(files: File[]): Promise<ProfileResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  const { data } = await api.post<ProfileResponse>("/profile", fd);
  return data;
}

export async function match(left: File, right: File): Promise<MatchResponse> {
  const fd = new FormData();
  fd.append("files", left);
  fd.append("files", right);
  const { data } = await api.post<MatchResponse>("/match", fd);
  return data;
}

export default api;

