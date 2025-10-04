import { SuggestResponse } from '../types/mapping';
import { MockService } from './MockService';

export const suggestMappings = async (runId: string): Promise<SuggestResponse> => {
  if (import.meta.env.VITE_MOCK === "1") {
    return MockService.suggestMappings(runId);
  }
  
  // Real API call would go here
  const response = await fetch(`/api/mappings/suggest?runId=${encodeURIComponent(runId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch mappings: ${response.statusText}`);
  }
  return response.json();
};
