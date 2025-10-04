import { useMutation } from "@tanstack/react-query";
import { RunInfo } from "@/types/run";

const isMockMode = (import.meta as any)?.env?.VITE_MOCK === "1";

export const useStartRun = () => {
  return useMutation({
    mutationFn: async (actionKey?: string): Promise<RunInfo> => {
      if (isMockMode) {
        const { MockService } = await import("./MockService");
        return MockService.startRun(actionKey);
      }
      const response = await fetch("/api/run/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionKey }),
      });
      if (!response.ok) throw new Error("Failed to start run");
      const data = await response.json();
      return { runId: data.runId, secureMode: data.secureMode || false, startedAt: data.startedAt };
    },
  });
};

