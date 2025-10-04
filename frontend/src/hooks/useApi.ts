import { useCallback } from "react";
import { profile as apiProfile, match as apiMatch } from "@/api/client";
import type { ProfileResponse, MatchResponse } from "@/api/types";

export function useApi() {
  const profile = useCallback(async (files: File[]): Promise<ProfileResponse> => {
    return apiProfile(files);
  }, []);

  const match = useCallback(async (left: File, right: File): Promise<MatchResponse> => {
    return apiMatch(left, right);
  }, []);

  return { profile, match };
}


