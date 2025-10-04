import { useMutation } from "@tanstack/react-query";
import { DatasetProfile } from "@/types/profile";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useProfileDatasets = () => {
  return useMutation({
    mutationFn: async (params: { runId: string; bankAFiles: File[]; bankBFiles: File[] }): Promise<{ bankA: DatasetProfile; bankB: DatasetProfile }> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.profileFromFixtures(params.runId, params.bankAFiles, params.bankBFiles);
      }
      const formData = new FormData();
      formData.append("runId", params.runId);
      params.bankAFiles.forEach((file, index) => formData.append(`bankA_${index}`, file));
      params.bankBFiles.forEach((file, index) => formData.append(`bankB_${index}`, file));
      const response = await fetch("/api/profile", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Failed to profile datasets");
      return response.json();
    },
  });
};

