import { useMutation } from "@tanstack/react-query";
import { DatasetProfile } from "@/types/profile";
const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";
let MockService: any;
if (isMockMode) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MockService = await import("./MockService").then(m => m.MockService);
}

export const useProfileDatasets = () => {
  return useMutation({
    mutationFn: async (params: {
      runId: string;
      bankAFiles: File[];
      bankBFiles: File[];
    }): Promise<{ bankA: DatasetProfile; bankB: DatasetProfile }> => {
      if (isMockMode && MockService) return MockService.profileFromFixtures(params.runId, params.bankAFiles, params.bankBFiles);
      
      const formData = new FormData();
      formData.append("runId", params.runId);
      
      // Append all Bank A files
      params.bankAFiles.forEach((file, index) => {
        formData.append(`bankA_${index}`, file);
      });
      
      // Append all Bank B files
      params.bankBFiles.forEach((file, index) => {
        formData.append(`bankB_${index}`, file);
      });
      
      const response = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to profile datasets");
      }
      
      return response.json();
    },
  });
};

