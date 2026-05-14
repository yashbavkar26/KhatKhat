import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { User, LogOut, MapPin, Phone, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useUser, useToggleCarrierActive } from '../../hooks/queries/useAuth';

export const CarrierProfileScreen = ({ navigation }: any) => {
  const { setIsLoggedIn } = useAppContext();
  const { data: userResponse } = useUser();
  const toggleActiveMutation = useToggleCarrierActive();
  const user = userResponse?.data?.user;
  const isOnline = user?.isCarrierActive || false;

  const handleToggleOnline = async (value: boolean) => {
    try {
      // Mocking current location for demo
      await toggleActiveMutation.mutateAsync({ isActive: value, lat: 19.0760, lng: 72.8777 });
    } catch (error) {
      console.error('Failed to toggle active status', error);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-10">
              <View className="w-32 h-32 bg-white rounded-[40px] p-1 shadow-2xl shadow-indigo-100 mb-6 border-4 border-indigo-50">
                 <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300' }} 
                   className="w-full h-full rounded-[36px]"
                 />
                 <View className={`absolute bottom-1 right-1 w-8 h-8 rounded-full border-4 border-white ${isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </View>
              <Text className="text-3xl font-black text-gray-900">{user?.name || 'Loading...'}</Text>
              <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Professional Delivery Partner</Text>
            </View>

            <Card className="mb-10 p-6 border border-indigo-50">
               <View className="flex-row justify-between items-center mb-6">
                  <View>
                     <Text className="text-lg font-black text-gray-900">{isOnline ? 'Online' : 'Offline'}</Text>
                     <Text className="text-xs text-gray-400 font-bold">Visible for new jobs</Text>
                  </View>
                  <Switch 
                    value={isOnline} 
                    onValueChange={handleToggleOnline}
                    disabled={toggleActiveMutation.isPending}
                    trackColor={{ false: '#e5e7eb', true: '#6366f1' }}
                    thumbColor="white"
                  />
               </View>
               <View className="h-[1px] bg-gray-50 mb-6" />
               <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-4">
                     <MapPin size={20} color="#6366f1" />
                  </View>
                  <View className="flex-1">
                     <Text className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Your Active Route</Text>
                     <Text className="text-base font-bold text-gray-900">Andheri → Bandra</Text>
                  </View>
                  <TouchableOpacity className="bg-indigo-50 px-4 py-2 rounded-full">
                     <Text className="text-primary font-black text-[10px]">EDIT</Text>
                  </TouchableOpacity>
               </View>
            </Card>

            <View className="mb-10">
               {[
                 { label: 'Personal Info', icon: <User size={20} color="#6366f1" /> },
                 { label: 'Vehicle Details', icon: <ShieldCheck size={20} color="#6366f1" /> },
                 { label: 'Support & Help', icon: <Phone size={20} color="#6366f1" /> }
               ].map((item, idx) => (
                 <TouchableOpacity key={idx} className="flex-row items-center bg-white p-6 rounded-[28px] mb-4 border border-indigo-50 shadow-sm">
                   <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-5">
                      {item.icon}
                   </View>
                   <Text className="flex-1 text-lg font-black text-gray-900">{item.label}</Text>
                   <ChevronRight size={20} color="#9ca3af" />
                 </TouchableOpacity>
               ))}
            </View>

            <TouchableOpacity 
              onPress={() => {
                setIsLoggedIn(false);
              }}
              className="flex-row items-center justify-center bg-rose-50 p-6 rounded-[28px] border border-rose-100 mb-12"
            >
              <LogOut size={24} color="#ef4444" />
              <Text className="ml-3 text-rose-500 font-black text-lg">Logout</Text>
            </TouchableOpacity>
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
