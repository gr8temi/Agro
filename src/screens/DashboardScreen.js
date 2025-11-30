import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16; // padding on each side
const CARD_GAP = 12; // gap between cards
const CARD_WIDTH = (width - (GRID_PADDING * 2) - CARD_GAP) / 2;

const DashboardScreen = ({ navigation }) => {
  const { logout, userInfo } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = getStyles(theme);

  const MenuCard = ({ title, icon, onPress, color }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme.colors.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerRight}>
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
            <MenuCard 
              title="Flocks" 
              icon="bird" 
              onPress={() => navigation.navigate('FlockList')} 
              color={theme.colors.primary} 
            />
          )}
          
          {(userInfo?.role === 'superuser' || userInfo?.permissions?.can_manage_finances) && (
            <MenuCard 
              title="Finances" 
              icon="cash-multiple" 
              onPress={() => navigation.navigate('Finances')} 
              color="#4CAF50" 
            />
          )}

          {(userInfo?.role === 'superuser' || userInfo?.permissions?.can_manage_users) && (
            <MenuCard 
              title="Manage Users" 
              icon="account-group" 
              onPress={() => navigation.navigate('UserList')} 
              color="#2196F3" 
            />
          )}

          <MenuCard 
            title="Reminders" 
            icon="bell-ring" 
            onPress={() => navigation.navigate('Reminders')} 
            color={theme.colors.secondary} 
          />
        </View>
      </ScrollView>
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
});

export default DashboardScreen;
