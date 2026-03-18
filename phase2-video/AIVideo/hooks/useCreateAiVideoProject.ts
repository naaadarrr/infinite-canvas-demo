import { trpc } from '@/lib/trpc/client';
import { EnumCreateIndependentProjectType } from '@/server/api/services/common/project/type';
import { wrapMutation } from '@/lib/trpc/helper';

export function useCreateAiVideoProject() {
  const createAiVideoProjectMutation = wrapMutation(
    trpc.common.project.createIndependentProject.useMutation()
  );

  return async (prompt: string, count: number) => {
    const res = await createAiVideoProjectMutation.mutateAsync({
      type: EnumCreateIndependentProjectType.AI_VIDEO,
      prompt,
      count
    });
    return res;
  };
}
