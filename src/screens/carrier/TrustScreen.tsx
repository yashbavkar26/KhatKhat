import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { ShieldCheck, Star, Award, Zap, TrendingUp, Heart } from 'lucide-react-native';

export const TrustScreen = () => {
  return (
    <View className="flex-1">
      <LinearGradient colors={['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="mb-12">
              <Text className="text-gray-400 font-bold text-sm tracking-widest uppercase">REPUTATION 🏆</Text>
              <Text className="text-3xl font-black text-gray-900 mt-1">Trust Profile</Text>
            </View>

            <Card className="mb-10 p-0 overflow-hidden bg-white shadow-2xl shadow-indigo-100 border-2 border-indigo-50">
               <View className="p-10 items-center">
                  <View className="w-32 h-32 bg-indigo-50 rounded-full items-center justify-center mb-6 border-8 border-white shadow-lg">
                     <ShieldCheck size={64} color="#6366f1" />
                  </View>
                  <Text className="text-5xl font-black text-gray-900 mb-2">98</Text>
                  <Text className="text-primary font-black text-[10px] uppercase tracking-[4px]">TRUST SCORE</Text>
                  
                  <View className="flex-row mt-8 bg-amber-50 px-6 py-2.5 rounded-full border border-amber-100">
                     <Star size={16} color="#b45309" fill="#f59e0b" />
                     <Text className="ml-2 text-amber-900 font-black text-xs uppercase">GOLD LEVEL AGENT</Text>
                  </View>
               </View>
               <LinearGradient colors={['#ffffff', '#f8f9ff']} className="p-8 border-t border-indigo-50 flex-row justify-around">
                  <View className="items-center">
                     <Text className="text-xl font-black text-gray-900">124</Text>
                     <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Deliveries</Text>
                  </View>
                  <View className="w-0.5 h-10 bg-gray-100" />
                  <View className="items-center">
                     <Text className="text-xl font-black text-gray-900">4.9</Text>
                     <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Rating</Text>
                  </View>
                  <View className="w-0.5 h-10 bg-gray-100" />
                  <View className="items-center">
                     <Text className="text-xl font-black text-gray-900">0</Text>
                     <Text className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Issues</Text>
                  </View>
               </LinearGradient>
            </Card>

            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight ml-1">Your Badges</Text>
            <View className="flex-row flex-wrap justify-between">
              {[
                { title: 'On-Time', icon: <Zap size={24} color="#6366f1" />, bg: 'bg-indigo-50', border: 'border-indigo-100' },
                { title: 'Emergency', icon: <TrendingUp size={24} color="#ef4444" />, bg: 'bg-rose-50', border: 'border-rose-100' },
                { title: 'Reliable', icon: <Award size={24} color="#10b981" />, bg: 'bg-emerald-50', border: 'border-emerald-100' },
                { title: 'Kind Heart', icon: <Heart size={24} color="#ec4899" />, bg: 'bg-pink-50', border: 'border-pink-100' }
              ].map((badge, idx) => (
                <View key={idx} className={`w-[48%] p-8 rounded-[32px] border-2 mb-4 items-center ${badge.bg} ${badge.border}`}>
                  <View className="bg-white w-16 h-16 rounded-full items-center justify-center mb-4 shadow-sm">
                    {badge.icon}
                  </View>
                  <Text className="text-gray-900 font-black text-xs uppercase tracking-tighter">{badge.title}</Text>
                </View>
              ))}
            </View>
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
