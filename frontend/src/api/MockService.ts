import { RunInfo } from "@/types/run";
import { DatasetProfile } from "@/types/profile";
import { secureMode } from "@/config/app";

// Helper to mask sensitive data in secure mode
const maskValue = (value: string): string => {
  if (!secureMode) return value;
  return value.replace(/\d/g, "#").replace(/[a-zA-Z]/g, "x");
};

// Helper to generate pseudo file hash
export const hashFileName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
};

export const MockService = {
  startRun: async (actionKey?: string): Promise<RunInfo> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const now = new Date();
    const runId = `RUN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    return {
      runId,
      secureMode,
      startedAt: now.toISOString(),
    };
  },

  profileFromFixtures: async (runId: string, bankAFiles?: File[], bankBFiles?: File[]): Promise<{ bankA: DatasetProfile; bankB: DatasetProfile }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      // Import fixtures dynamically to avoid build issues
      const bankAFixture = await import("@/fixtures/profile.bankA.json");
      const bankBFixture = await import("@/fixtures/profile.bankB.json");
      
      const maskData = (data: any) => {
        if (!secureMode) return data;
        
        // Mask example values and sample rows
        if (data.columns) {
          data.columns = data.columns.map((col: any) => ({
            ...col,
            exampleValues: col.exampleValues.map((val: string) => maskValue(val)),
          }));
        }
        
        if (data.sampleRows) {
          data.sampleRows = data.sampleRows.map((row: any) => {
            const masked: any = {};
            Object.keys(row).forEach(key => {
              if (typeof row[key] === "string") {
                masked[key] = maskValue(row[key]);
              } else {
                masked[key] = row[key];
              }
            });
            return masked;
          });
        }
        
        return data;
      };
      
      // Update the profile data to reflect multiple files
      const bankAProfile = maskData(bankAFixture.default);
      const bankBProfile = maskData(bankBFixture.default);
      
      // Update row counts to reflect multiple files
      if (bankAFiles && bankAFiles.length > 0) {
        bankAProfile.rowCountSampled = bankAProfile.rowCountSampled * bankAFiles.length;
        bankAProfile.fileHash = bankAFiles.map(f => hashFileName(f.name)).join("-");
      }
      
      if (bankBFiles && bankBFiles.length > 0) {
        bankBProfile.rowCountSampled = bankBProfile.rowCountSampled * bankBFiles.length;
        bankBProfile.fileHash = bankBFiles.map(f => hashFileName(f.name)).join("-");
      }
      
      return {
        bankA: bankAProfile,
        bankB: bankBProfile,
      };
    } catch (error) {
      console.error("Error loading fixtures:", error);
      // Return fallback data if fixtures fail to load
      const fallbackProfile: DatasetProfile = {
        datasetId: "bankA",
        fileHash: "fallback",
        rowCountSampled: 0,
        columns: [],
        likelyKeys: [],
        sampleRows: [],
      };
      
      return {
        bankA: fallbackProfile,
        bankB: { ...fallbackProfile, datasetId: "bankB" },
      };
    }
  },
};
