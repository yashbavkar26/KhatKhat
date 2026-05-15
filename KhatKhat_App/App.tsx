import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import { RootNavigator } from './src/navigation/AppNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { navigationRef } from './src/navigation/navigationRef';
import './global.css';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            // Flush any navigation calls that happened before the container was ready
            try {
              const mod = require('./src/navigation/navigationRef');
              if (mod && typeof mod.flushQueuedNavigation === 'function') {
                mod.flushQueuedNavigation();
              }
            } catch (e) {
              // swallow; best-effort
            }
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </AppProvider>
    </QueryClientProvider>
  );
}