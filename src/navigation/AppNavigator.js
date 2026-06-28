import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import FlockListScreen from '../screens/FlockListScreen';
import AddFlockScreen from '../screens/AddFlockScreen';
import FlockDetailScreen from '../screens/FlockDetailScreen';
import FinancesScreen from '../screens/FinancesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AddFeedLogScreen from '../screens/AddFeedLogScreen';
import AddHealthLogScreen from '../screens/AddHealthLogScreen';
import AddEggCollectionScreen from '../screens/AddEggCollectionScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import DailyReportFormScreen from '../screens/reports/DailyReportFormScreen';
import ReportSettingsScreen from '../screens/reports/ReportSettingsScreen';
import QuestionManagerScreen from '../screens/reports/QuestionManagerScreen';
import ReportListScreen from '../screens/reports/ReportListScreen';
import ReportDetailScreen from '../screens/reports/ReportDetailScreen';
import ReportsScreen from '../screens/reports/ReportsScreen';

import UserListScreen from '../screens/UserListScreen';
import AddUserScreen from '../screens/AddUserScreen';
import EditUserScreen from '../screens/EditUserScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import CreateFarmSignupScreen from '../screens/CreateFarmSignupScreen';
import JoinFarmSignupScreen from '../screens/JoinFarmSignupScreen';
import CreateFarmScreen from '../screens/CreateFarmScreen';
import JoinFarmScreen from '../screens/JoinFarmScreen';
import FarmOnboardingScreen from '../screens/FarmOnboardingScreen';
import ReminderScreen from '../screens/ReminderScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PasswordResetConfirmScreen from '../screens/PasswordResetConfirmScreen';
import TransferOwnershipScreen from '../screens/TransferOwnershipScreen';
import CloseCycleScreen from '../screens/CloseCycleScreen';
import CycleComparisonScreen from '../screens/CycleComparisonScreen';
import AllTransactionsScreen from '../screens/AllTransactionsScreen';
import FarmProfileScreen from '../screens/FarmProfileScreen';
import SalesInvoiceScreen from '../screens/SalesInvoiceScreen';
import InvoiceListScreen from '../screens/InvoiceListScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoading, userToken, userInfo } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken == null ? (
          <Stack.Group>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="CreateFarmSignup" component={CreateFarmSignupScreen} />
            <Stack.Screen name="JoinFarmSignup" component={JoinFarmSignupScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="PasswordResetConfirm" component={PasswordResetConfirmScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            {!userInfo?.farm ? (
              <>
                {/* Fallback for legacy users or incomplete states */}
                <Stack.Screen name="FarmOnboarding" component={FarmOnboardingScreen} />
                <Stack.Screen name="CreateFarm" component={CreateFarmScreen} />
                <Stack.Screen name="JoinFarm" component={JoinFarmScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Dashboard" component={DashboardScreen} />
                <Stack.Screen name="FlockList" component={FlockListScreen} />
                <Stack.Screen name="AddFlock" component={AddFlockScreen} />
                <Stack.Screen name="FlockDetail" component={FlockDetailScreen} />
                <Stack.Screen name="Finances" component={FinancesScreen} />
                <Stack.Screen name="AddFeedLog" component={AddFeedLogScreen} />
                <Stack.Screen name="AddHealthLog" component={AddHealthLogScreen} />
                <Stack.Screen name="AddEggCollection" component={AddEggCollectionScreen} />
                <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} />
                <Stack.Screen name="UserList" component={UserListScreen} />
                <Stack.Screen name="AddUser" component={AddUserScreen} />
                <Stack.Screen name="EditUser" component={EditUserScreen} />
                <Stack.Screen name="Reminders" component={ReminderScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="TransferOwnership" component={TransferOwnershipScreen} />
                <Stack.Screen name="CloseCycle" component={CloseCycleScreen} />
                <Stack.Screen name="CycleComparison" component={CycleComparisonScreen} />
                <Stack.Screen name="FarmProfile" component={FarmProfileScreen} />
                <Stack.Screen name="SalesInvoice" component={SalesInvoiceScreen} />
                <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
                <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
                <Stack.Screen name="DailyReportForm" component={DailyReportFormScreen} />
                <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ReportSettings" component={ReportSettingsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="QuestionManager" component={QuestionManagerScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ReportList" component={ReportListScreen} options={{ headerShown: false }} />
                <Stack.Screen name="ReportDetail" component={ReportDetailScreen} options={{ headerShown: false }} />
              </>
            )}
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
