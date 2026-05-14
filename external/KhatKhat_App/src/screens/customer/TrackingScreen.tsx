import React, { useState, useRef } from 'react';
import { View, Text, Dimensions, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Phone, MessageSquare, ShieldCheck, ChevronUp, ChevronDown, Camera, AlertCircle, Clock, MapPin } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export const TrackingScreen = ({ navigation }: any) => {
  const [expanded, setExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

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

  const pickupCoords = { latitude: 19.0760, longitude: 72.8777 };
  const dropCoords = { latitude: 19.1136, longitude: 72.8697 };
  const carrierCoords = { latitude: 19.0900, longitude: 72.8750 };

  return (
    <View className="flex-1 bg-white">
      <MapView
        className="flex-1"
        initialRegion={{
          latitude: 19.0948,
          longitude: 72.8737,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        style={{ width: '100%', height: '100%' }}
      >
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
        <Marker coordinate={carrierCoords} title="Agent">
          <View className="w-12 h-12 bg-white rounded-full items-center justify-center border-2 border-primary shadow-2xl">
            <View className="w-10 h-10 bg-primary rounded-full items-center justify-center">
              <ShieldCheck size={24} color="white" />
            </View>
          </View>
        </Marker>
        <Polyline
          coordinates={[pickupCoords, carrierCoords, dropCoords]}
          strokeColor="#6366f1"
          strokeWidth={4}
          lineDashPattern={[10, 10]}
        />
      </MapView>

      <Animated.View 
        style={{ height: cardHeight, elevation: 30 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[48px] shadow-2xl overflow-hidden"
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={toggleExpand}
          className="w-full items-center pt-5 pb-2"
        >
          <View className="w-16 h-1.5 bg-gray-100 rounded-full mb-3" />
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">
            {expanded ? 'HIDE DETAILS' : 'LIVE STATUS'}
          </Text>
        </TouchableOpacity>

        <ScrollView className="px-8" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between mb-10 mt-4">
            <View className="flex-row items-center">
              <View className="w-18 h-18 bg-gray-100 rounded-[24px] overflow-hidden mr-5 border-4 border-indigo-50">
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150' }} 
                  className="w-full h-full"
                />
              </View>
              <View>
                <Text className="text-2xl font-black text-gray-900">Rahul Agent</Text>
                <View className="flex-row items-center bg-emerald-50 px-3 py-1 rounded-full self-start mt-2 border border-emerald-100">
                  <Text className="text-[10px] font-black text-emerald-600">TRUST SCORE ⭐ 98</Text>
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
                { status: 'Pickup', time: '10:15 AM', done: true, current: false, color: '#6366f1' },
                { status: 'In Transit', time: '10:25 AM', done: true, current: true, color: '#f59e0b' },
                { status: 'Relay Chain', time: 'Pending', done: false, current: false, color: '#9ca3af' },
                { status: 'Delivered', time: 'Expected 11:00 AM', done: false, current: false, color: '#10b981' }
              ].map((step, idx, arr) => (
                <View key={idx} className="flex-row h-20">
                  <View className="items-center mr-6">
                    <View className={`w-6 h-6 rounded-full z-10 border-4 border-white shadow-md ${step.done ? (step.current ? 'bg-amber-400' : 'bg-primary') : 'bg-gray-100'}`} />
                    {idx < arr.length - 1 && <View className={`w-1 flex-1 ${step.done ? 'bg-primary/20' : 'bg-gray-50'}`} />}
                  </View>
                  <View>
                    <Text className={`text-lg font-black ${step.done ? 'text-gray-900' : 'text-gray-300'}`}>{step.status}</Text>
                    <Text className={`text-xs font-bold ${step.done ? 'text-gray-400' : 'text-gray-200'}`}>{step.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mb-10">
            <Text className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Parcel Proof</Text>
            <Card className="p-0 overflow-hidden bg-gray-50 border-2 border-indigo-50">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1566933267353-c44424614e3d?auto=format&fit=crop&q=80&w=600' }} 
                className="w-full h-64"
                resizeMode="cover"
              />
              <LinearGradient colors={['rgba(255,255,255,0)', 'white']} className="absolute bottom-0 left-0 right-0 p-6 flex-row items-center justify-between">
                <View className="flex-row items-center bg-white/90 px-3 py-1.5 rounded-full">
                  <Camera size={16} color="#6366f1" />
                  <Text className="ml-2 text-primary font-black text-[10px]">VERIFIED AT PICKUP</Text>
                </View>
                <Text className="text-[10px] font-black text-gray-400">10:15 AM</Text>
              </LinearGradient>
            </Card>
          </View>

          <Button 
            title="Report Issue" 
            variant="outline" 
            onPress={() => {}}
            className="mb-14"
            icon={<AlertCircle size={24} color="#6366f1" />}
          />
          <View className="h-10" />
        </ScrollView>
      </Animated.View>
    </View>
  );
};
