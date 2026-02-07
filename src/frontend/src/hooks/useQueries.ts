import { useActor } from './useActor';

// This file is reserved for React Query hooks that interact with the backend.
// Currently, the Black Zephyr application uses static assets and the Grok API,
// so no backend queries are needed at this time.

export function useBackendReady() {
  const { actor, isFetching } = useActor();
  return { isReady: !!actor && !isFetching };
}
