import { useMutation } from "@tanstack/react-query";
import { RunInfo } from "@/types/run";
import { MockService } from "./MockService";

const isMockMode = true; // Force mock mode for debugging

export const useStartRun = () => {
  return useMutation({
    mutationFn: async (actionKey?: string): Promise<RunInfo> => {
      if (isMockMode) {
        return MockService.startRun(actionKey);
      }
      
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

