import { create } from "zustand";
import {
  TableProfile,
  CandidateMapping,
  MappingDecision,
  ValidateResponse,
} from "@/api/types";

interface AppState {
  // Data
  files: File[];
  profiles: Record<string, TableProfile>;
  candidates: CandidateMapping[];
  decisions: MappingDecision[];
  mergedPreview?: {
    columns: string[];
    rows: Array<Record<string, any>>;
  };
  violations?: ValidateResponse;
  manifest?: {
    version?: string;
    fields?: any[];
    threshold: number;
    runId?: string;
    markdown?: string;
    json?: string;
  };
  baselineProfile?: TableProfile;

  // Settings
  settings: {
    demoMode: boolean;
    threshold: number;
    darkMode: boolean;
  };

  // Current step
  currentStep: number;

  // Actions
  setFiles: (files: File[]) => void;
  setProfiles: (profiles: Record<string, TableProfile>) => void;
  setCandidates: (candidates: CandidateMapping[]) => void;
  setDecisions: (decisions: MappingDecision[]) => void;
  updateDecision: (index: number, decision: Partial<MappingDecision>) => void;
  setMergedPreview: (preview: { columns: string[]; rows: any[] }) => void;
  setViolations: (violations: ValidateResponse) => void;
  setManifest: (manifest: any) => void;
  setBaselineProfile: (profile: TableProfile) => void;
  setThreshold: (threshold: number) => void;
  toggleDemoMode: () => void;
  toggleDarkMode: () => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  files: [],
  profiles: {},
  candidates: [],
  decisions: [],
  mergedPreview: undefined,
  violations: undefined,
  manifest: undefined,
  baselineProfile: undefined,
  settings: {
    demoMode: true,
    threshold: 0.7,
    darkMode: false,
  },
  currentStep: 0,

  setFiles: (files) => set({ files }),
  setProfiles: (profiles) => set({ profiles }),
  setCandidates: (candidates) => set({ candidates }),
  setDecisions: (decisions) => set({ decisions }),
  updateDecision: (index, decision) =>
    set((state) => ({
      decisions: state.decisions.map((d, i) =>
        i === index ? { ...d, ...decision } : d
      ),
    })),
  setMergedPreview: (mergedPreview) => set({ mergedPreview }),
  setViolations: (violations) => set({ violations }),
  setManifest: (manifest) => set({ manifest }),
  setBaselineProfile: (baselineProfile) => set({ baselineProfile }),
  setThreshold: (threshold) =>
    set((state) => ({
      settings: { ...state.settings, threshold },
    })),
  toggleDemoMode: () =>
    set((state) => ({
      settings: { ...state.settings, demoMode: !state.settings.demoMode },
    })),
  toggleDarkMode: () =>
    set((state) => ({
      settings: { ...state.settings, darkMode: !state.settings.darkMode },
    })),
  setCurrentStep: (currentStep) => set({ currentStep }),
  reset: () =>
    set({
      files: [],
      profiles: {},
      candidates: [],
      decisions: [],
      mergedPreview: undefined,
      violations: undefined,
      manifest: undefined,
      currentStep: 0,
    }),
}));
