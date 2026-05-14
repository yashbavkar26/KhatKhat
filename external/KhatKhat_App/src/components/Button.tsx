import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  icon,
}: ButtonProps) => {
  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return ['#f3f4f6', '#e5e7eb'];
      case 'danger':
        return ['#ef4444', '#dc2626'];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return ['#6366f1', '#4f46e5'];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2';
      case 'lg':
        return 'px-10 py-5';
      default:
        return 'px-8 py-4';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary font-bold';
      case 'secondary':
        return 'text-gray-900 font-bold';
      default:
        return 'text-white font-bold text-lg';
    }
  };

  const content = (
    <View className={`flex-row items-center justify-center ${getSizeStyles()}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#6366f1' : 'white'} />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={getTextStyles()}>{title}</Text>
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-full overflow-hidden shadow-lg ${variant === 'outline' ? 'border-2 border-primary' : ''} ${className} ${disabled ? 'opacity-50' : ''}`}
      style={{ elevation: 5 }}
    >
      <LinearGradient
        colors={getGradientColors() as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        {content}
      </LinearGradient>
    </TouchableOpacity>
  );
};
