import React from 'react';
import { View, Text } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card = ({ children, className = '', title, subtitle }: CardProps) => {
  return (
    <View 
      className={`bg-white rounded-[24px] p-5 shadow-xl shadow-indigo-100 ${className}`}
      style={{
        elevation: 10,
        shadowColor: '#6366f1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      }}
    >
      {(title || subtitle) && (
        <View className="mb-4">
          {title && <Text className="text-xl font-bold text-gray-900 tracking-tight">{title}</Text>}
          {subtitle && <Text className="text-sm text-gray-500 mt-1 font-medium">{subtitle}</Text>}
        </View>
      )}
      {children}
    </View>
  );
};
