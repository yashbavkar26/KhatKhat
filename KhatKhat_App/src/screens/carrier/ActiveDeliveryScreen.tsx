import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Camera, ShieldCheck, MapPin, CheckCircle2, ChevronRight, Phone, AlertCircle, RefreshCw, Navigation, Banknote, Clock } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useParcel } from '../../hooks/queries/useParcels';
import { useConfirmPickup, useConfirmDelivery } from '../../hooks/queries/useCarriers';
import { useSocket } from '../../hooks/useSocket';

type DeliveryStep = 'PICKUP_ARRIVED' | 'PICKUP_OTP' | 'PICKUP_PHOTO' | 'IN_TRANSIT' | 'DROP_ARRIVED' | 'DROP_VERIFY' | 'DROP_OTP' | 'COD_PAYMENT' | 'COMPLETED';

export const ActiveDeliveryScreen = ({ navigation }: any) => {
  const { activeOrder, setActiveOrder } = useAppContext();
  const [step, setStep] = useState<DeliveryStep>('PICKUP_ARRIVED');
  const [otp, setOtp] = useState('');
  const [isCOD, setIsCOD] = useState(true);

  const { data: parcelResponse } = useParcel(activeOrder?.id, { enabled: !!activeOrder?.id });
  const parcel = parcelResponse?.data?.parcel;
  
  const confirmPickupMutation = useConfirmPickup();
  const confirmDeliveryMutation = useConfirmDelivery();
  const { pingLocation } = useSocket();

  React.useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live carrier movement pings
      pingLocation(19.0760, 72.8777);
    }, 10000);
    return () => clearInterval(interval);
  }, [pingLocation]);

  const nextStep = () => {
    switch (step) {
      case 'PICKUP_ARRIVED': setStep('PICKUP_OTP'); break;
      case 'PICKUP_OTP': setStep('PICKUP_PHOTO'); break;
      case 'PICKUP_PHOTO': setStep('IN_TRANSIT'); break;
      case 'IN_TRANSIT': setStep('DROP_ARRIVED'); break;
      case 'DROP_ARRIVED': setStep('DROP_VERIFY'); break;
      case 'DROP_VERIFY': setStep('DROP_OTP'); break;
      case 'DROP_OTP': isCOD ? setStep('COD_PAYMENT') : setStep('COMPLETED'); break;
      case 'COD_PAYMENT': setStep('COMPLETED'); break;
      default: navigation.navigate('Jobs'); break;
    }
  };

  const renderStepUI = () => {
    switch (step) {
      case 'PICKUP_ARRIVED':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Collect Parcel</Text>
            <Text className="text-gray-500 font-medium mb-8">Arrive at Andheri West to collect 'Medical Supplies'.</Text>
            <Button title="Arrived at Pickup" onPress={nextStep} className="h-16 shadow-indigo-200" />
          </View>
        );
      case 'PICKUP_OTP':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Verify Sender</Text>
            <Text className="text-gray-500 font-medium mb-10">Enter the 4-digit code provided by the sender.</Text>
            <View className="flex-row justify-between mb-10">
              {[0, 1, 2, 3].map(i => (
                <View key={i} className="w-16 h-20 bg-gray-50 border-2 border-gray-100 rounded-2xl items-center justify-center shadow-sm">
                  <Text className="text-3xl font-black text-gray-900">{otp[i] || ''}</Text>
                  {!otp[i] && <View className="w-6 h-1 bg-gray-200 rounded-full" />}
                </View>
              ))}
              <TextInput
                className="absolute opacity-0 w-full h-full"
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={(val) => { setOtp(val); if (val.length === 4) setOtp(val); }}
                autoFocus
              />
            </View>
            <Button 
              title="Verify OTP" 
              loading={confirmPickupMutation.isPending}
              onPress={async () => {
                if (activeOrder?.id) {
                  try {
                    await confirmPickupMutation.mutateAsync({ id: activeOrder.id, otp });
                    nextStep();
                  } catch (e) {
                    console.error('OTP failed', e);
                    nextStep(); // Fallback for demo
                  }
                } else {
                  nextStep();
                }
              }} 
              disabled={otp.length < 4} 
              className="h-16" 
            />
          </View>
        );
      case 'PICKUP_PHOTO':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Parcel Image</Text>
            <Text className="text-gray-500 font-medium mb-8">Take a clear photo of the parcel for customer verification.</Text>
            <TouchableOpacity 
              onPress={nextStep}
              className="bg-indigo-50 h-56 rounded-[32px] items-center justify-center border-4 border-dashed border-indigo-200 mb-8"
            >
              <View className="bg-white w-20 h-20 rounded-full items-center justify-center shadow-md">
                <Camera size={40} color="#6366f1" />
              </View>
              <Text className="text-primary font-black mt-4 uppercase tracking-tighter">Tap to Capture</Text>
            </TouchableOpacity>
            <Button title="Upload & Picked" onPress={nextStep} className="h-16" />
          </View>
        );
      case 'IN_TRANSIT':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">On the Road</Text>
            <Text className="text-gray-500 font-medium mb-10">Destination: Bandra East (4.2 km). 12 mins remaining.</Text>
            <View className="flex-row space-x-4">
              <Button title="Relay Handoff" variant="outline" onPress={() => Alert.alert("Relay Handoff", "Searching for next carrier...")} className="flex-1 h-16" icon={<RefreshCw size={20} color="#6366f1" />} />
              <Button title="Arrived at Drop" onPress={nextStep} className="flex-[1.5] h-16 shadow-indigo-200" icon={<Navigation size={20} color="white" />} />
            </View>
          </View>
        );
      case 'DROP_ARRIVED':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">At Receiver</Text>
            <Text className="text-gray-500 font-medium mb-10">Show the parcel image to the receiver for confirmation.</Text>
            <Card className="p-0 overflow-hidden mb-10 rounded-[32px] border-4 border-indigo-50 shadow-xl">
              <Image source={{ uri: 'https://images.unsplash.com/photo-1566933267353-c44424614e3d?auto=format&fit=crop&q=80&w=600' }} className="w-full h-64" />
            </Card>
            <Button title="Show Proof" onPress={nextStep} className="h-16" />
          </View>
        );
      case 'DROP_VERIFY':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Verify Receiver</Text>
            <Text className="text-gray-500 font-medium mb-10">Enter the 4-digit code provided by the receiver.</Text>
            <View className="flex-row justify-between mb-10">
              {[0, 1, 2, 3].map(i => (
                <View key={i} className="w-16 h-20 bg-gray-50 border-2 border-gray-100 rounded-2xl items-center justify-center shadow-sm">
                  <Text className="text-3xl font-black text-gray-900">{otp[i] || ''}</Text>
                </View>
              ))}
            </View>
            <Button 
              title="Confirm Delivery OTP" 
              loading={confirmDeliveryMutation.isPending}
              onPress={async () => {
                if (activeOrder?.id) {
                  try {
                    await confirmDeliveryMutation.mutateAsync({ id: activeOrder.id, otp });
                    nextStep();
                  } catch (e) {
                    console.error('Drop OTP failed', e);
                    nextStep(); // Fallback for demo
                  }
                } else {
                  nextStep();
                }
              }} 
              className="h-16 shadow-indigo-200" 
            />
          </View>
        );
      case 'COD_PAYMENT':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Collect Cash</Text>
            <Card className="bg-amber-50 p-8 rounded-[32px] mb-10 border-2 border-amber-200 shadow-lg">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-amber-800 font-black text-sm uppercase tracking-widest">Amount to Collect</Text>
                <Banknote size={24} color="#b45309" />
              </View>
              <Text className="text-5xl font-black text-amber-900">₹85.00</Text>
            </Card>
            <Button title="Cash Collected" onPress={nextStep} className="h-16 bg-amber-500 shadow-amber-200" />
          </View>
        );
      case 'COMPLETED':
        return (
          <View className="items-center py-10">
            <LinearGradient colors={['#10b981', '#059669']} className="w-28 h-28 rounded-full items-center justify-center mb-8 shadow-xl shadow-emerald-200">
              <CheckCircle2 size={56} color="white" />
            </LinearGradient>
            <Text className="text-3xl font-black text-gray-900 mb-3">Excellent Job!</Text>
            <Text className="text-gray-500 font-medium text-center mb-12 px-6">Your earnings (₹85) have been added to your wallet. You are now available for next jobs.</Text>
            <Button 
              title="Finish" 
              onPress={() => {
                setActiveOrder(null);
                navigation.navigate('Jobs');
              }} 
              className="w-full h-18 shadow-emerald-200" 
            />
          </View>
        );
    }
  };

  return (
    <View className="flex-1 bg-white">
      <View className="h-2/5 bg-gray-100">
        <MapView
          className="flex-1"
          initialRegion={{
            latitude: 19.0760,
            longitude: 72.8777,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Marker coordinate={{ latitude: 19.0760, longitude: 72.8777 }}>
             <View className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-2xl border-2 border-primary">
                <Navigation size={24} color="#6366f1" />
             </View>
          </Marker>
        </MapView>
        <SafeAreaView className="absolute top-4 left-6">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-white/90 w-14 h-14 rounded-2xl items-center justify-center shadow-lg backdrop-blur-md border border-white"
          >
            <Phone size={24} color="#6366f1" />
          </TouchableOpacity>
        </SafeAreaView>
      </View>

      <View className="flex-1 bg-white -mt-12 rounded-t-[56px] px-10 pt-10 shadow-2xl border-t border-indigo-50">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-10">
            <View className="bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
              <Text className="text-primary font-black text-[10px] uppercase tracking-widest">ACTIVE JOB #1293</Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={18} color="#9ca3af" />
              <Text className="ml-2 text-gray-400 text-sm font-black uppercase">12 MINS</Text>
            </View>
          </View>

          {renderStepUI()}
          
          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
};
