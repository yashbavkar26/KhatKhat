import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from 'react-native';
import { useAppContext } from '../../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, ArrowRight, Package } from 'lucide-react-native';

export default function SignupScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRole, setSelectedRole] = useState<'customer' | 'carrier'>('customer');
  
  const { theme, setTheme, setUserRole } = useAppContext();

  const isDark = theme === 'dark';

  const handleSignup = () => {
    setUserRole(selectedRole);
    navigation.navigate('OTP', { 
      phoneNumber: phone,
      name,
      role: selectedRole,
      isSignup: true 
    });
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ['#111827', '#1f2937'] : ['#F8F9FF', '#E0E7FF']}
        style={{ flex: 1, padding: 24, justifyContent: 'center' }}
      >
        {/* Theme Toggle */}
        <TouchableOpacity 
          onPress={toggleTheme}
          style={{ 
            position: 'absolute', 
            top: 60, 
            right: 24,
            padding: 12,
            backgroundColor: isDark ? '#374151' : '#ffffff',
            borderRadius: 50,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}
        >
          {isDark ? <Sun color="#FBBF24" size={24} /> : <Moon color="#6366F1" size={24} />}
        </TouchableOpacity>

        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <View style={{ 
            width: 80, 
            height: 80, 
            backgroundColor: isDark ? '#374151' : '#ffffff', 
            borderRadius: 40, 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: 20,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10
          }}>
            <Package size={40} color="#6366F1" />
          </View>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '900', 
            color: isDark ? '#F9FAFB' : '#111827',
            marginBottom: 8,
            letterSpacing: -1
          }}>
            Create Account
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDark ? '#9CA3AF' : '#6B7280',
            fontWeight: '500'
          }}>
            Join the KhatKhat community
          </Text>
        </View>

        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: isDark ? '#374151' : '#ffffff',
          borderRadius: 16,
          padding: 6,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: selectedRole === 'customer' ? '#6366F1' : 'transparent',
              alignItems: 'center',
            }}
            onPress={() => setSelectedRole('customer')}
          >
            <Text style={{ 
              fontWeight: 'bold',
              fontSize: 16,
              color: selectedRole === 'customer' ? '#ffffff' : (isDark ? '#9CA3AF' : '#6B7280') 
            }}>
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              backgroundColor: selectedRole === 'carrier' ? '#10B981' : 'transparent',
              alignItems: 'center',
            }}
            onPress={() => setSelectedRole('carrier')}
          >
            <Text style={{ 
              fontWeight: 'bold',
              fontSize: 16,
              color: selectedRole === 'carrier' ? '#ffffff' : (isDark ? '#9CA3AF' : '#6B7280') 
            }}>
              Delivery Agent
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            color: isDark ? '#D1D5DB' : '#374151', 
            fontWeight: '600', 
            marginBottom: 8,
            marginLeft: 4
          }}>
            Full Name
          </Text>
          <TextInput
            placeholder="Enter your full name"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={name}
            onChangeText={setName}
            style={{
              backgroundColor: isDark ? '#374151' : '#ffffff',
              color: isDark ? '#F9FAFB' : '#111827',
              borderWidth: 1,
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
              borderRadius: 16,
              padding: 16,
              fontSize: 16,
              fontWeight: '500',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 1
            }}
          />
        </View>

        <View style={{ marginBottom: 30 }}>
          <Text style={{ 
            color: isDark ? '#D1D5DB' : '#374151', 
            fontWeight: '600', 
            marginBottom: 8,
            marginLeft: 4
          }}>
            Phone Number
          </Text>
          <TextInput
            placeholder="Enter your mobile number"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={{
              backgroundColor: isDark ? '#374151' : '#ffffff',
              color: isDark ? '#F9FAFB' : '#111827',
              borderWidth: 1,
              borderColor: isDark ? '#4B5563' : '#E5E7EB',
              borderRadius: 16,
              padding: 16,
              fontSize: 16,
              fontWeight: '500',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
              elevation: 1
            }}
          />
        </View>

        <TouchableOpacity 
          style={{
            backgroundColor: selectedRole === 'carrier' ? '#10B981' : '#6366F1',
            borderRadius: 16,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: selectedRole === 'carrier' ? '#10B981' : '#6366F1',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
            marginBottom: 20
          }} 
          onPress={handleSignup}
        >
          <Text style={{ 
            color: '#ffffff', 
            fontWeight: 'bold', 
            fontSize: 18,
            marginRight: 8
          }}>
            Sign Up
          </Text>
          <ArrowRight color="#ffffff" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Login')}
          style={{ alignItems: 'center' }}
        >
          <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 16, fontWeight: '500' }}>
            Already have an account? <Text style={{ color: '#6366F1', fontWeight: 'bold' }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
