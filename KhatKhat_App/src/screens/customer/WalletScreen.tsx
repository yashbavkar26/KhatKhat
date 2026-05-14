import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { CreditCard, Banknote, ShieldCheck, ChevronRight, TrendingUp, Clock } from 'lucide-react-native';

export const WalletScreen = () => {
  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="mb-12">
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">PAYMENTS 💳</Text>
              <Text className="text-3xl font-black text-gray-900 mt-1">My Wallet</Text>
            </View>

            <Card className="mb-10 p-0 overflow-hidden bg-white shadow-2xl shadow-indigo-100 border-2 border-indigo-50">
               <LinearGradient colors={['#6366f1', '#4338ca']} className="p-10">
                  <View className="flex-row justify-between items-start mb-12">
                     <View>
                        <Text className="text-white/60 font-black text-[10px] uppercase tracking-[4px] mb-1">TOTAL SPENT</Text>
                        <Text className="text-5xl font-black text-white">₹1,240</Text>
                     </View>
                     <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md">
                        <TrendingUp size={28} color="white" />
                     </View>
                  </View>
                  <View className="flex-row items-center bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                     <CreditCard size={20} color="white" opacity={0.6} />
                     <Text className="text-white font-bold ml-3 mr-auto">HDFC BANK **** 1293</Text>
                     <Text className="text-white/50 font-black text-[10px] uppercase">PRIMARY</Text>
                  </View>
               </LinearGradient>
            </Card>

            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight ml-1">Payment Options</Text>
            <View className="flex-row space-x-4 mb-10">
               <TouchableOpacity className="flex-1 bg-white p-8 rounded-[32px] border-2 border-primary items-center shadow-md">
                  <View className="w-14 h-14 bg-indigo-50 rounded-full items-center justify-center mb-4">
                     <CreditCard size={28} color="#6366f1" />
                  </View>
                  <Text className="text-gray-900 font-black text-xs uppercase">ONLINE</Text>
                  <Text className="text-primary font-bold text-[9px] mt-1">ACTIVE</Text>
               </TouchableOpacity>
               <TouchableOpacity className="flex-1 bg-gray-50 p-8 rounded-[32px] border border-gray-100 items-center">
                  <View className="w-14 h-14 bg-white rounded-full items-center justify-center mb-4 shadow-sm">
                     <Banknote size={28} color="#9ca3af" />
                  </View>
                  <Text className="text-gray-400 font-black text-xs uppercase">CASH (COD)</Text>
                  <Text className="text-gray-300 font-bold text-[9px] mt-1">SUPPORTED</Text>
               </TouchableOpacity>
            </View>

            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight ml-1">Recent Activity</Text>
            {[
              { id: '1', title: 'Medicine Box Delivery', amount: '85', date: 'Today, 10:45 AM', type: 'PAID' },
              { id: '2', title: 'Laptop Charger', amount: '120', date: 'Yesterday', type: 'PAID' }
            ].map((item) => (
              <View key={item.id} className="flex-row items-center bg-white p-6 rounded-[28px] mb-5 border border-indigo-50 shadow-sm">
                <View className="w-12 h-12 bg-indigo-50 rounded-2xl items-center justify-center mr-5">
                   <Clock size={24} color="#6366f1" />
                </View>
                <View className="flex-1">
                   <Text className="text-lg font-black text-gray-900">{item.title}</Text>
                   <Text className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">{item.date}</Text>
                </View>
                <View className="items-end">
                   <Text className="text-xl font-black text-gray-900">₹{item.amount}</Text>
                   <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">{item.type}</Text>
                </View>
              </View>
            ))}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
