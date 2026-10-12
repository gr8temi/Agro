import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRequireOnline } from '../../context/NetworkContext';

const ReportsScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const { theme } = useTheme();
  const colors = theme.colors;
  const requireOnline = useRequireOnline();

  const isAdmin =
    userInfo?.role === 'superuser' ||
    userInfo?.role === 'manager' ||
    userInfo?.role === 'admin';

  const ActionCard = ({ title, subtitle, icon, color, onPress }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={30} color={color} />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Submit */}
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SUBMIT</Text>
        <ActionCard
          title="Daily Report"
          subtitle="Record today's farm activity"
          icon="file-document-edit"
          color="#FF9800"
          onPress={() => navigation.navigate('DailyReportForm')}
        />

        {/* Manage — admin only */}
        {isAdmin && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 24 }]}>
              MANAGE
            </Text>
            <ActionCard
              title="View Submissions"
              subtitle="Browse all submitted reports"
              icon="file-document-multiple-outline"
              color="#00BCD4"
              onPress={() => navigation.navigate('ReportList')}
            />
            <ActionCard
              title="Report Config"
              subtitle="Enable reporting & manage questions"
              icon="cog-outline"
              color="#9C27B0"
              onPress={() => requireOnline('Changing report settings') && navigation.navigate('ReportSettings')}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardSubtitle: { fontSize: 13 },
});

export default ReportsScreen;
