import { useEffect } from 'react';
import { useTourGuideController } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

/**
 * Hook to manage a single-run tour for a specific screen.
 * @param {string} tourKey - Unique key for the tour (e.g., 'FlockListTour').
 * @param {number} startDelay - Delay in ms before starting the tour.
 * @returns {object} - Returns tour controller methods and state.
 */
export const useScreenTour = (tourKey, startDelay = 500) => {
  const { canStart, start, stop, eventEmitter, tourKey: activeTourKey } = useTourGuideController();
  const isFocused = useIsFocused();

  useEffect(() => {
    let timeout;
    
    const checkAndStartTour = async () => {
      if (!isFocused) return;
      
      try {
        const hasSeenTour = await AsyncStorage.getItem(`tour_${tourKey}`);
        if (!hasSeenTour) {
          timeout = setTimeout(() => {
            if (canStart) {
              start();
            }
          }, startDelay);
        }
      } catch (error) {
        console.error('Error checking tour status:', error);
      }
    };

    checkAndStartTour();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [tourKey, canStart, start, isFocused, startDelay]);

  // Listen for stop event to mark as seen
  useEffect(() => {
    const handleStop = async () => {
        // Only mark as seen if this specific tour was running
        // specific tour key validation might be tricky with rn-tourguide as it doesn't pass key to stop
        // but if we are on this screen and it stops, we can assume it was this tour.
        if (isFocused) {
            await AsyncStorage.setItem(`tour_${tourKey}`, 'true');
        }
    };

    if (eventEmitter) {
      eventEmitter.on('stop', handleStop);
    }

    return () => {
      if (eventEmitter) {
        eventEmitter.off('stop', handleStop);
      }
    };
  }, [eventEmitter, tourKey, isFocused]);

  return { canStart, start, stop, eventEmitter };
};
