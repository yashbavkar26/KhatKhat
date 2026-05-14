import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, TrendingUp, Clock, Zap, ShieldCheck, ChevronRight, AlertCircle, Moon, Sun, Loader2 } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useAvailableJobs, useAcceptParcel } from '../../hooks/queries/useCarriers';

export const JobsScreen = ({ navigation }: any) => {
  const { theme, setTheme, activeOrder, setActiveOrder } = useAppContext();
  const { data: jobsResponse, isLoading } = useAvailableJobs({ refetchInterval: 10000 });
  const acceptMutation = useAcceptParcel();
  const jobs = jobsResponse?.data?.jobs || [];
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
                  <Text className="text-white font-bold">New Jobs ({jobs.length})</Text>
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

            {isLoading ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-gray-400 font-bold">Finding jobs nearby...</Text>
              </View>
            ) : jobs.length === 0 ? (
              <View className="flex-1 justify-center items-center py-20">
                <Text className="text-gray-400 font-bold">No jobs right now. You are active.</Text>
              </View>
            ) : (
              jobs.map((job: any) => (
                <Card key={job.parcelId || job.id} className="mb-8 p-6 overflow-hidden">
                  <View className="flex-row justify-between items-start mb-6">
                    <View>
                      <View className={`px-3 py-1 rounded-full self-start mb-3 ${job.urgency === 'CRITICAL' ? 'text-rose-500 bg-rose-50' : 'text-indigo-500 bg-indigo-50'}`}>
                        <Text className="text-[10px] font-black uppercase tracking-tighter">{job.urgency || 'Normal'} DELIVERY</Text>
                      </View>
                      <Text className="text-2xl font-black text-gray-900">{job.itemCategory || job.type || 'Package'}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-3xl font-black text-primary">₹{job.carrierEarning || job.price || job.earnings || 50}</Text>
                      <Text className="text-[10px] font-bold text-gray-400 uppercase">EARNINGS</Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 rounded-[24px] p-5 mb-8 border border-gray-100">
                    <View className="flex-row items-center mb-5">
                      <View className="w-2 h-2 bg-primary rounded-full mr-4" />
                      <Text className="text-sm font-bold text-gray-500 uppercase tracking-tighter mr-3">FROM</Text>
                      <Text className="text-base font-black text-gray-900" numberOfLines={1}>{job.pickupAddress || job.from}</Text>
                    </View>
                    <View className="w-0.5 h-6 bg-gray-200 ml-0.75 mb-1" />
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 bg-emerald-500 rounded-full mr-4" />
                      <Text className="text-sm font-bold text-gray-500 uppercase tracking-tighter mr-3">ETA</Text>
                      <Text className="text-base font-black text-gray-900 ml-4">{job.estimatedMinutes ? `${job.estimatedMinutes} mins` : '15 mins'}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between mb-8 px-2">
                    <View className="items-center">
                      <View className="w-12 h-12 bg-indigo-50 rounded-full items-center justify-center mb-2">
                         <ShieldCheck size={20} color="#6366f1" />
                      </View>
                      <Text className="text-primary font-black text-xs">98%</Text>
                      <Text className="text-[10px] font-bold text-gray-400 uppercase">MATCH</Text>
                    </View>
                    <View className="items-center">
                      <View className="w-12 h-12 bg-amber-50 rounded-full items-center justify-center mb-2">
                         <MapPin size={20} color="#f59e0b" />
                      </View>
                      <Text className="text-amber-500 font-black text-xs">{job.distanceKm || 2} km</Text>
                      <Text className="text-[10px] font-bold text-gray-400 uppercase">DISTANCE</Text>
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
                       onPress={async () => {
                         try {
                           await acceptMutation.mutateAsync(job.parcelId || job.id);
                           setActiveOrder({
                             id: job.parcelId || job.id,
                             type: job.itemCategory || job.type,
                             from: job.pickupAddress || job.from,
                             to: job.dropAddress || job.to,
                             earnings: job.carrierEarning?.toString() || job.earnings?.toString() || '50',
                           });
                           navigation.navigate('AgentProfile'); // Navigate to ActiveDelivery
                         } catch (error) {
                           console.error('Accept job error', error);
                         }
                       }}
                       disabled={acceptMutation.isPending}
                       className={`flex-[2] bg-primary p-5 rounded-[24px] items-center shadow-lg shadow-indigo-100 overflow-hidden ${acceptMutation.isPending ? 'opacity-50' : ''}`}
                     >
                       <LinearGradient colors={['#6366f1', '#4f46e5']} className="absolute inset-0" />
                       <Text className="text-white font-black uppercase text-xs">
                         {acceptMutation.isPending ? 'Accepting...' : 'Accept Job'}
                       </Text>
                     </TouchableOpacity>
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
