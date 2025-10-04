import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransformSpec } from '../types/transform';
import { MergePreview } from '../types/merge';
import { MockService } from './MockService';

export const usePreviewTransforms = (runId: string, transforms: TransformSpec[]) => {
  return useQuery({
    queryKey: ['previewTransforms', runId, transforms],
    queryFn: () => MockService.previewTransforms(runId, transforms),
    enabled: !!runId,
  });
};

export const useApplyTransforms = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ runId, transforms }: { runId: string; transforms: TransformSpec[] }) =>
      MockService.previewTransforms(runId, transforms),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['previewTransforms', variables.runId, variables.transforms], data);
    },
  });
};
