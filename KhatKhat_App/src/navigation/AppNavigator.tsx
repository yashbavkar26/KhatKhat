import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';

// Customer Screens
import { CustomerHomeScreen } from '../screens/customer/HomeScreen';
import { TrackingScreen } from '../screens/customer/TrackingScreen';
import { OrdersScreen as CustomerOrdersScreen } from '../screens/customer/OrdersScreen';
import { WalletScreen as CustomerWalletScreen } from '../screens/customer/WalletScreen';
import { ProfileScreen as CustomerProfileScreen } from '../screens/customer/ProfileScreen';

// Carrier Screens
import { JobsScreen as CarrierJobsScreen } from '../screens/carrier/JobsScreen';
import { ActiveDeliveryScreen as CarrierActiveScreen } from '../screens/carrier/ActiveDeliveryScreen';
import { EarningsScreen as CarrierEarningsScreen } from '../screens/carrier/EarningsScreen';
import { TrustScreen as CarrierTrustScreen } from '../screens/carrier/TrustScreen';
import { CarrierProfileScreen } from '../screens/carrier/ProfileScreen';

import { Home, Map, ClipboardList, Wallet, User, Briefcase, TrendingUp, ShieldCheck, Zap } from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
    </Stack.Navigator>
  );
}

function CustomerTabs() {
  const { theme } = useAppContext();
  const isDark = theme === 'dark';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          height: 80, 
          paddingBottom: 20,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
      }}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} options={{ tabBarIcon: ({ color }) => <Home color={color} size={20} /> }} />
      <Tab.Screen name="Tracking" component={TrackingScreen} options={{ tabBarIcon: ({ color }) => <Map color={color} size={20} /> }} />
      <Tab.Screen name="Orders" component={CustomerOrdersScreen} options={{ tabBarIcon: ({ color }) => <ClipboardList color={color} size={20} /> }} />
      <Tab.Screen name="Wallet" component={CustomerWalletScreen} options={{ tabBarIcon: ({ color }) => <Wallet color={color} size={20} /> }} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} options={{ tabBarIcon: ({ color }) => <User color={color} size={20} /> }} />
    </Tab.Navigator>
  );
}

function CarrierTabs() {
  const { theme } = useAppContext();
  const isDark = theme === 'dark';
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          height: 80, 
          paddingBottom: 20,
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          borderTopColor: isDark ? '#374151' : '#e5e7eb',
        },
        tabBarActiveTintColor: '#10b981', // Emerald green for carrier
        tabBarInactiveTintColor: isDark ? '#9ca3af' : '#6b7280',
      }}
    >
      <Tab.Screen name="Jobs" component={CarrierJobsScreen} options={{ tabBarIcon: ({ color }) => <Briefcase color={color} size={20} /> }} />
      <Tab.Screen name="Active" component={CarrierActiveScreen} options={{ tabBarIcon: ({ color }) => <Zap color={color} size={20} /> }} />
      <Tab.Screen name="Earnings" component={CarrierEarningsScreen} options={{ tabBarIcon: ({ color }) => <TrendingUp color={color} size={20} /> }} />
      <Tab.Screen name="Trust" component={CarrierTrustScreen} options={{ tabBarIcon: ({ color }) => <ShieldCheck color={color} size={20} /> }} />
      <Tab.Screen name="Profile" component={CarrierProfileScreen} options={{ tabBarIcon: ({ color }) => <User color={color} size={20} /> }} />
    </Tab.Navigator>
  );
}

export const RootNavigator = () => {
  const { isLoggedIn, userRole } = useAppContext();

  // ROOT NAVIGATION LOGIC: IF NOT LOGGED IN
  if (!isLoggedIn) {
    return <AuthStack />;
  }

  // IF LOGGED IN AND role === "customer"
  if (userRole === 'customer') {
    return <CustomerTabs />;
  }

  // IF LOGGED IN AND role === "carrier"
  if (userRole === 'carrier') {
    return <CarrierTabs />;
  }

  return null;
};
