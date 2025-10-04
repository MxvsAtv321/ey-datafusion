import { SuggestResponse } from '../types/mapping';
import { MockService } from './MockService';

export const suggestMappings = async (runId: string): Promise<SuggestResponse> => {
  // Always use MockService for now since we're in development
  return MockService.suggestMappings(runId);
};
