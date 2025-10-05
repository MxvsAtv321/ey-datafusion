import { useQuery } from "@tanstack/react-query";
import { EvidenceDoc } from "@/types/docs";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useExportDocs = (runId: string) => {
  return useQuery({
    queryKey: ["exportDocs", runId],
    queryFn: async (): Promise<EvidenceDoc> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.exportDocs(runId);
      }
      // TODO: Call backend /api/export/docs
      throw new Error("Backend endpoint not implemented yet");
    },
    enabled: !!runId,
  });
};
