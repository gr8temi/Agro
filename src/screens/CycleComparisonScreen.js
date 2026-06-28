import React, { useEffect, useState, useContext } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions,
} from 'react-native';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const { width } = Dimensions.get('window');

const CycleComparisonScreen = ({ navigation }) => {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { displayCurrency, farmBaseCurrency } = useContext(AuthContext);
  const isConverting = displayCurrency !== farmBaseCurrency;
  const styles = getStyles(theme);

  useEffect(() => {
    const fetchCycles = async () => {
      try {
        const params = {};
        if (displayCurrency !== farmBaseCurrency) params.currency = displayCurrency;
        const response = await client.get('/flocks/cycle_comparison/', { params });
        setCycles(response.data.cycles || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCycles();
  }, [displayCurrency, farmBaseCurrency]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const MetricRow = ({ label, values, format, highlight }) => (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValues}>
        {values.map((val, i) => {
          let displayVal = val;
          if (format === 'currency') displayVal = `${isConverting ? '≈ ' : ''}${formatCurrency(val, displayCurrency)}`;
          else if (format === 'percent') displayVal = val != null ? `${val}%` : '—';
          else if (format === 'number') displayVal = val?.toLocaleString() ?? '—';
          else displayVal = val ?? '—';

          const isPositive = highlight && typeof val === 'number' && val > 0;
          const isNegative = highlight && typeof val === 'number' && val < 0;

          return (
            <Text
              key={i}
              style={[
                styles.metricValue,
                isPositive && { color: '#4CAF50' },
                isNegative && { color: '#F44336' },
              ]}
            >
              {displayVal}
            </Text>
          );
        })}
      </View>
    </View>
  );

  if (cycles.length === 0) {
    return (
      <View style={styles.mainContainer}>
        <CustomHeader title="Cycle Comparison" navigation={navigation} showBack={true} />
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="chart-bar" size={64} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>No cycles to compare yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Cycle Comparison" navigation={navigation} showBack={true} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cycle headers */}
        <View style={styles.headerRow}>
          <View style={styles.metricLabelSpace} />
          <View style={styles.metricValues}>
            {cycles.map(c => (
              <View key={c.id} style={styles.cycleHeader}>
                <Text style={styles.cycleName} numberOfLines={1}>{c.name}</Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: c.status === 'active' ? '#4CAF50' : '#9E9E9E' }
                ]} />
              </View>
            ))}
          </View>
        </View>

        {/* Production section */}
        <Text style={styles.sectionTitle}>Production</Text>
        <View style={styles.sectionCard}>
          <MetricRow
            label="Duration"
            values={cycles.map(c => c.duration_days != null ? `${c.duration_days}d` : '—')}
          />
          <MetricRow
            label="Initial Birds"
            values={cycles.map(c => c.initial_quantity)}
            format="number"
          />
          <MetricRow
            label="Current Birds"
            values={cycles.map(c => c.final_quantity)}
            format="number"
          />
          <MetricRow
            label="Mortality"
            values={cycles.map(c => c.mortality)}
            format="number"
          />
          <MetricRow
            label="Mortality Rate"
            values={cycles.map(c => c.mortality_rate)}
            format="percent"
          />
          <MetricRow
            label="Total Eggs"
            values={cycles.map(c => c.total_eggs)}
            format="number"
          />
          <MetricRow
            label="Eggs/Bird"
            values={cycles.map(c => c.eggs_per_bird)}
            format="number"
          />
          <MetricRow
            label="Feed (kg)"
            values={cycles.map(c => c.total_feed_kg)}
            format="number"
          />
        </View>

        {/* Financial section */}
        <Text style={styles.sectionTitle}>Financials</Text>
        <View style={styles.sectionCard}>
          <MetricRow
            label="Feed Cost"
            values={cycles.map(c => c.total_feed_cost)}
            format="currency"
          />
          <MetricRow
            label="Health Cost"
            values={cycles.map(c => c.total_health_cost)}
            format="currency"
          />
          <MetricRow
            label="Total Expense"
            values={cycles.map(c => c.total_expense)}
            format="currency"
          />
          <MetricRow
            label="Total Income"
            values={cycles.map(c => c.total_income)}
            format="currency"
          />
          <MetricRow
            label="Net Profit"
            values={cycles.map(c => c.net_profit)}
            format="currency"
            highlight
          />
          <MetricRow
            label="ROI"
            values={cycles.map(c => c.roi)}
            format="percent"
            highlight
          />
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (theme) => StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  metricLabelSpace: {
    width: 100,
  },
  metricValues: {
    flex: 1,
    flexDirection: 'row',
  },
  cycleHeader: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  cycleName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  metricLabel: {
    width: 100,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  metricValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  emptyText: {
    ...theme.typography.body,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default CycleComparisonScreen;
