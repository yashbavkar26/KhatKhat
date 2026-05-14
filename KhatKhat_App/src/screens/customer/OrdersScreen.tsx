import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { Package, MapPin, ChevronRight, RefreshCcw, CheckCircle2, Loader2 } from 'lucide-react-native';
import { useSenderHistory } from '../../hooks/queries/useParcels';

export const OrdersScreen = ({ navigation }: any) => {
  const { data: historyResponse, isLoading } = useSenderHistory();
  const orders = historyResponse?.data?.parcels || [];
  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="mb-10">
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">HISTORY 📦</Text>
              <Text className="text-3xl font-black text-gray-900 mt-1">Your Orders</Text>
            </View>

            {isLoading ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-gray-400 font-bold">Loading your orders...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-gray-400 font-bold">No orders found.</Text>
              </View>
            ) : (
              orders.map((order: any) => (
                <Card key={order._id || order.id} className="mb-8 p-0 overflow-hidden border border-indigo-50 shadow-xl shadow-indigo-100">
                  <View className="p-6">
                    <View className="flex-row justify-between items-center mb-6">
                      <View className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                         <Package size={16} color="#6366f1" />
                         <Text className="ml-2 text-primary font-black text-[10px] uppercase">{order.status || 'PENDING'}</Text>
                      </View>
                      <Text className="text-xl font-black text-gray-900">₹{order.price || '85'}</Text>
                    </View>

                    <Text className="text-2xl font-black text-gray-900 mb-6">{order.description || order.title}</Text>
                    
                    <View className="bg-gray-50 rounded-[20px] p-4 border border-gray-100 mb-6">
                      <View className="flex-row items-center mb-4">
                        <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                        <Text className="text-sm font-bold text-gray-400 mr-2 uppercase tracking-tighter text-[9px]">FROM</Text>
                        <Text className="text-sm font-bold text-gray-800" numberOfLines={1}>{order.pickupAddress || order.from}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 bg-emerald-500 rounded-full mr-4" />
                        <Text className="text-sm font-bold text-gray-400 mr-2 uppercase tracking-tighter text-[9px]">TO</Text>
                        <Text className="text-sm font-bold text-gray-800 ml-5" numberOfLines={1}>{order.dropAddress || order.to}</Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center border-t border-gray-50 pt-6">
                      <Text className="text-xs font-bold text-gray-400 uppercase tracking-tighter">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => navigation.navigate('Home')}
                        className="flex-row items-center bg-primary px-5 py-2.5 rounded-full shadow-lg shadow-indigo-100"
                      >
                        <RefreshCcw size={16} color="white" />
                        <Text className="ml-2 text-white font-black text-xs uppercase tracking-tighter">Reorder</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))
            )}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
