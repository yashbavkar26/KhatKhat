import React, { useState } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ArrowLeft } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useRegister } from '../../hooks/queries/useAuth';
import { authService } from '../../api/services/auth';
import * as SecureStore from 'expo-secure-store';

export const OTPScreen = ({ navigation, route }: any) => {
  const { phoneNumber, name, role, isSignup } = route.params;
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { userRole, setIsLoggedIn } = useAppContext();
  const registerMutation = useRegister();

  const handleVerify = async () => {
    if (otp.length === 4) {
      try {
        setIsVerifying(true);
        
        // HACKATHON DEMO: Save mock token
        const demoToken = `DEMO_TOKEN_${phoneNumber}`;
        await SecureStore.setItemAsync('userToken', demoToken);
        
        if (isSignup) {
          // Signup Flow
        // Always register as 'both' so the user can switch between
        // Customer and Delivery Partner modes at any time.
        await registerMutation.mutateAsync({
          name: name || 'New User',
          role: 'both',
        });
          setIsLoggedIn(true);
        } else {
          // Login Flow: Verify user exists
          try {
            await authService.getMe();
            setIsLoggedIn(true);
          } catch (e) {
            console.error('Login failed, user might not exist', e);
            Alert.alert('Login Failed', 'User account not found. Please sign up.');
          }
        }
      } catch (error: any) {
        console.error('Verification failed', error);
        const errorMsg = error.response?.data?.error || error.message || 'Network error';
        Alert.alert('Verification Failed', `Could not connect to the server: ${errorMsg}`);
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#f8f9ff', '#ffffff']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 px-6 pt-10"
          >
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm mb-8"
            >
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>

            <View className="mb-10">
              <Text className="text-4xl font-bold text-gray-900 mb-2">Verification</Text>
              <Text className="text-lg text-gray-500 font-medium">
                Enter code sent to <Text className="text-primary font-bold">+91 {phoneNumber}</Text>
              </Text>
              <Text className="text-sm text-indigo-500 font-bold mt-2">
                (Demo Mode: Enter any 4 digits like "1234")
              </Text>
            </View>

            <Card className="p-10">
              <View className="flex-row justify-center mb-12">
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} className="w-14 h-16 bg-gray-50 border-2 border-gray-100 rounded-2xl mx-2 items-center justify-center shadow-sm">
                    <Text className="text-3xl font-black text-gray-900">{otp[i] || ''}</Text>
                    {!otp[i] && <View className="w-6 h-1 bg-gray-200 rounded-full" />}
                  </View>
                ))}
                <TextInput
                  className="absolute opacity-0 w-full h-full"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />
              </View>

              <Button
                title="Verify OTP"
                onPress={handleVerify}
                disabled={otp.length < 4 || registerMutation.isPending || isVerifying}
                loading={registerMutation.isPending || isVerifying}
              />
              
              <TouchableOpacity className="mt-8">
                <Text className="text-center text-gray-400 font-medium">Didn't receive code? <Text className="text-primary font-bold">Resend</Text></Text>
              </TouchableOpacity>
            </Card>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
