import React, { createContext, useContext, useState } from 'react';

type UserMode = 'customer' | 'carrier' | null;

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  userRole: 'customer' | 'carrier';
  setUserRole: (role: 'customer' | 'carrier') => void;
  activeOrder: any; // Mock order data
  setActiveOrder: (order: any) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMode, setUserMode] = useState<UserMode>(null);
  const [userRole, setUserRole] = useState<'customer' | 'carrier'>('customer');
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        setIsLoggedIn,
        userMode,
        setUserMode,
        userRole,
        setUserRole,
        activeOrder,
        setActiveOrder,
        theme,
        setTheme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
