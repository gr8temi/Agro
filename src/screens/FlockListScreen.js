import React, { useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFlocks } from '../api/queries';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { useNavigation } from '@react-navigation/native';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

const TABS = ['Active', 'History'];

const FlockListScreen = () => {
  const [activeTab, setActiveTab] = useState('Active');
  const { data: flocks = [], isLoading: loading, fetchStatus, refetch } =
    useFlocks(activeTab === 'Active' ? 'active' : 'closed');
  const offlineWithoutData = fetchStatus === 'paused' && flocks.length === 0;
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { userInfo } = useContext(AuthContext);
  const styles = getStyles(theme);

  const isManager = userInfo?.role === 'superuser' || userInfo?.role === 'manager';

  useRefreshOnFocus(refetch);

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('FlockDetail', { flockId: item.id, flockName: item.name })}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <MaterialCommunityIcons name="bird" size={32} color={theme.colors.primary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          {item.status === 'closed' && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedBadgeText}>CLOSED</Text>
            </View>
          )}
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="dna" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail}> {item.breed}</Text>
        </View>
        <View style={styles.cardRow}>
          <MaterialCommunityIcons name="counter" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.cardDetail}> {item.current_quantity} birds</Text>
        </View>
        {item.status === 'closed' && item.closure_reason && (
          <View style={styles.cardRow}>
            <MaterialCommunityIcons name="tag-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.cardDetail}> {item.closure_reason}</Text>
          </View>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="My Flocks" navigation={navigation} showBack={true} />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => switchTab(tab)}>
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              {active && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={flocks}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name={offlineWithoutData ? 'cloud-off-outline' : activeTab === 'Active' ? 'barn' : 'archive-outline'}
                  size={64}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {offlineWithoutData
                    ? "You're offline. Flocks will load when you reconnect."
                    : activeTab === 'Active'
                      ? 'No active flocks. Tap + to start a new cycle!'
                      : 'No closed cycles yet.'}
                </Text>
              </View>
            }
          />
        )}

        {activeTab === 'Active' && isManager && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddFlock')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={30} color="#fff" />
          </TouchableOpacity>
        )}

        {activeTab === 'History' && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('CycleComparison')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chart-bar" size={26} color="#fff" />
          </TouchableOpacity>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  listContent: {
    paddingBottom: 80,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${theme.colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.s,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  closedBadge: {
    backgroundColor: '#F4433620',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F44336',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardDetail: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
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
    marginTop: theme.spacing.m,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default FlockListScreen;
