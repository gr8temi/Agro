import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Modal, TextInput, FlatList, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { MaterialCommunityIcons } from '@expo/vector-icons';
import reportsApi from '../../api/reports';
import { ThemeContext } from '../../context/ThemeContext';
import Toast from 'react-native-toast-message';

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

const ReportSettingsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const colors = theme.colors;
  
  // Config State
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [deadline, setDeadline] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Questions State
  const [localQuestions, setLocalQuestions] = useState([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // Index in localQuestions array
  
  // Form State
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text');
  
  // Multi-select for defaults
  const [selectedDefaults, setSelectedDefaults] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 1. Fetch Config
      const resultConfig = await reportsApi.getConfig();
      let cfg = null;
      if ((resultConfig.status === 200 || resultConfig.status === 201) && resultConfig.data.length > 0) {
        cfg = resultConfig.data[0];
      } else if (resultConfig.data.results && resultConfig.data.results.length > 0) {
        cfg = resultConfig.data.results[0];
      }
      
      if (cfg) {
        setConfig(cfg);
        setIsEnabled(cfg.is_enabled);
        if (cfg.deadline_time) {
            const [h, m] = cfg.deadline_time.split(':');
            const d = new Date();
            d.setHours(parseInt(h));
            d.setMinutes(parseInt(m));
            setDeadline(d);
        }
      }

      // 2. Fetch Questions
      const resultQuestions = await reportsApi.getQuestions();
      if (resultQuestions.status === 200) {
        setLocalQuestions(resultQuestions.data.results || resultQuestions.data);
      }
      
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    const timeStr = deadline.toTimeString().split(' ')[0]; // HH:MM:SS
    const configPayload = {
        is_enabled: isEnabled,
        deadline_time: timeStr
    };
    
    try {
        // 1. Save Config
        let currentConfig = config;
        if (currentConfig) {
            await reportsApi.updateConfig(currentConfig.id, configPayload);
        } else {
            const result = await reportsApi.createConfig(configPayload);
            if (result.status === 201 || result.status === 200) {
                currentConfig = result.data;
                setConfig(result.data);
            }
        }

        // 2. Delete Removed Questions
        await Promise.all(deletedQuestionIds.map(id => reportsApi.deleteQuestion(id)));

        // 3. Save Questions (Create or Update)
        // We process them sequentially or parallel. Parallel is faster.
        const questionPromises = localQuestions.map((q, index) => {
            const payload = {
                text: q.text,
                question_type: q.question_type || q.type, // Handle both key names if mixed
                input_type: 'custom',
                is_required: true,
                sort_order: index + 1
            };

            if (q.id) {
                // Update existing
                return reportsApi.updateQuestion(q.id, payload);
            } else {
                // Create new
                return reportsApi.createQuestion(payload);
            }
        });

        await Promise.all(questionPromises);

        Toast.show({ type: 'success', text1: 'Settings & Questions Saved' });
        
        // Refresh data to get new IDs
        setDeletedQuestionIds([]);
        fetchData();
        
    } catch (error) {
        console.error(error);
        Toast.show({ type: 'error', text1: 'Failed to save settings' });
        setLoading(false);
    }
  };

  // --- Modal Logic ---

  const openModal = (index = null) => {
      if (index !== null) {
          const q = localQuestions[index];
          setEditingIndex(index);
          setQuestionText(q.text);
          setQuestionType(q.question_type || q.type);
      } else {
          setEditingIndex(null);
          setQuestionText('');
          setQuestionType('text');
      }
      setShowDefaults(false);
      setModalVisible(true);
  };

  const addToLocal = (text, type) => {
      const newQ = { 
          text, 
          question_type: type, 
          input_type: 'custom', 
          is_required: true 
          // No ID yet
      };
      
      if (editingIndex !== null) {
          const updated = [...localQuestions];
          updated[editingIndex] = { ...updated[editingIndex], ...newQ };
          setLocalQuestions(updated);
      } else {
          setLocalQuestions([...localQuestions, newQ]);
      }
      setModalVisible(false);
  };

  const deleteLocal = (index) => {
      const q = localQuestions[index];
      if (q.id) {
          setDeletedQuestionIds([...deletedQuestionIds, q.id]);
      }
      const updated = [...localQuestions];
      updated.splice(index, 1);
      setLocalQuestions(updated);
  };

  const toggleDefaultSelection = (index) => {
    if (selectedDefaults.includes(index)) {
        setSelectedDefaults(selectedDefaults.filter(i => i !== index));
    } else {
        setSelectedDefaults([...selectedDefaults, index]);
    }
  };

  const batchAddDefaults = () => {
      const newQuestions = selectedDefaults.map(idx => ({
          text: DEFAULT_QUESTIONS[idx].text,
          question_type: DEFAULT_QUESTIONS[idx].type,
          input_type: 'custom',
          is_required: true
      }));
      setLocalQuestions([...localQuestions, ...newQuestions]);
      setSelectedDefaults([]);
      setShowDefaults(false);
      setModalVisible(false);
  };


  if (loading && !config) return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.header, { color: colors.text }]}>Report Settings</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.text }]}>Enable Daily Reporting</Text>
                <Switch 
                    value={isEnabled} 
                    onValueChange={setIsEnabled} 
                    trackColor={{ false: colors.disabled, true: colors.primary }}
                    thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                />
            </View>

            {isEnabled && (
                <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Daily Deadline</Text>
                    <TouchableOpacity 
                        onPress={() => setShowTimePicker(true)}
                        style={[styles.timeButton, { backgroundColor: colors.background }]}
                    >
                        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primary} style={{marginRight: 8}}/>
                        <Text style={[styles.value, { color: colors.text }]}>
                            {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </TouchableOpacity>
                    {showTimePicker && (
                        Platform.OS === 'ios' ? (
                            <Modal visible={true} transparent={true} animationType="slide">
                                <View style={styles.iosModalOverlay}>
                                    <View style={[styles.iosDatePickerContainer, { backgroundColor: colors.surface }]}>
                                        <View style={styles.iosHeader}>
                                            <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                                                <Text style={[styles.iosDoneText, { color: colors.primary }]}>Done</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <DateTimePicker
                                            value={deadline}
                                            mode="time"
                                            display="spinner"
                                            textColor={colors.text}
                                            onChange={(event, selectedDate) => {
                                                if (selectedDate) setDeadline(selectedDate);
                                            }}
                                        />
                                    </View>
                                </View>
                            </Modal>
                        ) : (
                            <DateTimePicker
                                value={deadline}
                                mode="time"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowTimePicker(false);
                                    if (selectedDate) setDeadline(selectedDate);
                                }}
                            />
                        )
                    )}
                </View>
            )}
        </View>

        <View style={styles.questionsHeader}>
            <Text style={[styles.subHeader, { color: colors.text }]}>Daily Questions</Text>
            <TouchableOpacity onPress={() => openModal()} style={styles.addButton}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Add</Text>
            </TouchableOpacity>
        </View>

        {localQuestions.map((item, index) => (
            <View key={index} style={[styles.questionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                    <MaterialCommunityIcons 
                        name={(item.question_type || item.type) === 'number' ? 'numeric' : (item.question_type || item.type) === 'date' ? 'calendar' : 'text'} 
                        size={20} 
                        color={colors.primary} 
                        style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.questionText, { color: colors.text }]}>{item.text}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => openModal(index)} style={styles.actionButton}>
                        <MaterialCommunityIcons name="pencil" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteLocal(index)} style={styles.actionButton}>
                        <MaterialCommunityIcons name="close" size={20} color={colors.error || '#FF5252'} />
                    </TouchableOpacity>
                </View>
            </View>
        ))}

        {localQuestions.length === 0 && (
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>No questions added yet.</Text>
        )}

        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* Floating Save Button */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveAll}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Settings</Text>}
          </TouchableOpacity>
      </View>

      {/* Modal */}
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
                            renderItem={({ item, index }) => (
                                <TouchableOpacity 
                                    style={[styles.defaultItem, { borderBottomColor: colors.border }]}
                                    onPress={() => toggleDefaultSelection(index)}
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
                            )}
                        />
                        <TouchableOpacity 
                            onPress={batchAddDefaults} 
                            style={[styles.modalBtn, { backgroundColor: colors.primary, marginTop: 10, alignItems: 'center' }]}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add Selected ({selectedDefaults.length})</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            {editingIndex !== null ? 'Edit Question' : 'New Question'}
                        </Text>
                        
                        {editingIndex === null && (
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
                            <TouchableOpacity 
                                onPress={() => addToLocal(questionText, questionType)} 
                                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{editingIndex !== null ? 'Update' : 'Add'}</Text>
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
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  subHeader: { fontSize: 20, fontWeight: 'bold' },
  questionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 15 },
  addButton: { flexDirection: 'row', alignItems: 'center' },
  
  card: { padding: 15, borderRadius: 12, marginBottom: 10 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
  },
  label: { fontSize: 16 },
  value: { fontSize: 16, fontWeight: 'bold' },
  
  questionCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 15,
      borderRadius: 12,
      marginBottom: 10,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  questionText: { fontSize: 16, fontWeight: '500', flexShrink: 1 },
  actions: { flexDirection: 'row' },
  actionButton: { padding: 5, marginLeft: 10 },

  footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      borderTopWidth: 1,
  },
  saveButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  // Modal Styles
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 20
  },
  modalContent: {
      borderRadius: 16,
      padding: 20,
      maxHeight: '80%',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  // ... reuse other modal styles
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
      alignItems: 'center'
  },
  defaultText: { fontSize: 16, fontWeight: '500', flex: 1 },
  defaultType: { fontSize: 12, marginLeft: 10, fontStyle: 'italic' },
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

export default ReportSettingsScreen;
