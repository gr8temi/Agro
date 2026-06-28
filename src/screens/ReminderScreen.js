import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

const STORAGE_KEY = 'cluckops_reminders';

const DEFAULT_REMINDERS = [
  { id: '1', title: 'Morning Feeding', hour: 7, minute: 0, enabled: false },
  { id: '2', title: 'Water Check', hour: 12, minute: 0, enabled: false },
  { id: '3', title: 'Evening Feeding', hour: 17, minute: 0, enabled: false },
  { id: '4', title: 'Egg Collection', hour: 10, minute: 0, enabled: false },
];

const reminderToDate = (reminder) => {
  const d = new Date();
  d.setHours(reminder.hour, reminder.minute, 0, 0);
  return d;
};

const ReminderScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState(DEFAULT_REMINDERS);
  const [loaded, setLoaded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState(null);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setReminders(JSON.parse(stored));
        }
      } catch {
        // Fall back to defaults
      }
      setLoaded(true);
    };
    load();
    requestPermissions();
  }, []);

  const persist = useCallback(async (updated) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Non-critical
    }
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Please enable notifications to use reminders.',
      });
    }
  };

  const scheduleNotification = async (reminder) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
    } catch {
      // May not exist yet
    }

    if (!reminder.enabled) return;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: 'Farm Reminder',
          body: `It's time for ${reminder.title}!`,
          sound: true,
        },
        trigger: {
          hour: reminder.hour,
          minute: reminder.minute,
          repeats: true,
        },
      });
    } catch (error) {
      // Scheduling failed — non-critical
    }
  };

  const toggleSwitch = async (id) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, enabled: !r.enabled };
      }
      return r;
    });
    setReminders(updated);
    await persist(updated);

    const toggled = updated.find((r) => r.id === id);
    if (toggled) {
      await scheduleNotification(toggled);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (!selectedDate || !selectedReminderId) return;
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }

    const updated = reminders.map((r) => {
      if (r.id === selectedReminderId) {
        const newReminder = {
          ...r,
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        };
        if (newReminder.enabled) {
          scheduleNotification(newReminder);
        }
        return newReminder;
      }
      return r;
    });
    setReminders(updated);
    persist(updated);

    if (Platform.OS === 'android') {
      setSelectedReminderId(null);
    }
  };

  const handleIOSDone = () => {
    setShowPicker(false);
    setSelectedReminderId(null);
  };

  const showTimePicker = (id) => {
    setSelectedReminderId(id);
    setShowPicker(true);
  };

  const getPickerDate = () => {
    const selected = reminders.find((r) => r.id === selectedReminderId);
    return selected ? reminderToDate(selected) : new Date();
  };

  if (!loaded) return null;

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => showTimePicker(item.id)}>
            <Text style={styles.time}>
              {reminderToDate(item).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Switch
        trackColor={{ false: '#767577', true: theme.colors.primary }}
        thumbColor={item.enabled ? theme.colors.secondary : '#f4f3f4'}
        onValueChange={() => toggleSwitch(item.id)}
        value={item.enabled}
      />
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <CustomHeader title="Reminders" navigation={navigation} showBack={true} />
      <View style={styles.container}>
        <FlatList
          data={reminders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />

        {showPicker &&
          (Platform.OS === 'ios' ? (
            <Modal visible={true} transparent={true} animationType="slide">
              <View style={styles.iosModalOverlay}>
                <View style={[styles.iosDatePickerContainer, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.iosHeader}>
                    <TouchableOpacity onPress={handleIOSDone}>
                      <Text style={[styles.iosDoneText, { color: theme.colors.primary }]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={getPickerDate()}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    textColor={theme.colors.text}
                    onChange={onTimeChange}
                  />
                </View>
              </View>
            </Modal>
          ) : (
            <DateTimePicker
              value={getPickerDate()}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={onTimeChange}
            />
          ))}
      </View>
    </View>
  );
};

const getStyles = (theme) =>
  StyleSheet.create({
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
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    cardContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${theme.colors.primary}15`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.m,
    },
    textContainer: {
      justifyContent: 'center',
    },
    title: {
      ...theme.typography.body,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    time: {
      ...theme.typography.h3,
      color: theme.colors.primary,
      fontWeight: 'bold',
    },
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
    },
  });

export default ReminderScreen;
