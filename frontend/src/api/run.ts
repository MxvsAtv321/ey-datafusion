import { useMutation } from "@tanstack/react-query";
import { RunInfo } from "@/types/run";
import { api } from "./client";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useStartRun = () => {
  return useMutation({
    mutationFn: async (actionKey?: string): Promise<RunInfo> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.startRun(actionKey);
      }
      // Call backend runs/start and adapt to frontend RunInfo type
      const { run_id, started_at } = await api.runsStart();
      return { runId: run_id, secureMode: false, startedAt: started_at };
    },
  });
};

