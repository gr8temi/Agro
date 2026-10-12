import React, { useCallback, useState, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import client from '../api/client';
import { useFlock, useHealthLogs, useEggCollections } from '../api/queries';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useOutbox } from '../context/OutboxContext';
import { formatCurrency } from '../utils/currency';

const fmt = (amount, currency, isConverting) =>
  `${isConverting ? '≈ ' : ''}${formatCurrency(amount, currency)}`;

const { width } = Dimensions.get('window');
const TABS = ['Overview', 'Eggs', 'Health'];

const FlockDetailScreen = ({ route, navigation }) => {
  const { flockId, flockName } = route.params;
  const [activeTab, setActiveTab] = useState('Overview');
  const pagerRef = useRef(null);
  const { theme } = useTheme();
  const { userInfo, displayCurrency, farmBaseCurrency } = useContext(AuthContext);
  const flockQuery = useFlock(flockId, displayCurrency, farmBaseCurrency);
  const healthQuery = useHealthLogs(flockId, displayCurrency, farmBaseCurrency);
  const eggQuery = useEggCollections(flockId);
  const { pendingFor } = useOutbox();

  // Entries saved offline but not yet synced. Server rows carry the same client_id
  // once synced, so skip any the server already has.
  const withPending = (rows, type, overrides = {}) => {
    const synced = new Set(rows.map((r) => r.client_id).filter(Boolean));
    const pending = pendingFor(type, flockId)
      .filter((i) => !synced.has(i.id))
      .map((i) => ({ ...i.payload, ...overrides, id: i.id, _pending: true }));
    return [...pending, ...rows];
  };
  const flock = flockQuery.data ?? null;
  // Pending costs may be in a different currency, so leave them out of totals until synced.
  const healthLogs = withPending(healthQuery.data ?? [], 'healthLog', { cost: 0 });
  const eggCollections = withPending(eggQuery.data ?? [], 'eggCollection');
  const pendingCount = healthLogs.filter((l) => l._pending).length
    + eggCollections.filter((e) => e._pending).length
    + pendingFor('feedLog', flockId).length;
  const loading = flockQuery.isLoading || healthQuery.isLoading || eggQuery.isLoading;
  const isConverting = displayCurrency !== farmBaseCurrency;
  const styles = getStyles(theme);

  const isManager = userInfo?.role === 'superuser' || userInfo?.role === 'manager';
  const canManageFinances = userInfo?.role === 'superuser' || userInfo?.role === 'manager' || userInfo?.permissions?.can_manage_finances;
  const isClosed = flock?.status === 'closed';

  const switchTab = (tab) => {
    const index = TABS.indexOf(tab);
    setActiveTab(tab);
    pagerRef.current?.scrollTo({ x: index * width, animated: true });
  };

  const refetchAll = useCallback(() => {
    flockQuery.refetch();
    healthQuery.refetch();
    eggQuery.refetch();
  }, [flockQuery.refetch, healthQuery.refetch, eggQuery.refetch]);

  useRefreshOnFocus(refetchAll);

  const handleReopen = () => {
    Alert.alert(
      'Reopen Cycle',
      `Reopen "${flock.name}"? This will allow new logs and transactions again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reopen',
          onPress: async () => {
            try {
              await client.post(`/flocks/${flockId}/reopen_cycle/`);
              refetchAll();
            } catch (error) {
              const detail = error.response?.data?.detail || 'Failed to reopen cycle.';
              Alert.alert('Error', detail);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!flock) {
    if (flockQuery.fetchStatus !== 'paused') return null;
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="cloud-off-outline" size={48} color={theme.colors.textSecondary} />
        <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>
          You're offline. This flock will load when you reconnect.
        </Text>
      </View>
    );
  }

  // ── Derived stats ───────────────────────────────────────────
  const totalEggs    = eggCollections.reduce((s, r) => s + (r.quantity_collected || 0), 0);
  const totalDamaged = eggCollections.reduce((s, r) => s + (r.damaged || 0), 0);
  const netEggs      = totalEggs - totalDamaged;
  const lastEgg      = [...eggCollections].sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const healthTypeConfig = {
    vaccination: { icon: 'needle',                       color: '#4CAF50', label: 'Vaccinations' },
    medication:  { icon: 'pill',                         color: '#2196F3', label: 'Medications'  },
    mortality:   { icon: 'alert-circle-outline',          color: '#F44336', label: 'Mortality'    },
    other:       { icon: 'dots-horizontal-circle-outline',color: '#9E9E9E', label: 'Other'        },
  };
  const healthCounts   = { vaccination: 0, medication: 0, mortality: 0, other: 0 };
  let   totalAffected  = 0;
  let   totalHealthCost = 0;
  healthLogs.forEach(log => {
    if (healthCounts[log.log_type] !== undefined) healthCounts[log.log_type]++;
    totalAffected   += log.affected_birds || 0;
    totalHealthCost += parseFloat(log.cost) || 0;
  });

  // ── Sub-components ──────────────────────────────────────────
  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: theme.colors.primary + '18' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  const StatCard = ({ icon, color, value, label, wide }) => (
    <View style={[styles.statCard, wide && styles.statCardWide, { borderColor: color + '40', backgroundColor: color + '12' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionBtn = ({ icon, label, onPress, color }) => (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <MaterialCommunityIcons name={icon} size={22} color="#fff" />
      <Text style={styles.actionBtnText}>{label}</Text>
    </TouchableOpacity>
  );

  const EmptyState = ({ icon, text }) => (
    <View style={styles.emptyCard}>
      <MaterialCommunityIcons name={icon} size={40} color={theme.colors.textSecondary} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  // ── Tab content ─────────────────────────────────────────────
  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Closed banner */}
      {isClosed && (
        <View style={styles.closedBanner}>
          <MaterialCommunityIcons name="archive-outline" size={20} color="#F44336" />
          <View style={{ flex: 1 }}>
            <Text style={styles.closedBannerTitle}>Cycle Closed</Text>
            <Text style={styles.closedBannerSub}>
              {flock.closure_reason && `Reason: ${flock.closure_reason}`}
              {flock.end_date && ` · Ended ${flock.end_date}`}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.sectionLabel}>FLOCK INFO</Text>
      <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <InfoRow icon="dna"      label="Breed"            value={flock.breed} />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <InfoRow icon="counter"  label="Initial Quantity"  value={`${flock.initial_quantity} birds`} />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <InfoRow icon="counter"  label="Current Quantity"  value={`${flock.current_quantity} birds`} />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <InfoRow icon="calendar" label="Start Date"        value={flock.start_date || '—'} />
        {isClosed && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="calendar-check" label="End Date" value={flock.end_date || '—'} />
          </>
        )}
        {flock.cycle_duration_days != null && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="clock-outline" label="Duration" value={`${flock.cycle_duration_days} days`} />
          </>
        )}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 20 }]}>AT A GLANCE</Text>
      <View style={styles.glanceRow}>
        <TouchableOpacity
          style={[styles.glanceTile, { backgroundColor: '#FF980018', borderColor: '#FF980040' }]}
          onPress={() => switchTab('Eggs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.glanceNum, { color: '#FF9800' }]}>{totalEggs.toLocaleString()}</Text>
          <Text style={styles.glanceLabel}>Eggs Collected</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.glanceTile, { backgroundColor: '#F4433618', borderColor: '#F4433640' }]}
          onPress={() => switchTab('Health')}
          activeOpacity={0.7}
        >
          <Text style={[styles.glanceNum, { color: '#F44336' }]}>{healthLogs.length}</Text>
          <Text style={styles.glanceLabel}>Health Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.glanceTile, { backgroundColor: '#4CAF5018', borderColor: '#4CAF5040' }]}
          onPress={() => switchTab('Eggs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.glanceNum, { color: '#4CAF50' }]}>{netEggs.toLocaleString()}</Text>
          <Text style={styles.glanceLabel}>Net Eggs</Text>
        </TouchableOpacity>
      </View>

      {/* Cycle summary stats (from cached backend fields) */}
      {(isClosed || flock.total_income > 0 || flock.total_expense > 0) && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>CYCLE SUMMARY</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <InfoRow icon="cash-plus"     label="Total Income"     value={fmt(parseFloat(flock.total_income || 0), displayCurrency, isConverting)} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="cash-minus"    label="Total Expense"    value={fmt(parseFloat(flock.total_expense || 0), displayCurrency, isConverting)} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow
              icon="chart-line"
              label="Net Profit"
              value={fmt(parseFloat(flock.net_profit || 0), displayCurrency, isConverting)}
            />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="grain"         label="Total Feed"       value={`${parseFloat(flock.total_feed_kg || 0).toLocaleString()} kg`} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="skull-outline"  label="Total Mortality"  value={`${flock.total_mortality || 0} birds`} />
          </View>
        </>
      )}

      {/* Action buttons */}
      {!isClosed && isManager && (
        <ActionBtn
          icon="archive-outline"
          label="Close Cycle"
          onPress={() => navigation.navigate('CloseCycle', { flockId: flock.id, flockName: flock.name })}
          color="#F44336"
        />
      )}
      {isClosed && isManager && (
        <ActionBtn
          icon="refresh"
          label="Reopen Cycle"
          onPress={handleReopen}
          color={theme.colors.primary}
        />
      )}

      {canManageFinances && (
        <>
          <ActionBtn
            icon="receipt"
            label="Sell"
            onPress={() => navigation.navigate('SalesInvoice', { flockId: flock.id, flockName: flock.name })}
            color="#4CAF50"
          />
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => navigation.navigate('InvoiceList', { selectedCycle: flock.id, cycleName: flock.name })}
          >
            <MaterialCommunityIcons name="file-document-multiple-outline" size={18} color={theme.colors.primary} />
            <Text style={[styles.linkBtnText, { color: theme.colors.primary }]}>View Invoices</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const renderEggs = () => (
    <View style={styles.tabContent}>
      {eggCollections.length === 0 ? (
        <EmptyState icon="egg-off-outline" text={isClosed ? "No egg records for this cycle." : "No egg records yet. Tap below to record the first collection."} />
      ) : (
        <>
          <Text style={styles.sectionLabel}>PRODUCTION SUMMARY</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="egg-outline"           color="#FF9800" value={totalEggs.toLocaleString()}    label="Total Collected" />
            <StatCard icon="egg-off-outline"        color="#F44336" value={totalDamaged.toLocaleString()} label="Damaged" />
            <StatCard icon="check-circle-outline"   color="#4CAF50" value={netEggs.toLocaleString()}      label="Net Eggs" wide />
            {lastEgg && (
              <StatCard
                icon="calendar-check-outline"
                color={theme.colors.primary}
                value={new Date(lastEgg.date).toLocaleDateString()}
                label="Last Recorded"
                wide
              />
            )}
          </View>
        </>
      )}

      {!isClosed && (
        <ActionBtn
          icon="egg"
          label="Record Egg Collection"
          onPress={() => navigation.navigate('AddEggCollection', { flockId })}
          color={theme.colors.secondary}
        />
      )}
    </View>
  );

  const renderHealth = () => (
    <View style={styles.tabContent}>
      {healthLogs.length === 0 ? (
        <EmptyState icon="medical-bag" text={isClosed ? "No health records for this cycle." : "No health records yet. Tap below to add the first entry."} />
      ) : (
        <>
          <Text style={styles.sectionLabel}>EVENT BREAKDOWN</Text>
          <View style={styles.statsGrid}>
            {Object.entries(healthTypeConfig).map(([type, cfg]) => (
              <StatCard key={type} icon={cfg.icon} color={cfg.color} value={healthCounts[type]} label={cfg.label} />
            ))}
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 16 }]}>IMPACT</Text>
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <InfoRow icon="bird"                  label="Birds Affected" value={totalAffected.toLocaleString()} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="cash-multiple"          label="Total Health Cost" value={fmt(totalHealthCost, displayCurrency, isConverting)} />
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <InfoRow icon="clipboard-list-outline" label="Total Entries" value={`${healthLogs.length} logs`} />
          </View>
        </>
      )}

      {!isClosed && (
        <ActionBtn
          icon="medical-bag"
          label="Add Health Log"
          onPress={() => navigation.navigate('AddHealthLog', { flockId })}
          color={theme.colors.primary}
        />
      )}
    </View>
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <View style={styles.main}>
      <CustomHeader title={flockName} navigation={navigation} showBack={true} />

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        {TABS.map(tab => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity key={tab} style={styles.tabItem} onPress={() => switchTab(tab)}>
              <Text style={[styles.tabText, active && { color: theme.colors.primary }]}>{tab}</Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: theme.colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {pendingCount > 0 && (
        <View style={[styles.pendingNote, { backgroundColor: theme.colors.secondary + '22' }]}>
          <MaterialCommunityIcons name="cloud-upload-outline" size={16} color={theme.colors.text} />
          <Text style={[styles.pendingNoteText, { color: theme.colors.text }]}>
            {pendingCount} {pendingCount === 1 ? 'entry' : 'entries'} waiting to sync. Totals include them.
          </Text>
        </View>
      )}

      {/* Paged content */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setActiveTab(TABS[index]);
        }}
        style={{ flex: 1 }}
      >
        <ScrollView style={{ width }} contentContainerStyle={styles.scroll}>
          {renderOverview()}
        </ScrollView>
        <ScrollView style={{ width }} contentContainerStyle={styles.scroll}>
          {renderEggs()}
        </ScrollView>
        <ScrollView style={{ width }} contentContainerStyle={styles.scroll}>
          {renderHealth()}
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  main:    { flex: 1, backgroundColor: theme.colors.background },
  centered:{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  scroll:  { padding: 16, paddingBottom: 40 },
  pendingNote: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  pendingNoteText: { fontSize: 13, flex: 1 },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 12, position: 'relative',
  },
  tabText: {
    fontSize: 14, fontWeight: '700', color: theme.colors.textSecondary,
  },
  tabUnderline: {
    position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 3, borderRadius: 2,
  },

  tabContent: { gap: 12 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: theme.colors.textSecondary, marginBottom: 8,
  },

  // Closed banner
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F4433612',
    borderWidth: 1,
    borderColor: '#F4433630',
    borderRadius: 12,
    padding: 14,
  },
  closedBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F44336',
    marginBottom: 2,
  },
  closedBannerSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Info card
  card: {
    borderRadius: 16, borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  infoLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 16, color: theme.colors.text, fontWeight: '700', marginTop: 1 },
  divider:   { height: 1, marginHorizontal: 16 },

  // Glance tiles
  glanceRow: { flexDirection: 'row', gap: 10 },
  glanceTile: {
    flex: 1, borderRadius: 14, borderWidth: 1,
    paddingVertical: 16, alignItems: 'center',
  },
  glanceNum:   { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  glanceLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  // Stat cards
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: (width - 42) / 2,
    padding: 14, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', gap: 4,
  },
  statCardWide: { width: '100%' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  // Action button
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 14, marginTop: 8,
    gap: 8, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6, marginTop: 4,
  },
  linkBtnText: { fontSize: 14, fontWeight: '600' },

  // Empty state
  emptyCard: {
    alignItems: 'center', padding: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border,
  },
  emptyText: {
    marginTop: 10, color: theme.colors.textSecondary,
    fontSize: 14, textAlign: 'center', lineHeight: 20,
  },
});

export default FlockDetailScreen;
