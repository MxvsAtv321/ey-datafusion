import { create } from "zustand";
import {
  TableProfile,
  CandidateMapping,
  MappingDecision,
  ValidateResponse,
} from "@/api/types";
import { api } from "@/api/client";
import type { Pair, PairingMatrix } from "@/types/pairing";

export type Health = {
  service: string;
  version: string;
  regulated_mode: boolean;
  embeddings_enabled: boolean;
  masking_policy: { match_explain: boolean; profile_examples_masked: boolean } | null;
};

interface AppState {
  // Data
  files: File[];
  bank1Files: File[];
  bank2Files: File[];
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

  // Pairing
  pairings: Pair[];
  pairingMatrix?: PairingMatrix;
  unpairedLeft: string[];
  unpairedRight: string[];
  setPairings: (p: Pair[]) => void;
  setMatrix: (m?: PairingMatrix) => void;
  chosenFor: (leftTable: string) => string | null;
  acceptAll: () => void;

  // Health cache
  health: Health | null;
  healthLoading: boolean;
  healthError: string | null;
  fetchHealth: () => Promise<void>;
  startAutoRefresh: (ms?: number) => void;

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
  setBank1Files: (files: File[]) => void;
  setBank2Files: (files: File[]) => void;
  addBank1Files: (files: File[]) => void;
  addBank2Files: (files: File[]) => void;
  removeBank1File: (index: number) => void;
  removeBank2File: (index: number) => void;
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

let healthTimer: number | undefined;

export const useStore = create<AppState>((set, get) => ({
  files: [],
  bank1Files: [],
  bank2Files: [],
  profiles: {},
  candidates: [],
  decisions: [],
  mergedPreview: undefined,
  violations: undefined,
  manifest: undefined,
  baselineProfile: undefined,
  // pairing defaults
  pairings: [],
  pairingMatrix: undefined,
  unpairedLeft: [],
  unpairedRight: [],
  setPairings: (p) => set({ pairings: p }),
  setMatrix: (m) => set({ pairingMatrix: m }),
  chosenFor: (left) => {
    const p = get().pairings.find(x => x.left_table === left);
    return p ? p.right_table : null;
    },
  acceptAll: () => set((s) => ({ pairings: s.pairings.map(p => ({ ...p, decision: "auto" })) })),

  health: null,
  healthLoading: false,
  healthError: null,
  async fetchHealth() {
    set({ healthLoading: true, healthError: null });
    try {
      const h = await api.getHealth();
      const health: Health = {
        service: h.service,
        version: h.version,
        regulated_mode: !!h.regulated_mode,
        embeddings_enabled: !!h.embeddings_enabled,
        masking_policy: h.masking_policy ?? null,
      };
      set({ health, healthLoading: false });
    } catch (e: any) {
      set({ healthLoading: false, healthError: e?.message || "Failed to load health" });
    }
  },
  startAutoRefresh(ms = 60000) {
    if (healthTimer) return;
    // initial fetch
    get().fetchHealth();
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    healthTimer = window.setInterval(() => {
      get().fetchHealth();
    }, ms);
  },
  settings: {
    demoMode: true,
    threshold: 0.7,
    darkMode: false,
  },
  currentStep: 0,

  setFiles: (files) => set({ files }),
  setBank1Files: (bank1Files) => set({ bank1Files }),
  setBank2Files: (bank2Files) => set({ bank2Files }),
  addBank1Files: (newFiles) =>
    set((state) => ({ bank1Files: [...state.bank1Files, ...newFiles] })),
  addBank2Files: (newFiles) =>
    set((state) => ({ bank2Files: [...state.bank2Files, ...newFiles] })),
  removeBank1File: (index) =>
    set((state) => ({
      bank1Files: state.bank1Files.filter((_, i) => i !== index),
    })),
  removeBank2File: (index) =>
    set((state) => ({
      bank2Files: state.bank2Files.filter((_, i) => i !== index),
    })),
  setProfiles: (profiles) => set({ profiles }),
  setCandidates: (candidates) => set({ candidates }),
  setDecisions: (decisions) => set({ decisions }),
  upsertDecision: (indexOrDecision: any, maybeDecision?: any) =>
    set((state) => {
      if (typeof indexOrDecision === "number") {
        const index = indexOrDecision as number;
        const decision = maybeDecision as Partial<MappingDecision>;
        return {
          decisions: state.decisions.map((d, i) => (i === index ? { ...d, ...decision } : d)),
        };
      }
      const d = indexOrDecision as MappingDecision;
      const others = state.decisions.filter(
        (x) => !(x.left_table === d.left_table && x.left_column === d.left_column)
      );
      return { decisions: [...others, d] };
    }),
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
  setThreshold: (threshold) => set((state) => ({ settings: { ...state.settings, threshold } })),
  bulkAcceptAuto: (leftTable: string, rightTable: string) =>
    set((state) => {
      const t = state.settings.threshold;
      const chosen = state.candidates.reduce((acc: Record<string, any>, c) => {
        const k = c.left_column;
        if (!acc[k] || c.confidence > acc[k].confidence) acc[k] = c;
        return acc;
      }, {} as Record<string, any>);
      const autos: MappingDecision[] = Object.values(chosen)
        .filter((c: any) => c.confidence >= t)
        .map((c: any) => ({
          left_table: leftTable,
          left_column: c.left_column,
          right_table: rightTable,
          right_column: c.right_column,
          decision: "auto",
          confidence: c.confidence,
        }));
      return { decisions: autos };
    }),
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
      bank1Files: [],
      bank2Files: [],
      profiles: {},
      candidates: [],
      decisions: [],
      mergedPreview: undefined,
      violations: undefined,
      manifest: undefined,
      currentStep: 0,
      pairings: [],
      pairingMatrix: undefined,
      unpairedLeft: [],
      unpairedRight: [],
    }),
}));
