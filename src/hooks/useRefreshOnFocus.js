import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

// Refetch when the screen regains focus (e.g. after returning from an Add screen).
// Skips the first focus, since queries already fetch on mount.
export const useRefreshOnFocus = (refetch) => {
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
};
