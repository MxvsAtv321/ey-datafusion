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
      // Backend expects exactly two files; send separately per call
      const bankAFiles = params.bankAFiles;
      const bankBFiles = params.bankBFiles;
      const bankA = await api.profile(bankAFiles, params.runId);
      const bankB = await api.profile(bankBFiles, params.runId);
      return { bankA: bankA as unknown as DatasetProfile, bankB: bankB as unknown as DatasetProfile };
    },
  });
};

