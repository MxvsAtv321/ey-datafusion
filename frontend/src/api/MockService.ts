import { DatasetProfile } from "@/types/profile";
import { SuggestResponse } from "@/types/mapping";

const maybeMask = (value: string) => value;

export const MockService = {
  async startRun(actionKey?: string): Promise<{ runId: string; secureMode: boolean; startedAt: string }> {
    return { runId: "RUN-MOCK", secureMode: true, startedAt: new Date().toISOString() };
  },
  async profileFromFixtures(runId: string, bankAFiles: File[], bankBFiles: File[]): Promise<{ bankA: DatasetProfile; bankB: DatasetProfile }> {
    const bankA: DatasetProfile = { table: "bankA.csv", rows: 100, columns: [], exampleValues: [], sampleRows: [] } as any;
    const bankB: DatasetProfile = { ...bankA, table: "bankB.csv" } as any;
    return { bankA, bankB };
  },
  async suggestMappings(runId: string): Promise<SuggestResponse> {
    return { runId, computedAt: new Date().toISOString(), candidates: [] } as any;
  },
};
