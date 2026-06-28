import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import reportsApi from '../../api/reports';
import Toast from 'react-native-toast-message';

const QuestionManagerScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = theme.colors;
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  
  // Form State
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text');
  
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const result = await reportsApi.getQuestions();
      if (result.ok) {
        setQuestions(result.data.results || result.data);
      }
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Failed to load questions' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!questionText.trim()) {
        Alert.alert('Validation', 'Question text is required');
        return;
    }

    const payload = {
        text: questionText,
        question_type: questionType,
        input_type: 'custom',
        is_required: true,
        sort_order: questions.length + 1
    };

    try {
        if (editingQuestion) {
            await reportsApi.updateQuestion(editingQuestion.id, payload);
            Toast.show({ type: 'success', text1: 'Question Updated' });
        } else {
            await reportsApi.createQuestion(payload);
            Toast.show({ type: 'success', text1: 'Question Added' });
        }
        setModalVisible(false);
        fetchQuestions();
    } catch (error) {
        console.error(error);
        Toast.show({ type: 'error', text1: 'Failed to save question' });
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
        "Delete Question",
        "Are you sure?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: async () => {
                try {
                    await reportsApi.deleteQuestion(id);
                    Toast.show({ type: 'success', text1: 'Question Deleted' });
                    fetchQuestions();
                } catch (error) {
                    Toast.show({ type: 'error', text1: 'Failed to delete' });
                }
            }}
        ]
    );
  };

  const [showDefaults, setShowDefaults] = useState(false);
  
  const DEFAULT_QUESTIONS = [
    { text: "Birds received (new placement)", type: "number" },
    { text: "Mortality (by cause)", type: "text" },
    { text: "Culls", type: "number" },
    { text: "Transfers between houses", type: "text" },
    { text: "Closing stock (auto-calculated)", type: "number" },
    { text: "Stock variance alerts", type: "text" },
    { text: "Feed batch number", type: "text" },
    { text: "Feed issued (kg)", type: "number" },
    { text: "Feed consumed (kg)", type: "number" },
    { text: "Feed wastage", type: "text" },
    { text: "Feed balance (auto)", type: "number" },
    { text: "FCR (Feed Conversion Ratio – auto)", type: "number" },
    { text: "Feed days remaining (forecast)", type: "number" },
    { text: "Water consumption (litres)", type: "number" },
    { text: "Water source", type: "text" },
    { text: "Drinkers condition", type: "text" },
    { text: "Abnormal water intake alerts", type: "text" },
    { text: "Water-to-feed ratio (auto)", type: "number" },
    { text: "Sample bird weight", type: "number" },
    { text: "Average live weight", type: "number" },
    { text: "Uniformity %", type: "number" },
    { text: "Daily weight gain", type: "number" },
    { text: "Expected vs actual growth", type: "text" },
    { text: "House temperature (min/max)", type: "text" },
    { text: "Humidity", type: "number" },
    { text: "Ventilation status", type: "text" },
    { text: "Ammonia smell level", type: "text" },
    { text: "Lighting hours", type: "number" },
    { text: "Litter condition", type: "text" },
    { text: "Heat stress indicators", type: "text" },
    { text: "Environmental threshold alerts", type: "text" },
    { text: "Feeders condition", type: "text" },
    { text: "Fans/heaters status", type: "text" },
    { text: "Generator runtime", type: "text" },
    { text: "Equipment faults reported", type: "text" },
    { text: "Maintenance actions taken", type: "text" },
  ];

  const openModal = (question = null) => {
    if (question) {
        setEditingQuestion(question);
        setQuestionText(question.text);
        setQuestionType(question.question_type);
    } else {
        setEditingQuestion(null);
        setQuestionText('');
        setQuestionType('text');
    }
    setModalVisible(true);
    setShowDefaults(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={styles.cardContent}>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
                <MaterialCommunityIcons 
                    name={item.question_type === 'number' ? 'numeric' : item.question_type === 'date' ? 'calendar' : 'text'} 
                    size={20} 
                    color={colors.primary} 
                />
            </View>
            <Text style={[styles.questionText, { color: colors.text }]}>{item.text}</Text>
        </View>
        <View style={styles.actions}>
            <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
                <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.error || '#FF5252'} />
            </TouchableOpacity>
        </View>
    </View>
  );

  const [selectedDefaults, setSelectedDefaults] = useState([]);

  const toggleSelection = (index) => {
    if (selectedDefaults.includes(index)) {
        setSelectedDefaults(selectedDefaults.filter(i => i !== index));
    } else {
        setSelectedDefaults([...selectedDefaults, index]);
    }
  };

  const handleBatchAdd = async () => {
      setLoading(true);
      try {
          // Process sequentially to maintain order or just Promise.all
          const promises = selectedDefaults.map(index => {
              const def = DEFAULT_QUESTIONS[index];
              return reportsApi.createQuestion({
                  text: def.text,
                  question_type: def.type,
                  input_type: 'custom',
                  is_required: true,
                  sort_order: questions.length + 1 // Sorting might be imperfect with parallel adds but ok for now
              });
          });
          
          await Promise.all(promises);
          Toast.show({ type: 'success', text1: `${selectedDefaults.length} Questions Added` });
          setModalVisible(false);
          setShowDefaults(false);
          setSelectedDefaults([]);
          fetchQuestions();
      } catch (error) {
          console.error(error);
          Toast.show({ type: 'error', text1: 'Failed to add questions' });
      } finally {
          setLoading(false);
      }
  };

  const renderDefaultItem = ({ item, index }) => (
      <TouchableOpacity 
          style={[styles.defaultItem, { borderBottomColor: colors.border }]}
          onPress={() => toggleSelection(index)}
      >
          <MaterialCommunityIcons 
              name={selectedDefaults.includes(index) ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={24} 
              color={colors.primary} 
              style={{ marginRight: 10 }}
          />
          <View style={{flex: 1}}>
            <Text style={[styles.defaultText, { color: colors.text }]}>{item.text}</Text>
            <Text style={[styles.defaultType, { color: colors.textSecondary }]}>{item.type}</Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ... header ... */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
             <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: colors.text }]}>Manage Questions</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* ... list ... */}
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
            data={questions}
            keyExtractor={item => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
                <View style={styles.emptyState}>
                    <Text style={{ color: colors.textSecondary }}>No questions defined.</Text>
                </View>
            }
        />
      )}

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => openModal()}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Main Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                {showDefaults ? (
                    <>
                        <View style={styles.modalHeaderRow}>
                            <TouchableOpacity onPress={() => setShowDefaults(false)}>
                                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: colors.text, marginBottom: 0 }]}>Select from Library</Text>
                            <View style={{width: 24}}/>
                        </View>
                        <FlatList 
                            data={DEFAULT_QUESTIONS}
                            keyExtractor={(item, index) => index.toString()}
                            style={{ maxHeight: 400, marginTop: 10 }}
                            renderItem={renderDefaultItem}
                        />
                        {selectedDefaults.length > 0 && (
                            <TouchableOpacity 
                                onPress={handleBatchAdd} 
                                style={[styles.modalBtn, { backgroundColor: colors.primary, marginTop: 10, alignItems: 'center' }]}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Selected ({selectedDefaults.length})</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingQuestion ? 'Edit Question' : 'New Question'}
                        </Text>
                        
                        {!editingQuestion && (
                            <TouchableOpacity 
                                style={[styles.browseButton, { borderColor: colors.primary }]}
                                onPress={() => setShowDefaults(true)}
                            >
                                <MaterialCommunityIcons name="book-open-variant" size={20} color={colors.primary} />
                                <Text style={[styles.browseButtonText, { color: colors.primary }]}>Browse Default Library</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={[styles.label, { color: colors.text }]}>Question Text</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            value={questionText}
                            onChangeText={setQuestionText}
                            placeholder="e.g., How many eggs collected?"
                            placeholderTextColor={colors.textSecondary}
                        />

                        <Text style={[styles.label, { color: colors.text }]}>Answer Type</Text>
                        <View style={styles.typeSelector}>
                            {['text', 'number', 'date'].map(type => (
                                <TouchableOpacity 
                                    key={type}
                                    style={[
                                        styles.typeOption, 
                                        { borderColor: colors.border },
                                        questionType === type && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setQuestionType(type)}
                                >
                                    <Text style={[
                                        styles.typeText, 
                                        { color: questionType === type ? '#fff' : colors.text }
                                    ]}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalBtn}>
                                <Text style={{ color: colors.textSecondary }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave} style={[styles.modalBtn, { backgroundColor: colors.primary }]}>
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </KeyboardAvoidingView>
      </Modal>
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
      justifyContent: 'space-between'
  },
  header: { fontSize: 24, fontWeight: 'bold' },
  backButton: { marginRight: 10 },
  addButton: { padding: 5 },
  list: { padding: 20, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  typeBadge: {
      padding: 8,
      borderRadius: 8,
      marginRight: 10,
  },
  questionText: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  actions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 5 },

  emptyState: { alignItems: 'center', marginTop: 50 },
  
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    // Note: colors is not in scope here for StyleSheet, but we used inline styles for ThemeContext usually.
    // However, since we need dynamic theme color, we should move this to inline style or use Context in functional component.
    // But since this is a quick fix, I will edit the component to style it inline or pass colors.
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20
  },
  modalContent: {
      borderRadius: 16,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 16, marginBottom: 5, fontWeight: '500' },
  input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 20,
      fontSize: 16
  },
  typeSelector: { flexDirection: 'row', marginBottom: 30, gap: 10 },
  typeOption: {
      flex: 1,
      padding: 10,
      borderWidth: 1,
      borderRadius: 8,
      alignItems: 'center'
  },
  typeText: { fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  modalBtn: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
  },
  browseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 20,
      borderStyle: 'dashed'
  },
  browseButtonText: {
      fontWeight: '600',
      marginLeft: 8
  },
  modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10
  },
  defaultItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  defaultText: { fontSize: 16, fontWeight: '500', flex: 1 },
  defaultType: { fontSize: 12, marginLeft: 10, fontStyle: 'italic' }
});

export default QuestionManagerScreen;
