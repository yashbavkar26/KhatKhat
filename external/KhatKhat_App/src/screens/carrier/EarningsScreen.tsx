import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { TrendingUp, DollarSign, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react-native';

export const EarningsScreen = () => {
  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="mb-12">
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">FINANCES 🏦</Text>
              <Text className="text-3xl font-black text-gray-900 mt-1">Your Earnings</Text>
            </View>

            <Card className="mb-10 p-0 overflow-hidden bg-primary shadow-2xl shadow-indigo-200">
               <LinearGradient colors={['#6366f1', '#4338ca']} className="p-10 items-center">
                  <Text className="text-white/70 font-black text-[10px] uppercase tracking-[4px] mb-4">TOTAL REVENUE (WEEK)</Text>
                  <Text className="text-6xl font-black text-white">₹2,450</Text>
                  <View className="bg-white/20 px-4 py-2 rounded-full mt-6 backdrop-blur-md">
                     <Text className="text-white font-bold text-xs">+12.5% FROM LAST WEEK</Text>
                  </View>
               </LinearGradient>
            </Card>

            <View className="flex-row space-x-4 mb-12">
               <Card className="flex-1 p-6 border border-indigo-50">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Today</Text>
                  <Text className="text-3xl font-black text-gray-900">₹450</Text>
                  <Text className="text-[10px] font-bold text-emerald-500 mt-2">6 JOBS DONE</Text>
               </Card>
               <Card className="flex-1 p-6 border border-indigo-50">
                  <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payouts</Text>
                  <Text className="text-3xl font-black text-gray-900">₹1.8k</Text>
                  <Text className="text-[10px] font-bold text-indigo-400 mt-2">TRANSFERRED</Text>
               </Card>
            </View>

            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight ml-1">Recent Transactions</Text>
            {[
              { id: '1', title: 'Medical Supplies', date: 'Today, 10:45 AM', amount: '85', status: 'COMPLETED' },
              { id: '2', title: 'Lunch Delivery', date: 'Today, 12:30 PM', amount: '70', status: 'COMPLETED' },
              { id: '3', title: 'Laptop Handoff', date: 'Yesterday', amount: '120', status: 'COMPLETED' }
            ].map((item) => (
              <View key={item.id} className="flex-row items-center bg-white p-6 rounded-[28px] mb-5 border border-indigo-50 shadow-sm">
                <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center mr-5">
                   <CheckCircle2 size={24} color="#10b981" />
                </View>
                <View className="flex-1">
                   <Text className="text-lg font-black text-gray-900">{item.title}</Text>
                   <Text className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">{item.date}</Text>
                </View>
                <View className="items-end">
                   <Text className="text-xl font-black text-gray-900">₹{item.amount}</Text>
                   <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">{item.status}</Text>
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
