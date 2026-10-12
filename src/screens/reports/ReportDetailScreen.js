import React, { useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApiQuery } from '../../api/queries';
import { ThemeContext } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId } = route.params;
  const { theme } = useContext(ThemeContext);
  const colors = theme.colors;

  const { data: report = null, isLoading: loading, isError } = useApiQuery(`/reports/submissions/${reportId}/`);

  useEffect(() => {
    if (isError && !report) Toast.show({ type: 'error', text1: 'Error loading report' });
  }, [isError, report]);

  const renderAnswer = (answer, index) => {
    let displayValue = 'N/A';
    if (answer.answer_text) displayValue = answer.answer_text;
    else if (answer.answer_number !== null) displayValue = answer.answer_number;
    else if (answer.answer_date) displayValue = answer.answer_date;
    else if (answer.answer_boolean !== null) displayValue = answer.answer_boolean ? 'Yes' : 'No';

    return (
      <View key={index} style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.questionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.questionText, { color: colors.textSecondary }]}>{answer.question_text}</Text>
        </View>
        <Text style={[styles.answerText, { color: colors.text }]}>{displayValue}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
       return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
             <View style={styles.headerContainer}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
                </TouchableOpacity>
            </View>
            <View style={styles.centered}>
                <Text style={{ color: colors.text }}>Report not found.</Text>
            </View>
        </SafeAreaView>
       );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Report Details</Text>
            <Text style={[styles.headerDate, { color: colors.textSecondary }]}>
                {report.reference_date} • {report.user_name}
            </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {report.answers && report.answers.map((ans, index) => renderAnswer(ans, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerDate: { fontSize: 14, marginTop: 4 },
  scroll: { padding: 20 },
  card: {
      padding: 15,
      borderRadius: 12,
      marginBottom: 15,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  questionText: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
  },
  answerText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 42, // Indent to align with text above
  }
});

export default ReportDetailScreen;
