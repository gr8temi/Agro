import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator, Modal, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSubmitEntry } from '../../context/OutboxContext';
import { toLocalDateString } from '../../utils/date';
import { useReportConfig } from '../../api/queries';
import { ThemeContext } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { TourGuideZone } from 'rn-tourguide';
import { useScreenTour } from '../../hooks/useScreenTour';

const DailyReportFormScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = theme.colors;
  
  useScreenTour('DailyReportTour');
  
  const { data: config = null, isLoading: loading, isError, fetchStatus } = useReportConfig();
  const offlineWithoutConfig = fetchStatus === 'paused' && !config;
  const [answers, setAnswers] = useState({});
  const submitEntry = useSubmitEntry('dailyReport', 'Submission Failed');
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(null);

  useEffect(() => {
    if (isError && !config) {
      Toast.show({ type: 'error', text1: 'Error fetching config' });
    }
  }, [isError, config]);

  const handleInputChange = (questionId, value, type) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer_text: type === 'text' ? value : undefined,
        answer_number: type === 'number' ? value : undefined,
        answer_date: type === 'date' ? value : undefined,
        value: value 
      }
    }));
  };

  const handleSubmit = async () => {
    if (!config) return;
    setSubmitting(true);
    
    const payload = {
        reference_date: toLocalDateString(),
        answers: Object.values(answers).map(a => ({
            question_id: a.question_id,
            answer_text: a.answer_text,
            answer_number: a.answer_number,
            answer_date: a.answer_date
        }))
    };

    const result = await submitEntry(payload);
    setSubmitting(false);
    if (result) {
        if (!result.queued) Toast.show({ type: 'success', text1: 'Report Submitted!' });
        navigation.goBack();
    }
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id] || {};
    
    return (
      <View key={question.id} style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.questionHeader}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons 
                    name={question.question_type === 'number' ? 'numeric' : question.question_type === 'date' ? 'calendar' : 'text'} 
                    size={24} 
                    color={colors.primary} 
                />
            </View>
            <Text style={[styles.questionLabel, { color: colors.text }]}>{question.text}</Text>
        </View>
        
        {question.question_type === 'text' && (
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Type your answer here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                onChangeText={(text) => handleInputChange(question.id, text, 'text')}
                value={answer.answer_text}
            />
        )}
        
        {question.question_type === 'number' && (
            <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                onChangeText={(text) => handleInputChange(question.id, text, 'number')}
                value={answer.answer_number ? String(answer.answer_number) : ''}
            />
        )}

        {question.question_type === 'date' && (
             <View>
                <TouchableOpacity 
                    onPress={() => setShowDatePicker(question.id)} 
                    style={[styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                >
                    <Text style={{ color: answer.answer_date ? colors.text : colors.textSecondary, fontSize: 16 }}>
                        {answer.answer_date ? answer.answer_date : 'Select Date'}
                    </Text>
                    <MaterialCommunityIcons name="calendar-month" size={24} color={colors.primary} />
                </TouchableOpacity>
                
                {showDatePicker === question.id && (
                    Platform.OS === 'ios' ? (
                        <Modal visible={true} transparent={true} animationType="slide">
                            <View style={styles.iosModalOverlay}>
                                <View style={[styles.iosDatePickerContainer, { backgroundColor: colors.surface }]}>
                                    <View style={styles.iosHeader}>
                                        <TouchableOpacity onPress={() => setShowDatePicker(null)}>
                                            <Text style={[styles.iosDoneText, { color: colors.primary }]}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <DateTimePicker
                                        value={answer.answer_date ? new Date(answer.answer_date) : new Date()}
                                        mode="date"
                                        display="spinner"
                                        textColor={colors.text}
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) {
                                                const dateString = toLocalDateString(selectedDate);
                                                handleInputChange(question.id, dateString, 'date');
                                            }
                                        }}
                                    />
                                </View>
                            </View>
                        </Modal>
                    ) : (
                        <DateTimePicker
                            value={answer.answer_date ? new Date(answer.answer_date) : new Date()}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                setShowDatePicker(null);
                                if (selectedDate) {
                                    const dateString = toLocalDateString(selectedDate);
                                    handleInputChange(question.id, dateString, 'date');
                                }
                            }}
                        />
                    )
                )}
             </View>
        )}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Daily Report</Text>
            <Text style={[styles.headerDate, { color: colors.textSecondary }]}>{new Date().toDateString()}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {!config ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name={offlineWithoutConfig ? 'cloud-off-outline' : 'clipboard-text-off-outline'} size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                    {offlineWithoutConfig ? "You're Offline" : 'No Report Configured'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {offlineWithoutConfig
                        ? 'The report questions will load when you reconnect.'
                        : "There are no questions configured for today's report. Please contact your manager."}
                </Text>
            </View>
        ) : (
            <>
                {config.questions.map(q => renderQuestion(q))}

                <TourGuideZone
                    zone={1}
                    text="Submit your daily report once all questions are answered."
                    borderRadius={16}
                >
                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    <LinearGradient
                        colors={[colors.primary, '#4c669f']} // Basic gradient example, adjust if needed
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitButton}
                    >
                        {submitting ? (
                             <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Submit Report</Text>
                                <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginLeft: 10 }} />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
                </TourGuideZone>
            </>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
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
  },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 28, fontWeight: '800' },
  headerDate: { fontSize: 16, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 50 },
  
  card: {
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
  },
  questionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
  },
  iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
  },
  questionLabel: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
  },
  input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
  },
  dateInput: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 12,
      padding: 15,
  },
  submitButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 18,
      borderRadius: 16,
      marginTop: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
  },
  submitButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
  },
  emptyState: {
      alignItems: 'center',
      padding: 40,
      borderRadius: 20,
      marginTop: 50,
  },
  emptyTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 10,
  },
  emptyText: {
      textAlign: 'center',
      fontSize: 16,
      lineHeight: 24,
  },
  // iOS DatePicker Styles
  iosModalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
  },
  iosDatePickerContainer: {
      paddingBottom: 20,
      paddingTop: 10,
  },
  iosHeader: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 15,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  iosDoneText: {
      fontSize: 18,
      fontWeight: 'bold',
  }
});

export default DailyReportFormScreen;
