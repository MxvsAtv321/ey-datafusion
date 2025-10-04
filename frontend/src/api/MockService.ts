import { RunInfo } from "@/types/run";
import { DatasetProfile } from "@/types/profile";
import { SuggestResponse } from "@/types/mapping";
import { TransformSpec, TransformKind } from "@/types/transform";
import { MergePreview, MergedCell, MergedRow, Lineage } from "@/types/merge";
import { ChecksResult } from "@/types/checks";
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

// Helper to apply transforms to a value
const applyTransform = (value: any, kind: TransformKind, options?: any): any => {
  if (value === null || value === undefined) return null;
  
  const str = String(value);
  
  switch (kind) {
    case "trim_spaces":
      return str.trim().replace(/\s+/g, " ");
    case "to_upper":
      return str.toUpperCase();
    case "to_lower":
      return str.toLowerCase();
    case "to_title":
      return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
    case "cast_number":
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    case "cast_date":
      const date = new Date(str);
      return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
    default:
      return str;
  }
};

// Helper to apply concat transform
const applyConcat = (values: any[], separator: string = " "): string => {
  return values
    .map(v => v === null || v === undefined ? "" : String(v))
    .join(separator);
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

  suggestMappings: async (runId: string): Promise<SuggestResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Import fixture dynamically
      const fixture = await import("@/fixtures/mappings.suggest.json");
      const data = fixture.default;
      
      // Mask examples in secure mode
      if (secureMode) {
        data.candidates = data.candidates.map(candidate => ({
          ...candidate,
          examplePairs: candidate.examplePairs.map(pair => ({
            from: maskValue(pair.from),
            to: maskValue(pair.to),
          })),
        }));
      }
      
      return data;
    } catch (error) {
      console.error("Error loading mappings fixture:", error);
      // Return fallback data
      return {
        runId,
        computedAt: new Date().toISOString(),
        candidates: [],
      };
    }
  },

  previewTransforms: async (runId: string, transforms: TransformSpec[]): Promise<MergePreview> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const fixture = await import("@/fixtures/merge.sampleRows.json");
      const data = fixture.default;
      
      // Combine bankA and bankB data
      const allRows = [...data.bankA, ...data.bankB];
      const columns = ["account_number", "first_name", "last_name", "email", "phone", "balance", "open_date"];
      
      const mergedRows: MergedRow[] = allRows.slice(0, 10).map((row, rowIndex) => {
        const mergedRow: MergedRow = {};
        
        columns.forEach(column => {
          let value = row[column] || row[column.replace('_', '_')] || null;
          let lineage: Lineage[] = [{
            dataset: rowIndex < 50 ? "bankA" : "bankB",
            column: column,
            rowIndex,
            transformsApplied: []
          }];
          
          // Apply enabled transforms
          const columnTransforms = transforms.filter(t => 
            t.enabled && t.targetColumn === column
          );
          
          columnTransforms.forEach(transform => {
            if (transform.kind === "concat" && transform.inputs) {
              const inputValues = transform.inputs.map(input => row[input] || "");
              value = applyConcat(inputValues, transform.options?.separator || " ");
              lineage = transform.inputs.map(input => ({
                dataset: rowIndex < 50 ? "bankA" : "bankB",
                column: input,
                rowIndex,
                transformsApplied: ["concat"]
              }));
            } else {
              value = applyTransform(value, transform.kind, transform.options);
              lineage[0].transformsApplied.push(transform.kind);
            }
          });
          
          mergedRow[column] = {
            value: secureMode ? maskValue(String(value)) : value,
            lineage
          };
        });
        
        return mergedRow;
      });
      
      return {
        runId,
        columns,
        rows: mergedRows
      };
    } catch (error) {
      console.error("Error loading merge fixture:", error);
      return {
        runId,
        columns: [],
        rows: []
      };
    }
  },

  mergePreview: async (
    runId: string, 
    approvedMappings: Array<{candidateId: string; fromColumn: string; toColumn: string}>, 
    transforms: TransformSpec[]
  ): Promise<MergePreview> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      const fixture = await import("@/fixtures/merge.sampleRows.json");
      const data = fixture.default;
      
      // Create mapping from source columns to target columns
      const columnMapping = new Map<string, string>();
      approvedMappings.forEach(mapping => {
        columnMapping.set(mapping.fromColumn, mapping.toColumn);
      });
      
      // Get unique target columns
      const targetColumns = Array.from(new Set(columnMapping.values()));
      
      // Generate more sample data by duplicating and varying the base data
      const generateSampleData = (baseRows: any[], count: number) => {
        const result = [];
        for (let i = 0; i < count; i++) {
          const baseRow = baseRows[i % baseRows.length];
          const variation = Math.floor(i / baseRows.length);
          const newRow = { ...baseRow };
          
          // Add variation to make rows unique
          if (newRow.account_number) {
            newRow.account_number = newRow.account_number.replace(/\d+$/, (match) => 
              String(parseInt(match) + variation * 1000).padStart(match.length, '0')
            );
          }
          if (newRow.acct_id) {
            newRow.acct_id = newRow.acct_id.replace(/\d+$/, (match) => 
              String(parseInt(match) + variation * 1000).padStart(match.length, '0')
            );
          }
          if (newRow.email) {
            newRow.email = newRow.email.replace('@', `+${variation}@`);
          }
          if (newRow.email_addr) {
            newRow.email_addr = newRow.email_addr.replace('@', `+${variation}@`);
          }
          if (newRow.balance) {
            newRow.balance = String(parseFloat(newRow.balance) + variation * 100);
          }
          if (newRow.acct_balance) {
            newRow.acct_balance = String(parseFloat(newRow.acct_balance) + variation * 100);
          }
          
          result.push(newRow);
        }
        return result;
      };
      
      // Generate 100 rows total (50 from each bank)
      const bankARows = generateSampleData(data.bankA, 50);
      const bankBRows = generateSampleData(data.bankB, 50);
      const allRows = [...bankARows, ...bankBRows];
      
      const mergedRows: MergedRow[] = allRows.map((row, rowIndex) => {
        const mergedRow: MergedRow = {};
        
        targetColumns.forEach(targetColumn => {
          // Find source columns that map to this target
          const sourceColumns = Array.from(columnMapping.entries())
            .filter(([_, target]) => target === targetColumn)
            .map(([source, _]) => source);
          
          // Get the first available source value
          let sourceValue = null;
          let sourceColumn = "";
          for (const source of sourceColumns) {
            if (row[source] !== undefined) {
              sourceValue = row[source];
              sourceColumn = source;
              break;
            }
          }
          
          let value = sourceValue;
          let lineage: Lineage[] = [{
            dataset: rowIndex < 50 ? "bankA" : "bankB",
            column: sourceColumn,
            rowIndex,
            transformsApplied: []
          }];
          
          // Apply enabled transforms
          const columnTransforms = transforms.filter(t => 
            t.enabled && t.targetColumn === targetColumn
          );
          
          columnTransforms.forEach(transform => {
            if (transform.kind === "concat" && transform.inputs) {
              const inputValues = transform.inputs.map(input => row[input] || "");
              value = applyConcat(inputValues, transform.options?.separator || " ");
              lineage = transform.inputs.map(input => ({
                dataset: rowIndex < 50 ? "bankA" : "bankB",
                column: input,
                rowIndex,
                transformsApplied: ["concat"]
              }));
            } else {
              value = applyTransform(value, transform.kind, transform.options);
              lineage[0].transformsApplied.push(transform.kind);
            }
          });
          
          mergedRow[targetColumn] = {
            value: secureMode ? maskValue(String(value)) : value,
            lineage
          };
        });
        
        return mergedRow;
      });
      
      return {
        runId,
        columns: targetColumns,
        rows: mergedRows
      };
    } catch (error) {
      console.error("Error loading merge fixture:", error);
      return {
        runId,
        columns: [],
        rows: []
      };
    }
  },

  runChecks: async (runId: string, preview: MergePreview): Promise<ChecksResult> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const fixture = await import("@/fixtures/checks.results.json");
      return fixture.default;
    } catch (error) {
      console.error("Error loading checks fixture:", error);
      return {
        runId,
        summary: { total: 0, byKind: { missing_required: 0, invalid_format: 0, invalid_code: 0, duplicate_key: 0 } },
        issues: []
      };
    }
  },
};
