import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { User, ShieldCheck, Award, MapPin, LogOut, ChevronRight, Phone, Repeat } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useUser } from '../../hooks/queries/useAuth';

export const ProfileScreen = ({ navigation }: any) => {
  const { setIsLoggedIn, switchRole } = useAppContext();
  const { data: userResponse, isLoading } = useUser();
  const user = userResponse?.data?.user;

  const handleSwitchToCarrier = () => {
    Alert.alert(
      'Switch to Delivery Partner',
      'You will switch to Delivery Partner mode. You can switch back anytime from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: () => switchRole('carrier'),
        },
      ]
    );
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="items-center mb-12">
               <View className="w-36 h-36 bg-white rounded-[48px] p-1 shadow-2xl shadow-indigo-100 mb-6 border-4 border-indigo-50">
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300' }} 
                    className="w-full h-full rounded-[44px]"
                  />
               </View>
               <Text className="text-4xl font-black text-gray-900">{user?.name || 'Loading...'}</Text>
               <View className="flex-row items-center mt-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                  <ShieldCheck size={16} color="#6366f1" />
                  <Text className="ml-2 text-primary font-black text-[10px] uppercase tracking-widest">
                    {user?.verified ? 'VERIFIED USER' : 'CUSTOMER'}
                  </Text>
               </View>
            </View>

            <View className="flex-row space-x-4 mb-10">
               <Card className="flex-1 p-8 items-center bg-white border-2 border-indigo-50">
                  <Text className="text-3xl font-black text-gray-900">{user?.trustScore || '0'}</Text>
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">TRUST SCORE</Text>
               </Card>
               <Card className="flex-1 p-8 items-center bg-white border-2 border-indigo-50">
                  <Text className="text-3xl font-black text-gray-900">{user?.totalSent || 0}</Text>
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">ORDERS SENT</Text>
               </Card>
            </View>

            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight ml-1">Account Settings</Text>
            <View className="mb-6">
               {[
                 { label: 'Saved Addresses', icon: <MapPin size={22} color="#6366f1" />, color: 'bg-indigo-50' },
                 { label: 'Security & Privacy', icon: <ShieldCheck size={22} color="#10b981" />, color: 'bg-emerald-50' },
                 { label: 'Badges & Rewards', icon: <Award size={22} color="#f59e0b" />, color: 'bg-amber-50' },
                 { label: 'Contact Support', icon: <Phone size={22} color="#ef4444" />, color: 'bg-rose-50' }
               ].map((item, idx) => (
                 <TouchableOpacity key={idx} className="flex-row items-center bg-white p-6 rounded-[32px] mb-4 border border-indigo-50 shadow-sm">
                   <View className={`w-14 h-14 ${item.color} rounded-[20px] items-center justify-center mr-5`}>
                      {item.icon}
                   </View>
                   <Text className="flex-1 text-lg font-black text-gray-900">{item.label}</Text>
                   <ChevronRight size={20} color="#9ca3af" />
                 </TouchableOpacity>
               ))}
            </View>

            {/* Switch to Delivery Partner */}
            <TouchableOpacity
              onPress={handleSwitchToCarrier}
              className="flex-row items-center justify-center bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 mb-4 shadow-sm"
            >
              <Repeat size={24} color="#10b981" />
              <View className="ml-3">
                <Text className="text-emerald-700 font-black text-lg">Switch to Delivery Partner</Text>
                <Text className="text-emerald-500 text-xs font-medium">Earn money by delivering parcels</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => { setIsLoggedIn(false); }}
              className="flex-row items-center justify-center bg-rose-50 p-6 rounded-[32px] border border-rose-100 mb-12 shadow-sm"
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


