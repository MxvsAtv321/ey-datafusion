import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransformSpec } from '../types/transform';
import { MergePreview } from '../types/merge';
import { MockService } from './MockService';

export type ApprovedMapping = {
  candidateId: string;
  fromColumn: string;
  toColumn: string;
};

export const useMergePreview = (
  runId: string, 
  approvedMappings: ApprovedMapping[], 
  transforms: TransformSpec[]
) => {
  return useQuery({
    queryKey: ['mergePreview', runId, approvedMappings, transforms],
    queryFn: () => MockService.mergePreview(runId, approvedMappings, transforms),
    enabled: !!runId && approvedMappings.length > 0,
  });
};

export const useApplyMerge = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      runId, 
      approvedMappings, 
      transforms 
    }: { 
      runId: string; 
      approvedMappings: ApprovedMapping[]; 
      transforms: TransformSpec[] 
    }) => MockService.mergePreview(runId, approvedMappings, transforms),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        ['mergePreview', variables.runId, variables.approvedMappings, variables.transforms], 
        data
      );
    },
  });
};
