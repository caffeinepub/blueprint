import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ProjectBlueprintView } from '../backend';
import { saveTaskCompletion, getDateKey } from '../lib/calendarTasks';

/**
 * Fetch caller's project blueprints (only blueprints created by the current user)
 */
export function useGetCallerProjectBlueprints() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isConnected = !!actor;
  const isAuthenticated = !!identity;

  return useQuery<ProjectBlueprintView[]>({
    queryKey: ['callerProjectBlueprints'],
    queryFn: async () => {
      if (!isConnected || !isAuthenticated) return [];
      
      try {
        const actorAny = actor as any;
        if (typeof actorAny.getProjectBlueprints !== 'function') {
          return [];
        }
        
        const allBlueprints = await actorAny.getProjectBlueprints();
        
        // Filter to only blueprints created by the caller
        const callerPrincipal = identity.getPrincipal();
        const callerBlueprints = allBlueprints.filter(
          (bp: ProjectBlueprintView) => bp.createdBy.toString() === callerPrincipal.toString()
        );
        
        return callerBlueprints;
      } catch (error) {
        console.error('Failed to fetch caller project blueprints:', error);
        return [];
      }
    },
    enabled: isConnected && !actorFetching && isAuthenticated,
    retry: 3,
  });
}

/**
 * Toggle task completion (localStorage-based with optimistic updates)
 */
export function useToggleTaskCompletion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      blueprintId,
      date,
    }: {
      taskId: string;
      blueprintId: string;
      date: Date;
    }) => {
      const dateKey = getDateKey(date);
      
      // Read current state
      const stored = localStorage.getItem(`calendar-tasks-${dateKey}`);
      const current = stored ? JSON.parse(stored) : {};
      const newCompleted = !current[taskId];
      
      // Save to localStorage
      saveTaskCompletion(dateKey, taskId, newCompleted);
      
      return { taskId, completed: newCompleted };
    },
    onSuccess: () => {
      // Invalidate to trigger re-render with new completion state
      queryClient.invalidateQueries({ queryKey: ['callerProjectBlueprints'] });
    },
  });
}
