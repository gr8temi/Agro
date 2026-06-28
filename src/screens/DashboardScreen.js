import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TourGuideZone, useTourGuideController } from 'rn-tourguide';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api/client';
import CurrencyPicker from '../components/CurrencyPicker';
import { getCurrencySymbol } from '../utils/currency';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16; // padding on each side
const CARD_GAP = 12; // gap between cards
const CARD_WIDTH = (width - (GRID_PADDING * 2) - CARD_GAP) / 2;

const DashboardScreen = ({ navigation }) => {
  const { logout, userInfo, displayCurrency, setDisplayCurrency, supportedCurrencies } = useContext(AuthContext);
  const [activeFlockCount, setActiveFlockCount] = useState(null);
  const [currencyPickerVisible, setCurrencyPickerVisible] = useState(false);

  const { canStart, start, stop, eventEmitter } = useTourGuideController();

  useEffect(() => {
    const checkTour = async () => {
      try {
        const hasSeenTour = await AsyncStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
           // Small delay to ensure layout is ready
           setTimeout(() => {
             if (canStart) {
               start();
             }
           }, 1000);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    checkTour();
  }, [canStart]); // Add canStart dependency

  useEffect(() => {
     const handleStop = async () => {
       await AsyncStorage.setItem('hasSeenTour', 'true');
     };

     if (eventEmitter) {
       eventEmitter.on('stop', handleStop);
     }
     return () => {
       if (eventEmitter) {
         eventEmitter.off('stop', handleStop);
       }
     };
  }, [eventEmitter]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      client.get('/flocks/?status=active')
        .then(res => setActiveFlockCount(Array.isArray(res.data) ? res.data.length : 0))
        .catch(() => {});
    });
    return unsubscribe;
  }, [navigation]);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const MenuCard = ({ title, subtitle, icon, onPress, color }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle != null && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setCurrencyPickerVisible(true)}
            style={styles.currencyPill}
          >
            <Text style={styles.currencyPillText}>{getCurrencySymbol(displayCurrency)} {displayCurrency}</Text>
            <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.headerIcon}>
            <MaterialCommunityIcons name="cog" size={26} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.headerIcon}>
            <MaterialCommunityIcons name="logout" size={26} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.usernameText}>{userInfo?.username}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{userInfo?.role?.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.gridContainer}>
          {(userInfo?.role === 'superuser' || userInfo?.permissions?.can_manage_flocks || userInfo?.role === 'staff') && (
            <TourGuideZone
              zone={1}
              text="Manage your flock cycles here. Track batches, monitor performance, and view cycle history."
              borderRadius={10}
            >
              <MenuCard
                title="Flock Cycles"
                subtitle={activeFlockCount != null ? `${activeFlockCount} active` : undefined}
                icon="bird"
                onPress={() => navigation.navigate('FlockList')}
                color={theme.colors.primary}
              />
            </TourGuideZone>
          )}
          
          {(userInfo?.role === 'superuser' || userInfo?.permissions?.can_manage_finances) && (
            <TourGuideZone
              zone={2}
              text="Track your income and expenses to stay on top of your farm's finances."
              borderRadius={10}
            >
              <MenuCard 
                title="Finances" 
                icon="cash-multiple" 
                onPress={() => navigation.navigate('Finances')} 
                color="#4CAF50" 
              />
            </TourGuideZone>
          )}

          {(userInfo?.role === 'superuser' || userInfo?.permissions?.can_manage_users) && (
            <TourGuideZone
              zone={3}
              text="Manage farm users and their permissions."
              borderRadius={10}
            >
              <MenuCard 
                title="Manage Users" 
                icon="account-group" 
                onPress={() => navigation.navigate('UserList')} 
                color="#2196F3" 
              />
            </TourGuideZone>
          )}

          <TourGuideZone
            zone={4}
            text="Set reminders for feeding, medication, and other tasks."
            borderRadius={10}
          >
            <MenuCard 
              title="Reminders" 
              icon="bell-ring" 
              onPress={() => navigation.navigate('Reminders')} 
              color={theme.colors.secondary} 
            />
          </TourGuideZone>

          <TourGuideZone
            zone={5}
            text="Submit daily reports, view submissions and configure report settings."
            borderRadius={10}
          >
            <MenuCard 
              title="Reports" 
              icon="file-chart-outline" 
              onPress={() => navigation.navigate('Reports')} 
              color="#FF9800"
            />
          </TourGuideZone>
        </View>
      </ScrollView>

      <CurrencyPicker
        visible={currencyPickerVisible}
        onClose={() => setCurrencyPickerVisible(false)}
        onSelect={(code) => {
          setDisplayCurrency(code);
          Toast.show({
            type: 'success',
            text1: 'Currency Changed',
            text2: `Amounts will now display in ${code} (${getCurrencySymbol(code)})`,
            position: 'top',
          });
        }}
        selectedCurrency={displayCurrency}
        currencies={supportedCurrencies}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: theme.spacing.m,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  currencyPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scrollContent: {
    padding: GRID_PADDING,
  },
  welcomeSection: {
    marginBottom: theme.spacing.xl,
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  usernameText: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    marginBottom: theme.spacing.s,
  },
  roleBadge: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s / 2,
    borderRadius: theme.borderRadius.l,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: CARD_GAP,
    rowGap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    padding: theme.spacing.m,
    paddingVertical: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    padding: theme.spacing.s,
    borderRadius: 50,
    marginBottom: theme.spacing.s,
  },
  cardTitle: {
    ...theme.typography.button,
    color: theme.colors.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export default DashboardScreen;
