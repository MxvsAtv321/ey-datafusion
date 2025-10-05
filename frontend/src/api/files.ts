import { useQuery } from "@tanstack/react-query";
import { MergedFilesBundle } from "@/types/files";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useExportMergedFiles = (runId: string) => {
  return useQuery({
    queryKey: ["exportMergedFiles", runId],
    queryFn: async (): Promise<MergedFilesBundle> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.exportMergedFiles(runId);
      }
      // TODO: Call backend /api/export/files
      throw new Error("Backend endpoint not implemented yet");
    },
    enabled: !!runId,
  });
};
