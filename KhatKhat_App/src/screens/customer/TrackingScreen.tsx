import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Phone, MessageSquare, ShieldCheck, Camera, AlertCircle, MapPin } from 'lucide-react-native';
import { useParcel } from '../../hooks/queries/useParcels';
import { useSocket } from '../../hooks/useSocket';
import { useAppContext } from '../../context/AppContext';

const { height } = Dimensions.get('window');

export const TrackingScreen = ({ navigation }: any) => {
  const { activeOrder } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [carrierLiveCoords, setCarrierLiveCoords] = useState<any>(null);
  const [visiblePickupOtp, setVisiblePickupOtp] = useState<string | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  const { data: parcelResponse, isLoading, refetch } = useParcel(activeOrder?.id, { enabled: !!activeOrder?.id });
  const parcel = parcelResponse?.data?.parcel;
  const { socket, joinParcel } = useSocket();

  React.useEffect(() => {
    if (!activeOrder?.id || !socket) return;

    joinParcel(activeOrder.id);

    const handleLocationUpdate = (data: any) => {
      if (typeof data?.lat !== 'number' || typeof data?.lng !== 'number') return;
      if (data?.parcelId && data.parcelId !== activeOrder.id) return;
      setCarrierLiveCoords({ latitude: data.lat, longitude: data.lng });
    };

    const handleCarrierAssigned = (data: any) => {
      if (data?.pickupOtp) setVisiblePickupOtp(data.pickupOtp);
      refetch();
    };

    const handlePickupOtpGenerated = (data: any) => {
      if (data?.pickupOtp) setVisiblePickupOtp(data.pickupOtp);
      refetch();
    };

    socket.on('carrier:location_update', handleLocationUpdate);
    socket.on('parcel:carrier_assigned', handleCarrierAssigned);
    socket.on('parcel:pickup_otp_generated', handlePickupOtpGenerated);

    return () => {
      socket.off('carrier:location_update', handleLocationUpdate);
      socket.off('parcel:carrier_assigned', handleCarrierAssigned);
      socket.off('parcel:pickup_otp_generated', handlePickupOtpGenerated);
    };
  }, [activeOrder?.id, socket, joinParcel, refetch]);

  React.useEffect(() => {
    if (parcel?.pickupOtp) setVisiblePickupOtp(parcel.pickupOtp);
  }, [parcel?.pickupOtp]);

  React.useEffect(() => {
    if (!activeOrder?.id) return;
    const t = setInterval(() => refetch(), 8000);
    return () => clearInterval(t);
  }, [activeOrder?.id, refetch]);

  const toggleExpand = () => {
    Animated.spring(animation, {
      toValue: expanded ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
    setExpanded(!expanded);
  };

  const cardHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [320, height * 0.75],
  });

  const pickupCoords = parcel?.pickupLat
    ? { latitude: parcel.pickupLat, longitude: parcel.pickupLng }
    : activeOrder?.pickupLat
      ? { latitude: activeOrder.pickupLat, longitude: activeOrder.pickupLng }
      : { latitude: 15.2993, longitude: 74.1240 };

  const dropCoords = parcel?.dropLat
    ? { latitude: parcel.dropLat, longitude: parcel.dropLng }
    : activeOrder?.dropLat
      ? { latitude: activeOrder.dropLat, longitude: activeOrder.dropLng }
      : { latitude: 15.31, longitude: 74.13 };

  const hasAssignedCarrier = Boolean(parcel?.carrier1Id || parcel?.carrier2Id);
  const carrierCoords = carrierLiveCoords || (hasAssignedCarrier ? pickupCoords : null);

  const mapRegion = useMemo(() => {
    const minLat = Math.min(pickupCoords.latitude, dropCoords.latitude);
    const maxLat = Math.max(pickupCoords.latitude, dropCoords.latitude);
    const minLng = Math.min(pickupCoords.longitude, dropCoords.longitude);
    const maxLng = Math.max(pickupCoords.longitude, dropCoords.longitude);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.8 + 0.02),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.8 + 0.02),
    };
  }, [pickupCoords, dropCoords]);

  if (!activeOrder?.id) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500 font-bold">No active order to track.</Text>
      </View>
    );
  }

  if (isLoading || !parcel) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="mt-3 text-gray-500 font-semibold">Loading tracking details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <MapView className="flex-1" region={mapRegion} style={{ width: '100%', height: '100%' }}>
        <Marker coordinate={pickupCoords} title="Pickup">
          <View className="w-10 h-10 bg-indigo-500 rounded-full items-center justify-center border-4 border-white shadow-lg">
            <MapPin size={16} color="white" />
          </View>
        </Marker>
        <Marker coordinate={dropCoords} title="Drop">
          <View className="w-10 h-10 bg-emerald-500 rounded-full items-center justify-center border-4 border-white shadow-lg">
            <MapPin size={16} color="white" />
          </View>
        </Marker>
        {carrierCoords && (
          <Marker coordinate={carrierCoords} title="Agent">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center border-2 border-primary shadow-2xl">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
                <ShieldCheck size={24} color="white" />
              </View>
            </View>
          </Marker>
        )}
        <Polyline
          coordinates={carrierCoords ? [pickupCoords, carrierCoords, dropCoords] : [pickupCoords, dropCoords]}
          strokeColor="#6366f1"
          strokeWidth={4}
          lineDashPattern={[10, 10]}
        />
      </MapView>

      <Animated.View style={{ height: cardHeight, elevation: 30 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-2xl overflow-hidden">
        <TouchableOpacity activeOpacity={1} onPress={toggleExpand} className="w-full items-center pt-5 pb-2">
          <View className="w-16 h-1.5 bg-gray-100 rounded-full mb-3" />
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">{expanded ? 'HIDE DETAILS' : 'LIVE STATUS'}</Text>
        </TouchableOpacity>

        <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-10 mt-4">
            <View className="flex-row items-center">
              <View className="w-18 h-18 bg-gray-100 rounded-[24px] overflow-hidden mr-5 border-4 border-indigo-50">
                <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' }} className="w-full h-full" />
              </View>
              <View>
                <Text className="text-2xl font-black text-gray-900">{hasAssignedCarrier ? (parcel?.carrier1Name || 'Assigned Agent') : 'Searching...'}</Text>
                {(visiblePickupOtp || parcel?.pickupOtp) && parcel?.status !== 'PICKED_UP' && parcel?.status !== 'DELIVERED' && (
                  <Text className="text-sm font-black text-indigo-600 mt-1">
                    Pickup OTP: {visiblePickupOtp || parcel?.pickupOtp}
                  </Text>
                )}
                <View className="flex-row items-center bg-emerald-50 px-3 py-1 rounded-full self-start mt-2 border border-emerald-100">
                  <Text className="text-[10px] font-black text-emerald-600">STATUS • {parcel?.status || 'MATCHING'}</Text>
                </View>
              </View>
            </View>
            <View className="flex-row">
              <TouchableOpacity className="w-14 h-14 bg-indigo-50 rounded-[20px] items-center justify-center mr-3 border border-indigo-100 shadow-sm">
                <Phone size={24} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 bg-indigo-50 rounded-[20px] items-center justify-center border border-indigo-100 shadow-sm">
                <MessageSquare size={24} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-10">
            <Text className="text-lg font-black text-gray-900 mb-8 uppercase tracking-tight">Timeline</Text>
            <View>
              {[
                { status: 'Carrier Assigned', done: hasAssignedCarrier },
                { status: 'Pickup Verified (OTP)', done: ['PICKED_UP', 'IN_RELAY', 'DELIVERED'].includes(parcel?.status) },
                { status: 'In Transit', done: ['IN_RELAY', 'DELIVERED'].includes(parcel?.status) },
                { status: 'Delivered', done: parcel?.status === 'DELIVERED' },
              ].map((step, idx, arr) => (
                <View key={idx} className="flex-row h-20">
                  <View className="items-center mr-6">
                    <View className={`w-6 h-6 rounded-full z-10 border-4 border-white shadow-md ${step.done ? 'bg-primary' : 'bg-gray-100'}`} />
                    {idx < arr.length - 1 && <View className={`w-1 flex-1 ${step.done ? 'bg-primary/20' : 'bg-gray-50'}`} />}
                  </View>
                  <View>
                    <Text className={`text-lg font-black ${step.done ? 'text-gray-900' : 'text-gray-300'}`}>{step.status}</Text>
                    <Text className={`text-xs font-bold ${step.done ? 'text-gray-400' : 'text-gray-200'}`}>{step.done ? 'Done' : 'Pending'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {(visiblePickupOtp || parcel?.pickupOtp) && parcel?.status !== 'PICKED_UP' && parcel?.status !== 'DELIVERED' && (
            <View className="mb-10 overflow-hidden rounded-[24px] border border-indigo-200 shadow-lg">
              <LinearGradient colors={['#eef2ff', '#ffffff']} className="p-5">
                <Text className="text-[10px] text-indigo-500 uppercase font-black tracking-[3px]">Pickup OTP</Text>
                <Text className="text-4xl font-black text-indigo-700 mt-2 tracking-[6px]">{visiblePickupOtp || parcel?.pickupOtp}</Text>
                <Text className="text-xs text-gray-500 mt-2 leading-5">Share this code with the delivery partner at pickup.</Text>
              </LinearGradient>
            </View>
          )}

          {parcel?.deliveryOtp && parcel?.status !== 'DELIVERED' && (
            <View className="mb-10 overflow-hidden rounded-[24px] border border-emerald-200 shadow-lg">
              <LinearGradient colors={['#ecfdf5', '#ffffff']} className="p-5">
                <Text className="text-[10px] text-emerald-600 uppercase font-black tracking-[3px]">Delivery OTP</Text>
                <Text className="text-4xl font-black text-emerald-700 mt-2 tracking-[6px]">{parcel.deliveryOtp}</Text>
                <Text className="text-xs text-gray-500 mt-2 leading-5">
                  Share this code with the delivery partner only at drop-off confirmation.
                </Text>
              </LinearGradient>
            </View>
          )}

          <View className="mb-10">
            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Parcel Proof</Text>
            <Card className="p-0 overflow-hidden bg-gray-50 border-2 border-indigo-50">
              <Image source={{ uri: 'https://images.unsplash.com/photo-1566933267353-c44424614e3d?auto=format&fit=crop&q=80&w=600' }} className="w-full h-64" resizeMode="cover" />
              <LinearGradient colors={['rgba(255,255,255,0)', 'white']} className="absolute bottom-0 left-0 right-0 p-6 flex-row items-center justify-between">
                <View className="flex-row items-center bg-white/90 px-3 py-1.5 rounded-full">
                  <Camera size={16} color="#6366f1" />
                  <Text className="ml-2 text-primary font-black text-[10px]">VERIFIED AT PICKUP</Text>
                </View>
                <Text className="text-[10px] font-black text-gray-400">{parcel?.status || 'MATCHING'}</Text>
              </LinearGradient>
            </Card>
          </View>

          <Button title="Report Issue" variant="outline" onPress={() => {}} className="mb-14" icon={<AlertCircle size={24} color="#6366f1" />} />
          <View className="h-10" />
        </ScrollView>
      </Animated.View>
    </View>
  );
};
