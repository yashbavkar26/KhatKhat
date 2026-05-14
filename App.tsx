import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import CustomerTabs from './navigation/CustomerTabs';
import CarrierTabs from './navigation/CarrierTabs';
import LoginScreen from './screens/LoginScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [role, setRole] = useState<'customer' | 'carrier' | null>(null);

  if (!isLoggedIn) {
    return (
      <LoginScreen
        setIsLoggedIn={setIsLoggedIn}
        setRole={setRole}
      />
    );
  }

  return (
    <NavigationContainer>
      {role === 'customer' ? <CustomerTabs /> : <CarrierTabs />}
    </NavigationContainer>
  );
}