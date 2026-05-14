import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { TrendingUp, DollarSign, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { useCarrierHistory } from '../../hooks/queries/useCarriers';

export const EarningsScreen = () => {
  const { data: historyResponse, isLoading } = useCarrierHistory();
  const history = historyResponse?.data?.parcels || [];

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
            {isLoading ? (
               <Text className="text-gray-400 font-bold ml-1">Loading history...</Text>
            ) : history.length === 0 ? (
               <Text className="text-gray-400 font-bold ml-1">No completed deliveries yet.</Text>
            ) : (
               history.map((item: any) => (
                 <View key={item._id} className="flex-row items-center bg-white p-6 rounded-[28px] mb-5 border border-indigo-50 shadow-sm">
                   <View className="w-14 h-14 bg-emerald-50 rounded-2xl items-center justify-center mr-5">
                      <CheckCircle2 size={24} color="#10b981" />
                   </View>
                   <View className="flex-1">
                      <Text className="text-lg font-black text-gray-900">{item.itemCategory || 'Package'}</Text>
                      <Text className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                         {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                      </Text>
                   </View>
                   <View className="items-end">
                      <Text className="text-xl font-black text-gray-900">₹{item.carrierEarning || item.price}</Text>
                      <Text className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">{item.status}</Text>
                   </View>
                 </View>
               ))
            )}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
