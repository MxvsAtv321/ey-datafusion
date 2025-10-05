import { DatasetProfile } from "@/types/profile";
import { SuggestResponse } from "@/types/mapping";
import { EvidenceDoc } from "@/types/docs";
import { MergedFilesBundle } from "@/types/files";

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
  async exportDocs(runId: string): Promise<EvidenceDoc> {
    // Load the markdown report from fixtures
    const response = await fetch('/fixtures/export.report.md');
    if (!response.ok) {
      throw new Error('Failed to load markdown report');
    }
    const markdown = await response.text();
    
    // In secure mode, mask any examples in the markdown
    const maskedMarkdown = maybeMask(markdown);
    
    return {
      runId,
      generatedAt: new Date().toISOString(),
      markdown: maskedMarkdown,
    };
  },
  async exportMergedFiles(runId: string): Promise<MergedFilesBundle> {
    // Load the files bundle from fixtures
    const response = await fetch('/fixtures/export.files.json');
    if (!response.ok) {
      throw new Error('Failed to load files bundle');
    }
    const filesData = await response.json();
    
    return {
      runId,
      fileCount: filesData.length,
      files: filesData,
      generatedAt: new Date().toISOString(),
    };
  },
};
