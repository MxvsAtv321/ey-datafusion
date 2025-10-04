import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MergePreview } from '../types/merge';
import { ChecksResult } from '../types/checks';
import { MockService } from './MockService';

export const useRunChecks = (runId: string, preview: MergePreview | null) => {
  return useQuery({
    queryKey: ['runChecks', runId, preview],
    queryFn: () => MockService.runChecks(runId, preview!),
    enabled: !!runId && !!preview,
  });
};

export const useApplyCheckFix = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ runId, preview }: { runId: string; preview: MergePreview }) =>
      MockService.runChecks(runId, preview),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['runChecks', variables.runId, variables.preview], data);
    },
  });
};
