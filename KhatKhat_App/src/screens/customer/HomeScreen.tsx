import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, Package, Zap, Clock, AlertTriangle, CheckCircle2, ChevronRight, CreditCard, Banknote, Map as MapIcon, Moon, Sun } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useEstimateParcel, useCreateParcel } from '../../hooks/queries/useParcels';
import { useClassifyParcel } from '../../hooks/queries/useAi';

const { width } = Dimensions.get('window');

export const CustomerHomeScreen = ({ navigation }: any) => {
  const { theme, setTheme, setActiveOrder } = useAppContext();
  const [request, setRequest] = useState('');
  const [pickup, setPickup] = useState('My Current Location');
  const [drop, setDrop] = useState('');
  const [urgency, setUrgency] = useState<'normal' | 'fast' | 'emergency'>('normal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const estimateMutation = useEstimateParcel();
  const classifyMutation = useClassifyParcel();
  const createParcelMutation = useCreateParcel();
  const [estimatedData, setEstimatedData] = useState<any>(null);

  const analyzeRequest = async () => {
    setIsAnalyzing(true);
    try {
      const classifyRes = await classifyMutation.mutateAsync(request || 'package');
      const category = classifyRes.data?.itemCategory || 'other';
      
      const estimateRes = await estimateMutation.mutateAsync({
        pickupLat: 19.07,
        pickupLng: 72.87,
        dropLat: 19.10,
        dropLng: 72.90,
        urgency: urgency === 'emergency' ? 'CRITICAL' : urgency === 'fast' ? 'HIGH' : 'MEDIUM',
        itemCategory: category,
      });
      
      setEstimatedData(estimateRes.data);
      setShowResult(true);
    } catch (error) {
      console.error('API Error:', error);
      // Fallback for UI if backend is offline
      setEstimatedData({ price: 85, distanceKm: 2.5, estimatedMinutes: 15 });
      setShowResult(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyIcon = (type: string) => {
    switch (type) {
      case 'fast': return <Zap size={20} color="#6366f1" />;
      case 'emergency': return <AlertTriangle size={20} color="#ef4444" />;
      default: return <Clock size={20} color="#6b7280" />;
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient colors={theme === 'dark' ? ['#0f172a', '#1e293b'] : ['#f8f9ff', '#ffffff']} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-[10px] text-indigo-300 font-bold">v2.1 - LATEST CODE</Text>
            </View>
            <View className="mb-10 flex-row justify-between items-center">
              <View>
                <Text className={`font-bold text-sm tracking-widest uppercase ${theme === 'dark' ? 'text-indigo-300' : 'text-gray-400'}`}>Good Morning 👋</Text>
                <Text className={`text-3xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Hello, Amey!</Text>
              </View>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50'}`}
                >
                  {theme === 'light' ? <Moon size={24} color="#6366f1" /> : <Sun size={24} color="#f59e0b" />}
                </TouchableOpacity>
                <TouchableOpacity className={`w-12 h-12 rounded-full items-center justify-center shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-indigo-50'}`}>
                  <MapIcon size={24} color="#6366f1" />
                </TouchableOpacity>
              </View>
            </View>

            <Card className="mb-8 p-6 border border-indigo-50" title="What do you want to send?">
              <View className="bg-gray-50 rounded-[20px] p-4 border border-gray-100 mb-6">
                <TextInput
                  placeholder="e.g. Medicine box or Laptop charger..."
                  className="text-lg font-medium text-gray-800"
                  value={request}
                  onChangeText={setRequest}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View className="space-y-6">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-4">
                    <MapPin size={20} color="#6366f1" />
                  </View>
                  <View className="flex-1 border-b border-gray-50 pb-2">
                    <Text className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Pickup Location</Text>
                    <TextInput className="text-base font-bold text-gray-800 p-0" value={pickup} onChangeText={setPickup} />
                  </View>
                </View>

                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mr-4">
                    <MapPin size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Drop Location</Text>
                    <TextInput 
                      className="text-base font-bold text-gray-800 p-0" 
                      placeholder="Enter destination address" 
                      value={drop} 
                      onChangeText={setDrop} 
                    />
                  </View>
                </View>
              </View>
            </Card>

            <Text className="text-lg font-black text-gray-900 mb-4 ml-1 uppercase tracking-tight">Delivery Urgency</Text>
            <View className="flex-row mb-10">
              {[
                { id: 'normal', label: 'Normal', color: '#6b7280', bg: 'bg-gray-50' },
                { id: 'fast', label: 'Fast', color: '#6366f1', bg: 'bg-indigo-50' },
                { id: 'emergency', label: 'Urgent 🚨', color: '#ef4444', bg: 'bg-rose-50' }
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setUrgency(item.id as any)}
                  className={`flex-1 mx-1.5 p-5 rounded-[24px] border-2 items-center justify-center ${urgency === item.id ? 'border-primary bg-white shadow-md' : 'border-white bg-white shadow-sm'}`}
                >
                  <View className={`w-10 h-10 rounded-full items-center justify-center mb-2 ${urgency === item.id ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                    {getUrgencyIcon(item.id)}
                  </View>
                  <Text className={`font-black text-xs ${urgency === item.id ? 'text-gray-900' : 'text-gray-400'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!showResult && (
              <Button
                title="Analyze Request"
                onPress={analyzeRequest}
                loading={isAnalyzing}
                className="mb-12 shadow-indigo-200"
              />
            )}

            {showResult && (
              <View className="mb-12">
                <Card className="mb-8 border border-primary/20 overflow-hidden">
                  <LinearGradient colors={['#6366f110', '#ffffff']} className="p-6">
                    <View className="flex-row justify-between items-start mb-8">
                      <View>
                        <View className="flex-row items-center bg-white px-3 py-1.5 rounded-full shadow-sm mb-2 self-start">
                          <Package size={18} color="#6366f1" />
                          <Text className="ml-2 font-black text-gray-900 uppercase text-[10px]">Medicine</Text>
                        </View>
                        <TouchableOpacity 
                          onPress={() => setShowResult(false)}
                          className="bg-indigo-100 px-3 py-1 rounded-full self-start"
                        >
                          <Text className="text-primary font-black text-[10px]">RESET / EDIT</Text>
                        </TouchableOpacity>
                      </View>
                      <View className="items-end">
                        <Text className="text-4xl font-black text-gray-900">₹{estimatedData?.price || 85}</Text>
                        <Text className="text-gray-400 font-bold text-[10px] uppercase">Final Price</Text>
                      </View>
                    </View>

                    <View className="mb-10">
                      <Text className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest text-center">Relay Visualization</Text>
                      <View className="flex-row items-center justify-between px-4">
                        <View className="items-center">
                          <View className="w-12 h-12 bg-primary rounded-full items-center justify-center border-4 border-white shadow-md">
                            <Text className="text-white font-black">YOU</Text>
                          </View>
                        </View>
                        <View className="flex-1 h-1 bg-indigo-100 mx-1 rounded-full overflow-hidden">
                           <View className="w-1/2 h-full bg-primary" />
                        </View>
                        <View className="items-center">
                          <View className="w-10 h-10 bg-white border-2 border-indigo-100 rounded-full items-center justify-center shadow-sm">
                            <Text className="text-primary font-black text-[10px]">A</Text>
                          </View>
                        </View>
                        <View className="flex-1 h-1 bg-indigo-100 mx-1 rounded-full" />
                        <View className="items-center">
                          <View className="w-10 h-10 bg-white border-2 border-indigo-100 rounded-full items-center justify-center shadow-sm">
                            <Text className="text-primary font-black text-[10px]">B</Text>
                          </View>
                        </View>
                        <View className="flex-1 h-1 bg-indigo-100 mx-1 rounded-full" />
                        <View className="items-center">
                          <View className="w-12 h-12 bg-emerald-500 rounded-full items-center justify-center border-4 border-white shadow-md">
                            <CheckCircle2 size={24} color="white" />
                          </View>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        onPress={() => setPaymentMethod('online')}
                        className={`flex-1 flex-row items-center p-4 rounded-[20px] border-2 ${paymentMethod === 'online' ? 'border-primary bg-white' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <CreditCard size={18} color={paymentMethod === 'online' ? '#6366f1' : '#9ca3af'} />
                        <Text className={`ml-2 font-bold ${paymentMethod === 'online' ? 'text-gray-900' : 'text-gray-400'}`}>Online</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setPaymentMethod('cod')}
                        className={`flex-1 flex-row items-center p-4 rounded-[20px] border-2 ${paymentMethod === 'cod' ? 'border-primary bg-white' : 'border-gray-50 bg-gray-50'}`}
                      >
                        <Banknote size={18} color={paymentMethod === 'cod' ? '#6366f1' : '#9ca3af'} />
                        <Text className={`ml-2 font-bold ${paymentMethod === 'cod' ? 'text-gray-900' : 'text-gray-400'}`}>COD</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </Card>

                <Button
                  title="Confirm & Book"
                  loading={createParcelMutation.isPending}
                  onPress={async () => {
                    try {
                      const res = await createParcelMutation.mutateAsync({
                        description: request || 'Package',
                        receiverName: 'Test Receiver',
                        receiverPhone: '+919999999999',
                        pickupAddress: pickup,
                        pickupLat: 19.07,
                        pickupLng: 72.87,
                        dropAddress: drop || 'Test Drop Address',
                        dropLat: 19.10,
                        dropLng: 72.90,
                        itemCategory: 'other',
                        urgency: urgency === 'emergency' ? 'CRITICAL' : urgency === 'fast' ? 'HIGH' : 'MEDIUM',
                        estimatedSize: 'small',
                      });
                      
                      setActiveOrder({
                        id: res.data?.parcel?._id || 'mock-id-123',
                        type: request || 'Medicine Box',
                        from: pickup,
                        to: drop,
                        earnings: estimatedData?.price?.toString() || '85',
                        match: '100',
                        detour: '1',
                        urgency: urgency === 'emergency' ? 'Urgent' : urgency === 'fast' ? 'Fast' : 'Normal',
                        urgencyColor: urgency === 'emergency' ? 'text-rose-500 bg-rose-50' : 'text-indigo-500 bg-indigo-50'
                      });
                      navigation.navigate('Tracking');
                    } catch (error) {
                      console.error('Create Parcel Error', error);
                      // Fallback navigation
                      navigation.navigate('Tracking');
                    }
                  }}
                  className="mb-10 h-18 shadow-indigo-300"
                  icon={<CheckCircle2 size={24} color="white" />}
                />
              </View>
            )}
            <View className="h-20" />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
