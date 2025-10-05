import { useMutation } from "@tanstack/react-query";
import { DatasetProfile } from "@/types/profile";
import { api } from "./client";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useProfileDatasets = () => {
  return useMutation({
    mutationFn: async (params: { runId: string; bankAFiles: File[]; bankBFiles: File[] }): Promise<{ bankA: DatasetProfile; bankB: DatasetProfile }> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.profileFromFixtures(params.runId, params.bankAFiles, params.bankBFiles);
      }
      // Call backend once with all files, then transform to UI DatasetProfile shape
      const allFiles: File[] = [...params.bankAFiles, ...params.bankBFiles];
      const resp = await api.profile(allFiles, params.runId);
      const profiles = (resp as any)?.profiles || {};

      const toDataset = (datasetId: "bankA" | "bankB", files: File[]): DatasetProfile => {
        // Aggregate simple stats from the backend profiles for the given set of files
        const tables = files.map((f) => profiles[f.name]).filter(Boolean);
        const rowCountSampled = tables.reduce((acc: number, t: any) => acc + (t?.rows || t?.row_count || 0), 0);
        const columns = tables.flatMap((t: any) =>
          (t?.columns_profile || t?.columns || []).map((c: any) => ({
            name: c.name,
            inferredType: (c.dtype || "string") as any,
            blanksPct: (() => {
              const nulls = c.null_count ?? 0;
              const sampleN = t?.sample_n ?? 0;
              if (!sampleN) return 0;
              return Math.round((nulls / Math.max(1, sampleN)) * 100);
            })(),
            exampleValues: c.examples || [],
          }))
        );
        const likelyKeys = tables
          .flatMap((t: any) => (t?.columns_profile || [])
            .filter((c: any) => c.candidate_primary_key_sampled)
            .map((c: any) => ({ column: c.name, score: 0.99, reason: "high uniqueness" }))
          );
        return {
          datasetId,
          fileHash: "",
          rowCountSampled,
          columns,
          likelyKeys,
          sampleRows: [],
        };
      };

      return {
        bankA: toDataset("bankA", params.bankAFiles),
        bankB: toDataset("bankB", params.bankBFiles),
      };
    },
  });
};

