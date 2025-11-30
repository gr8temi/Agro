import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useTheme } from '../context/ThemeContext';
import CustomHeader from '../components/CustomHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ReminderScreen = ({ navigation }) => {
  const [reminders, setReminders] = useState([
    { id: '1', title: 'Morning Feeding', time: new Date(new Date().setHours(7, 0, 0, 0)), enabled: false },
    { id: '2', title: 'Water Check', time: new Date(new Date().setHours(12, 0, 0, 0)), enabled: false },
    { id: '3', title: 'Evening Feeding', time: new Date(new Date().setHours(17, 0, 0, 0)), enabled: false },
    { id: '4', title: 'Egg Collection', time: new Date(new Date().setHours(10, 0, 0, 0)), enabled: false },
  ]);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedReminderId, setSelectedReminderId] = useState(null);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  useEffect(() => {
    requestPermissions();
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
    if (!reminder.enabled) {
      await Notifications.cancelScheduledNotificationAsync(reminder.id);
      return;
    }

    const trigger = {
      hour: reminder.time.getHours(),
      minute: reminder.time.getMinutes(),
      repeats: true,
    };

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: reminder.id,
        content: {
          title: "Farm Reminder",
          body: `It's time for ${reminder.title}!`,
          sound: true,
        },
        trigger,
      });
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  const toggleSwitch = async (id) => {
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === id) {
        const newEnabled = !reminder.enabled;
        const updatedReminder = { ...reminder, enabled: newEnabled };
        scheduleNotification(updatedReminder);
        return updatedReminder;
      }
      return reminder;
    });
    setReminders(updatedReminders);
  };

  const onTimeChange = (event, selectedDate) => {
    setShowPicker(false);
    if (selectedDate && selectedReminderId) {
      const updatedReminders = reminders.map(reminder => {
        if (reminder.id === selectedReminderId) {
          const updatedReminder = { ...reminder, time: selectedDate };
          if (updatedReminder.enabled) {
            scheduleNotification(updatedReminder);
          }
          return updatedReminder;
        }
        return reminder;
      });
      setReminders(updatedReminders);
      setSelectedReminderId(null);
    }
  };

  const showTimePicker = (id) => {
    setSelectedReminderId(id);
    setShowPicker(true);
  };

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
              {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Switch
        trackColor={{ false: "#767577", true: theme.colors.primary }}
        thumbColor={item.enabled ? theme.colors.secondary : "#f4f3f4"}
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
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
        
        {showPicker && (
          <DateTimePicker
            value={new Date()}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={onTimeChange}
          />
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
});

export default ReminderScreen;
