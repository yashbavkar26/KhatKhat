import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, Alert, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Camera, ShieldCheck, MapPin, CheckCircle2, ChevronRight, Phone, AlertCircle, RefreshCw, Navigation, Banknote, Clock } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useParcel } from '../../hooks/queries/useParcels';
import { useConfirmPickup, useConfirmDelivery, useGeneratePickupOtp, useSendDeliveryOtp } from '../../hooks/queries/useCarriers';
import { useSocket } from '../../hooks/useSocket';
import { navigateFromRoot } from '../../navigation/navigationRef';

type DeliveryStep = 'PICKUP_ARRIVED' | 'PICKUP_OTP' | 'PICKUP_PHOTO' | 'IN_TRANSIT' | 'DROP_ARRIVED' | 'DROP_VERIFY' | 'DROP_OTP' | 'COD_PAYMENT' | 'DELIVERY_SUCCESS' | 'COMPLETED';

export const ActiveDeliveryScreen = ({ navigation }: any) => {
  const { activeOrder, setActiveOrder } = useAppContext();
  const [step, setStep] = useState<DeliveryStep>('PICKUP_ARRIVED');
  const [otp, setOtp] = useState('');
  const [isCOD, setIsCOD] = useState(true);

  const { data: parcelResponse } = useParcel(activeOrder?.id, { enabled: !!activeOrder?.id });
  const parcel = parcelResponse?.data?.parcel;
  
  const confirmPickupMutation = useConfirmPickup();
  const confirmDeliveryMutation = useConfirmDelivery();
  const generatePickupOtpMutation = useGeneratePickupOtp();
  const sendDeliveryOtpMutation = useSendDeliveryOtp();
  const { pingLocation, joinParcel } = useSocket();

  const [pickedImageUrl, setPickedImageUrl] = useState<string | null>(null);

  // Join parcel socket room so the server knows this carrier's socket session
  useEffect(() => {
    if (activeOrder?.id) {
      joinParcel(activeOrder.id);
    }
  }, [activeOrder?.id, joinParcel]);

  // Real GPS location pinging to backend via Socket.io
  useEffect(() => {
    let watchId: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        watchId = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 8000, distanceInterval: 20 },
          (location) => {
            pingLocation(location.coords.latitude, location.coords.longitude);
          }
        );
      } catch (err) {
        console.error('Location tracking error:', err);
      }
    };

    startTracking();
    return () => {
      if (watchId) watchId.remove();
    };
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
      default:
        navigateFromRoot('Jobs');
        break;
    }
  };

  const renderStepUI = () => {
    switch (step) {
      case 'PICKUP_ARRIVED':
        return (
          <View>
            <Text className="text-2xl font-black text-gray-900 mb-2">Collect Parcel</Text>
            <Text className="text-gray-500 font-medium mb-8">Arrive at the pickup location to collect the parcel.</Text>
            <View style={{ marginBottom: 12 }}>
              <Button title="Open in Maps" onPress={() => {
                const lat = parcel?.pickupLat; const lng = parcel?.pickupLng;
                const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                Linking.openURL(mapsUrl).catch(() => null);
              }} className="h-14 mb-3" />
              <Button title="Arrived at Pickup" onPress={async () => {
                if (!activeOrder?.id) return nextStep();
                try {
                  await generatePickupOtpMutation.mutateAsync(activeOrder.id);
                } catch (e) {
                  console.warn('Failed to generate pickup OTP', e);
                }
                nextStep();
              }} className="h-16 shadow-indigo-200" />
            </View>
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
                    Alert.alert('Invalid OTP', 'Please enter the correct pickup OTP and try again.');
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
              onPress={async () => {
                const perm = await ImagePicker.requestCameraPermissionsAsync();
                if (!perm.granted) { Alert.alert('Camera required', 'Please allow camera access'); return; }
                const result = await ImagePicker.launchCameraAsync({ base64: false, quality: 0.7 });

                // Support both old and new result shapes
                // Old: { cancelled: boolean, uri: string }
                // New: { canceled: boolean, assets: [{ uri }] }
                try {
                  const cancelled = (result as any).cancelled === true || (result as any).canceled === true;
                  const localUri = (result as any).uri || ((result as any).assets && (result as any).assets[0] && (result as any).assets[0].uri);

                  if (!cancelled && typeof localUri === 'string' && localUri.length > 0) {
                    if (typeof localUri === 'string' && localUri.length > 0) {
                      setPickedImageUrl(localUri);
                    }
                    Alert.alert('Captured', 'Photo captured for on-screen proof only. It is not stored.');
                  } else {
                    Alert.alert('No photo', 'No photo was captured.');
                  }
                } catch (e) {
                  console.error('Capture failed', e);
                  Alert.alert('Capture failed', 'Could not capture photo');
                }
              }}
              className="bg-indigo-50 h-56 rounded-[32px] items-center justify-center border-4 border-dashed border-indigo-200 mb-8"
            >
              <View className="bg-white w-20 h-20 rounded-full items-center justify-center shadow-md">
                <Camera size={40} color="#6366f1" />
              </View>
              <Text className="text-primary font-black mt-4 uppercase tracking-tighter">Tap to Capture</Text>
            </TouchableOpacity>
            <Button title="Captured & Picked" onPress={() => { nextStep(); }} className="h-16" />
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
              <Image
                source={{
                  uri:
                    pickedImageUrl ||
                    parcel?.pickupPhotoUrl ||
                    parcel?.sealPhotoUrl ||
                    'https://images.unsplash.com/photo-1566933267353-c44424614e3d?auto=format&fit=crop&q=80&w=600',
                }}
                className="w-full h-64"
              />
            </Card>
            <Button title="Show Proof & Send OTP" onPress={async () => {
              if (activeOrder?.id) {
                try {
                  await sendDeliveryOtpMutation.mutateAsync(activeOrder.id);
                  Alert.alert('OTP Sent', 'Delivery OTP sent to customer via Twilio. Ask customer for the code.');
                } catch (e) {
                  console.warn('Failed to send delivery OTP', e);
                  Alert.alert('Failed', 'Could not send delivery OTP. Please try again.');
                  return;
                }
              }
              setOtp('');
              setStep('DROP_VERIFY');
            }} className="h-16" />
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
              <TextInput
                className="absolute opacity-0 w-full h-full"
                keyboardType="number-pad"
                maxLength={4}
                value={otp}
                onChangeText={(val) => setOtp(val)}
              />
            </View>
            <Button 
              title="Confirm Delivery OTP" 
              loading={confirmDeliveryMutation.isPending}
              onPress={async () => {
                if (otp.length !== 4) {
                  Alert.alert('Enter OTP', 'Please enter the 4-digit delivery OTP.');
                  return;
                }
                if (activeOrder?.id) {
                  try {
                    await confirmDeliveryMutation.mutateAsync({ id: activeOrder.id, otp });
                    setStep('DELIVERY_SUCCESS');
                    return;
                  } catch (e) {
                    console.error('Drop OTP failed', e);
                    Alert.alert('Invalid OTP', 'Please enter the correct delivery OTP and try again.');
                  }
                } else {
                  nextStep();
                }
              }} 
              className="h-16 shadow-indigo-200" 
            />
          </View>
        );
      case 'DELIVERY_SUCCESS':
        return (
          <View className="items-center py-10">
            <LinearGradient colors={['#10b981', '#059669']} className="w-28 h-28 rounded-full items-center justify-center mb-8 shadow-xl shadow-emerald-200">
              <CheckCircle2 size={56} color="white" />
            </LinearGradient>
            <Text className="text-3xl font-black text-gray-900 mb-3">Delivered Successfully</Text>
            <Text className="text-gray-500 font-medium text-center mb-12 px-6">
              Delivery completed and verified with OTP.
            </Text>
            <Button
              title="Go Home"
              onPress={() => {
                setActiveOrder(null);
                navigateFromRoot('Jobs');
              }}
              className="w-full h-18 shadow-emerald-200"
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
                navigateFromRoot('Jobs');
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
            latitude: parcel?.pickupLat ?? 15.2993,
            longitude: parcel?.pickupLng ?? 74.1240,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <Marker coordinate={{ latitude: parcel?.pickupLat ?? 15.2993, longitude: parcel?.pickupLng ?? 74.1240 }} title="Pickup">
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
