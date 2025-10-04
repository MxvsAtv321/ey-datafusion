import { useMutation } from "@tanstack/react-query";
import { RunInfo } from "@/types/run";
// Optional mock service only when VITE_MOCK=1
const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";
let MockService: any;
if (isMockMode) {
  // dynamic import so production bundles without mock do not include it
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  MockService = await import("./MockService").then(m => m.MockService);
}

export const useStartRun = () => {
  return useMutation({
    mutationFn: async (actionKey?: string): Promise<RunInfo> => {
      if (isMockMode && MockService) return MockService.startRun(actionKey);
      
      const response = await fetch("/api/run/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionKey }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to start run");
      }
      
      const data = await response.json();
      return {
        runId: data.runId,
        secureMode: data.secureMode || false,
        startedAt: data.startedAt,
      };
    },
  });
};

