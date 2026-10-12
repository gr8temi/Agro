import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../context/ThemeContext';
import { useOutbox } from '../context/OutboxContext';
import { useNetwork } from '../context/NetworkContext';
import { OUTBOX_TYPES } from '../offline/outbox';

const SyncQueueScreen = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { items, pendingCount, sync, retry, discard } = useOutbox();
  const { isOnline } = useNetwork();
  const [syncing, setSyncing] = useState(false);

  // Failed entries first, since they need the user's attention.
  const sorted = [...items].sort((a, b) =>
    (a.status === 'failed' ? 0 : 1) - (b.status === 'failed' ? 0 : 1)
    || a.createdAt.localeCompare(b.createdAt)
  );

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await sync();
    } finally {
      setSyncing(false);
    }
  };

  const confirmDiscard = (item) => {
    Alert.alert(
      'Discard entry?',
      `This ${OUTBOX_TYPES[item.type].label.toLowerCase()} will be deleted from this phone and never synced.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => discard(item.id) },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const config = OUTBOX_TYPES[item.type];
    const failed = item.status === 'failed';
    const statusColor = failed ? theme.colors.error : theme.colors.textSecondary;

    return (
      <View style={[styles.card, failed && { borderColor: theme.colors.error }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconContainer}>
            <MaterialCommunityIcons name={config.icon} size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{config.label}</Text>
            <Text style={styles.cardDetail}>{config.summary(item.payload)}</Text>
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name={failed ? 'alert-circle-outline' : 'clock-outline'}
                size={14}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {failed ? item.error : 'Waiting to sync'}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => confirmDiscard(item)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Discard</Text>
          </TouchableOpacity>
          {failed && (
            <TouchableOpacity onPress={() => retry(item.id)} style={styles.actionButton}>
              <Text style={[styles.actionText, { color: theme.colors.primary }]}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Pending Changes" navigation={navigation} showBack={true} />
      <View style={styles.container}>
        {pendingCount > 0 && (
          <TouchableOpacity
            style={[styles.syncButton, !isOnline && styles.syncButtonDisabled]}
            onPress={handleSyncNow}
            disabled={!isOnline || syncing}
          >
            {syncing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.syncButtonText}>
                {isOnline ? `Sync ${pendingCount} now` : 'Offline. Will sync when connected'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cloud-check-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>Everything is synced.</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.m,
  },
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  syncButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    ...theme.typography.button,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  cardDetail: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  statusText: {
    fontSize: 13,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.xl * 2,
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
});

export default SyncQueueScreen;
