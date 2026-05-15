import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, ScrollView, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Phone, MessageSquare, ShieldCheck, Camera, AlertCircle, MapPin, Navigation } from 'lucide-react-native';
import { useParcel } from '../../hooks/queries/useParcels';
import { useSocket } from '../../hooks/useSocket';
import { useAppContext } from '../../context/AppContext';

const { height } = Dimensions.get('window');

// Verna to Margao Dummy Waypoints
const DUMMY_WAYPOINTS = [
  { latitude: 15.3747, longitude: 73.9600 }, // Verna
  { latitude: 15.3620, longitude: 73.9480 }, // Cortalim Turn
  { latitude: 15.3500, longitude: 73.9350 }, // NH-66
  { latitude: 15.3390, longitude: 73.9280 }, // Borim Bridge
  { latitude: 15.3280, longitude: 73.9300 }, // Borim
  { latitude: 15.3210, longitude: 73.9390 }, // NH Junction
  { latitude: 15.3100, longitude: 73.9420 }, // Approach Margao
  { latitude: 15.2993, longitude: 73.9862 }, // Margao Center
];

export const TrackingScreen = ({ navigation }: any) => {
  const { activeOrder } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [carrierLiveCoords, setCarrierLiveCoords] = useState<any>(null);
  const [visiblePickupOtp, setVisiblePickupOtp] = useState<string | null>(null);
  const animation = useRef(new Animated.Value(0)).current;

  // Dummy Simulation State
  const [dummyIndex, setDummyIndex] = useState(0);
  const [dummyEta, setDummyEta] = useState(18);
  const [dummyStatus, setDummyStatus] = useState('MATCHING');

  const { data: parcelResponse, isLoading, refetch } = useParcel(activeOrder?.id, { enabled: !!activeOrder?.id });
  const parcel = parcelResponse?.data?.parcel;
  const { socket, joinParcel } = useSocket();

  // REAL ORDER LOGIC
  useEffect(() => {
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

  // DUMMY SIMULATION LOGIC
  useEffect(() => {
    if (activeOrder?.id) return;

    const simulationInterval = setInterval(() => {
      setDummyIndex((prev) => {
        const next = (prev + 1) % DUMMY_WAYPOINTS.length;
        
        // Update Status based on progress
        if (next === 0) {
          setDummyStatus('MATCHING');
          setVisiblePickupOtp(null);
        } else if (next === 1) {
          setDummyStatus('CARRIER_ASSIGNED');
          setVisiblePickupOtp("4829");
        } else if (next === 2) {
          setDummyStatus('PICKED_UP');
        } else {
          setDummyStatus('IN_TRANSIT');
        }

        // Update ETA
        setDummyEta((e) => Math.max(0, e - 2));
        if (next === 0) setDummyEta(18);

        return next;
      });
    }, 3000); // Move every 3 seconds

    return () => clearInterval(simulationInterval);
  }, [activeOrder?.id]);

  useEffect(() => {
    if (parcel?.pickupOtp) setVisiblePickupOtp(parcel.pickupOtp);
  }, [parcel?.pickupOtp]);

  useEffect(() => {
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

  // Decide coords based on real vs dummy
  const pickupCoords = activeOrder?.id 
    ? (parcel?.pickupLat ? { latitude: parcel.pickupLat, longitude: parcel.pickupLng } : { latitude: activeOrder.pickupLat, longitude: activeOrder.pickupLng })
    : DUMMY_WAYPOINTS[0];

  const dropCoords = activeOrder?.id
    ? (parcel?.dropLat ? { latitude: parcel.dropLat, longitude: parcel.dropLng } : { latitude: activeOrder.dropLat, longitude: activeOrder.dropLng })
    : DUMMY_WAYPOINTS[DUMMY_WAYPOINTS.length - 1];

  const currentCarrierCoords = activeOrder?.id
    ? carrierLiveCoords || pickupCoords
    : DUMMY_WAYPOINTS[dummyIndex];

  const status = activeOrder?.id ? (parcel?.status || 'MATCHING') : dummyStatus;
  const eta = activeOrder?.id ? '15 min' : `${dummyEta} min`;
  const agentName = activeOrder?.id ? (parcel?.carrier1Name || 'Assigned Agent') : 'Ravi Kumar (Demo)';

  const mapRegion = useMemo(() => {
    const minLat = Math.min(pickupCoords.latitude, dropCoords.latitude);
    const maxLat = Math.max(pickupCoords.latitude, dropCoords.latitude);
    const minLng = Math.min(pickupCoords.longitude, dropCoords.longitude);
    const maxLng = Math.max(pickupCoords.longitude, dropCoords.longitude);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.12, (maxLat - minLat) * 1.8),
      longitudeDelta: Math.max(0.12, (maxLng - minLng) * 1.8),
    };
  }, [pickupCoords, dropCoords]);

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
        
        <Marker coordinate={currentCarrierCoords} title="Agent">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center border-2 border-primary shadow-2xl">
            <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
              <ShieldCheck size={24} color="white" />
            </View>
          </View>
        </Marker>

        <Polyline
          coordinates={DUMMY_WAYPOINTS}
          strokeColor="#6366f130"
          strokeWidth={4}
          lineDashPattern={[10, 10]}
        />
        <Polyline
          coordinates={activeOrder?.id ? [pickupCoords, currentCarrierCoords] : DUMMY_WAYPOINTS.slice(0, dummyIndex + 1)}
          strokeColor="#6366f1"
          strokeWidth={4}
        />
      </MapView>

      <Animated.View style={{ height: cardHeight, elevation: 30 }} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-2xl overflow-hidden">
        <TouchableOpacity activeOpacity={1} onPress={toggleExpand} className="w-full items-center pt-5 pb-2">
          <View className="w-16 h-1.5 bg-gray-100 rounded-full mb-3" />
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">{expanded ? 'HIDE DETAILS' : 'LIVE STATUS'}</Text>
        </TouchableOpacity>

        <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
          {/* DEBUG INFO - REMOVE AFTER TEST */}
          <View className="bg-red-50 p-2 rounded-lg mb-2">
            <Text className="text-[8px] text-red-500 font-bold">DEBUG: ID={activeOrder?.id || 'NULL'} | STATUS={status} | OTP={parcel?.pickupOtp || 'NONE'}</Text>
          </View>

          {/* Pickup OTP Card - FORCED TOP */}
          <View className="mb-6 overflow-hidden rounded-[24px] border-2 border-indigo-500 shadow-xl bg-white">
            <LinearGradient colors={['#6366f1', '#4f46e5']} className="p-5">
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-[10px] text-indigo-100 uppercase font-black">PICKUP OTP</Text>
                <ShieldCheck size={14} color="white" />
              </View>
              <Text className="text-4xl font-black text-white text-center tracking-[10px]">
                {parcel?.pickupOtp || visiblePickupOtp || "WAIT"}
              </Text>
            </LinearGradient>
          </View>

          {!activeOrder?.id && (
            <View className="bg-indigo-50 p-4 rounded-2xl mb-4 items-center">
              <Text className="text-indigo-600 font-bold text-xs uppercase">Demo Simulation Mode</Text>
              <Text className="text-indigo-400 text-[10px] text-center mt-1">Showing a live delivery agent travelling from Verna to Margao.</Text>
            </View>
          )}

          <View className="flex-row items-center justify-between mb-10 mt-4">
            <View className="flex-row items-center">
              <View className="w-18 h-18 bg-gray-100 rounded-[24px] overflow-hidden mr-5 border-4 border-indigo-50">
                <Image source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' }} className="w-full h-full" />
              </View>
              <View>
                <Text className="text-2xl font-black text-gray-900">{agentName}</Text>
                <View className="flex-row items-center bg-emerald-50 px-3 py-1 rounded-full self-start mt-2 border border-emerald-100">
                  <Text className="text-[10px] font-black text-emerald-600">STATUS • {status}</Text>
                </View>
                <Text className="text-xs font-bold text-gray-400 mt-2">ETA: {eta}</Text>
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
                { status: 'Carrier Assigned', done: status !== 'MATCHING' },
                { status: 'Pickup Verified (OTP)', done: ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(status) },
                { status: 'In Transit', done: ['IN_TRANSIT', 'DELIVERED'].includes(status) },
                { status: 'Delivered', done: status === 'DELIVERED' },
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


          <Button title="Report Issue" variant="outline" onPress={() => {}} className="mb-14" icon={<AlertCircle size={24} color="#6366f1" />} />
          <View className="h-10" />
        </ScrollView>
      </Animated.View>
    </View>
  );
};
