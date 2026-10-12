import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, onlineManager, focusManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

// Pause fetches while offline and resume them when the connection returns.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected && state.isInternetReachable !== false);
  })
);

// Refetch stale queries when the app comes back to the foreground.
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (status) => {
    handleFocus(status === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Must be at least CACHE_MAX_AGE, or queries are dropped before they're persisted.
      gcTime: CACHE_MAX_AGE,
      staleTime: 30 * 1000,
      networkMode: 'offlineFirst',
      retry: 2,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'cluckops-query-cache',
  throttleTime: 1000,
});

export const persistOptions = {
  persister,
  maxAge: CACHE_MAX_AGE,
  // Bump when cached response shapes change so old caches are discarded.
  buster: 'v1',
};

export const clearQueryCache = async () => {
  queryClient.clear();
  await persister.removeClient();
};
