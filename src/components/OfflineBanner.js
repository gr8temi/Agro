import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetwork } from '../context/NetworkContext';
import { useTheme } from '../context/ThemeContext';
import { useOutbox } from '../context/OutboxContext';

const BACK_ONLINE_DURATION = 2500;
// Keep the pill clear of the bottom tab bar.
const TAB_BAR_OFFSET = 64;

const OfflineBanner = () => {
  const { isOnline } = useNetwork();
  const { pendingCount } = useOutbox();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const wasOffline = useRef(false);
  const [mode, setMode] = useState(null); // 'offline' | 'online' | null

  useEffect(() => {
    let timer;
    if (!isOnline) {
      wasOffline.current = true;
      setMode('offline');
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else if (wasOffline.current) {
      wasOffline.current = false;
      setMode('online');
      timer = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true })
          .start(({ finished }) => finished && setMode(null));
      }, BACK_ONLINE_DURATION);
    }
    return () => clearTimeout(timer);
  }, [isOnline, opacity]);

  if (!mode) return null;

  const offline = mode === 'offline';
  const backgroundColor = offline ? theme.colors.text : theme.colors.primary;
  const color = offline ? theme.colors.background : '#FFFFFF';

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.container, { opacity, backgroundColor, bottom: insets.bottom + TAB_BAR_OFFSET }]}
    >
      <MaterialCommunityIcons name={offline ? 'cloud-off-outline' : 'cloud-check-outline'} size={18} color={color} />
      <Text style={[styles.text, { color }]}>
        {offline
          ? `You're offline${pendingCount ? ` · ${pendingCount} waiting to sync` : ''}`
          : pendingCount ? 'Back online · syncing…' : 'Back online'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default OfflineBanner;
