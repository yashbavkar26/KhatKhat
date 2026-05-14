import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, TrendingUp, Clock, Zap, ShieldCheck, ChevronRight, AlertCircle, Moon, Sun } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';

const JOBS = [
  {
    id: '1',
    type: 'Medical Supplies',
    from: 'Andheri West',
    to: 'Bandra East',
    earnings: '85',
    match: '98',
    detour: '2',
    urgency: 'Urgent',
    urgencyColor: 'text-rose-500 bg-rose-50'
  },
  {
    id: '2',
    type: 'Laptop Charger',
    from: 'Juhu',
    to: 'Santacruz',
    earnings: '55',
    match: '85',
    detour: '5',
    urgency: 'Normal',
    urgencyColor: 'text-indigo-500 bg-indigo-50'
  },
  {
    id: '3',
    type: 'Lunch Box',
    from: 'Vile Parle',
    to: 'BKC',
    earnings: '70',
    match: '92',
    detour: '3',
    urgency: 'Fast',
    urgencyColor: 'text-amber-500 bg-amber-50'
  }
];

export const JobsScreen = ({ navigation }: any) => {
  const { theme, setTheme, activeOrder } = useAppContext();
  return (
    <View className="flex-1">
      <LinearGradient colors={theme === 'dark' ? ['#0f172a', '#1e293b'] : ['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-10" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-10">
              <View>
                <Text className={`font-bold text-sm tracking-widest uppercase ${theme === 'dark' ? 'text-indigo-300' : 'text-gray-400'}`}>READY TO EARN? 💰</Text>
                <Text className={`text-3xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Available Jobs</Text>
              </View>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50'}`}
                >
                  {theme === 'light' ? <Moon size={24} color="#6366f1" /> : <Sun size={24} color="#f59e0b" />}
                </TouchableOpacity>
                <View className={`w-12 h-12 rounded-full items-center justify-center shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50'}`}>
                  <TrendingUp size={24} color="#6366f1" />
                </View>
              </View>
            </View>

            <View className="flex-row space-x-3 mb-10 overflow-hidden">
               <View className="bg-primary px-5 py-3 rounded-full shadow-lg shadow-indigo-100">
                  <Text className="text-white font-bold">New Jobs (12)</Text>
               </View>
               <View className="bg-white px-5 py-3 rounded-full border border-indigo-50">
                  <Text className="text-gray-400 font-bold">Recommended</Text>
               </View>
            </View>

            {/* Live Order from Context */}
            {activeOrder && (
              <Card className="mb-8 p-6 overflow-hidden border-2 border-emerald-400">
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <View className={`px-3 py-1 rounded-full self-start mb-3 bg-emerald-50`}>
                      <Text className="text-[10px] font-black uppercase tracking-tighter text-emerald-600">NEW LIVE REQUEST 📡</Text>
                    </View>
                    <Text className="text-2xl font-black text-gray-900">{activeOrder.type}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-3xl font-black text-emerald-500">₹{activeOrder.earnings}</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">EARNINGS</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-[24px] p-5 mb-8 border border-gray-100">
                  <View className="flex-row items-center mb-5">
                    <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                    <Text className="text-base font-black text-gray-900">{activeOrder.from}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-emerald-500 rounded-full mr-4" />
                    <Text className="text-base font-black text-gray-900 ml-5">{activeOrder.to}</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('AgentProfile')}
                  className="bg-emerald-500 p-5 rounded-[24px] items-center shadow-lg shadow-emerald-100"
                >
                  <Text className="text-white font-black uppercase text-xs">Accept Live Job</Text>
                </TouchableOpacity>
              </Card>
            )}

            {JOBS.map((job) => (
              <Card key={job.id} className="mb-8 p-6 overflow-hidden">
                <View className="flex-row justify-between items-start mb-6">
                  <View>
                    <View className={`px-3 py-1 rounded-full self-start mb-3 ${job.urgencyColor}`}>
                      <Text className="text-[10px] font-black uppercase tracking-tighter">{job.urgency} DELIVERY</Text>
                    </View>
                    <Text className="text-2xl font-black text-gray-900">{job.type}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-3xl font-black text-primary">₹{job.earnings}</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">EARNINGS</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-[24px] p-5 mb-8 border border-gray-100">
                  <View className="flex-row items-center mb-5">
                    <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-tighter mr-3">FROM</Text>
                    <Text className="text-base font-black text-gray-900">{job.from}</Text>
                  </View>
                  <View className="w-0.5 h-6 bg-gray-200 ml-0.75 mb-1" />
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 bg-emerald-500 rounded-full mr-4" />
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-tighter mr-3">TO</Text>
                    <Text className="text-base font-black text-gray-900 ml-4">{job.to}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between mb-8 px-2">
                  <View className="items-center">
                    <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mb-2">
                       <ShieldCheck size={20} color="#6366f1" />
                    </View>
                    <Text className="text-primary font-black text-xs">{job.match}%</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">MATCH</Text>
                  </View>
                  <View className="items-center">
                    <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center mb-2">
                       <Clock size={20} color="#f59e0b" />
                    </View>
                    <Text className="text-amber-500 font-black text-xs">+{job.detour}m</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">DETOUR</Text>
                  </View>
                  <View className="items-center">
                    <View className="w-12 h-12 bg-rose-50 rounded-full items-center justify-center mb-2">
                       <AlertCircle size={20} color="#ef4444" />
                    </View>
                    <Text className="text-rose-500 font-black text-xs">HIGH</Text>
                    <Text className="text-[10px] font-bold text-gray-400 uppercase">TRUST</Text>
                  </View>
                </View>

                <View className="flex-row space-x-3">
                   <TouchableOpacity className="flex-1 bg-gray-50 p-5 rounded-[24px] items-center border border-gray-100">
                      <Text className="text-gray-400 font-black uppercase text-xs">Ignore</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => navigation.navigate('AgentProfile')}
                     className="flex-[2] bg-primary p-5 rounded-[24px] items-center shadow-lg shadow-indigo-100 overflow-hidden"
                   >
                     <LinearGradient colors={['#6366f1', '#4f46e5']} className="absolute inset-0" />
                     <Text className="text-white font-black uppercase text-xs">Accept Job</Text>
                   </TouchableOpacity>
                </View>
              </Card>
            ))}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
