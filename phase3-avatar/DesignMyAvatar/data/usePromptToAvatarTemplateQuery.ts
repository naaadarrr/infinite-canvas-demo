import { trpc } from '@/lib/trpc/client';

export const usePromptToAvatarTemplateQuery =
  trpc.promptToAvatar.getTemplatePrompts.useQuery;
