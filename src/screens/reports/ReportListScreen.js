import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApiQuery, asList } from '../../api/queries';
import { ThemeContext } from '../../context/ThemeContext';
import { useRefreshOnFocus } from '../../hooks/useRefreshOnFocus';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ReportListScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = theme.colors;
  const { data, isLoading: loading, refetch: fetchReports } = useApiQuery('/reports/submissions/');
  const reports = asList(data);
  useRefreshOnFocus(fetchReports);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]} 
      onPress={() => navigation.navigate('ReportDetail', { reportId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
           <MaterialCommunityIcons name="file-document-check-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
            <Text style={[styles.date, { color: colors.text }]}>Report: {item.reference_date}</Text>
            <Text style={[styles.user, { color: colors.textSecondary }]}>Submitted by {item.user_name}</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <View style={styles.cardFooter}>
         <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
         <Text style={[styles.submittedAt, { color: colors.textSecondary }]}> {new Date(item.submitted_at).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                 <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
           </TouchableOpacity>
          <Text style={[styles.header, { color: colors.text }]}>Submitted Reports</Text>
      </View>

      {loading ? (
           <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
          <FlatList
            data={reports}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchReports}
            ListEmptyComponent={
                <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name="folder-open-outline" size={64} color={colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Reports Found</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        Staff reports will appear here once submitted.
                    </Text>
                </View>
            }
          />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
  },
  backButton: { marginRight: 15 },
  header: { fontSize: 28, fontWeight: '800' },
  list: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 15,
    borderRadius: 16,
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
  },
  headerInfo: { flex: 1 },
  date: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  user: { fontSize: 14 },
  divider: { height: 1, width: '100%', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  submittedAt: { fontSize: 12 },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    marginTop: 50,
 },
 emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
 },
 emptyText: {
    textAlign: 'center',
    fontSize: 16,
 }
});

export default ReportListScreen;
