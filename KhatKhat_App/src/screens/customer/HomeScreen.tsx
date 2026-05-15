import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Animated, Dimensions, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { MapPin, Package, Zap, Clock, AlertTriangle, CheckCircle2, ChevronRight, CreditCard, Banknote, Map as MapIcon, Moon, Sun, X, Navigation } from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useEstimateParcel, useCreateParcel } from '../../hooks/queries/useParcels';
import { useClassifyParcel } from '../../hooks/queries/useAi';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const GOA_BOUNDS = { minLat: 14.89, maxLat: 15.80, minLng: 73.67, maxLng: 74.32 };
const isInsideGoa = (lat: number, lng: number) =>
  lat >= GOA_BOUNDS.minLat && lat <= GOA_BOUNDS.maxLat &&
  lng >= GOA_BOUNDS.minLng && lng <= GOA_BOUNDS.maxLng;

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
  const [analyzedCategory, setAnalyzedCategory] = useState('other');
  const [analyzedSize, setAnalyzedSize] = useState('small');

  // Payment Flow State
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Map State
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapMode, setMapMode] = useState<'pickup' | 'drop'>('pickup');
  const [mapCoordinate, setMapCoordinate] = useState({ latitude: 15.2993, longitude: 74.1240 }); // Default: Goa center
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [pickupCoords, setPickupCoords] = useState({ latitude: 15.2993, longitude: 74.1240 });
  const [dropCoords, setDropCoords] = useState({ latitude: 15.2993, longitude: 74.1240 });
  const [isPinOutsideGoa, setIsPinOutsideGoa] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const handleOpenPaymentLink = async () => {
    const amount = estimatedData?.price || 85;
    Alert.alert('Payment Link', 'A dummy payment link was generated for ₹' + amount, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Link', onPress: () => {
         setIsProcessingPayment(true);
         // Simulate opening a browser link
         Alert.alert('Simulating Link Open...', 'Browser would open the payment gateway now. Press "Simulate Success" in the app once paid.');
      }}
    ]);
  };

  const handleFinalBooking = async () => {
    setIsProcessingPayment(false);
    setIsPaymentModalVisible(false);
    
    try {
      const res = await createParcelMutation.mutateAsync({
        description: request && request.trim().length >= 10 ? request : 'Package delivery',
        receiverName: 'Test Receiver',
        receiverPhone: '+919999999999',
        pickupAddress: pickup,
        pickupLat: pickupCoords.latitude,
        pickupLng: pickupCoords.longitude,
        dropAddress: drop || 'Test Drop Address',
        dropLat: dropCoords.latitude,
        dropLng: dropCoords.longitude,
        itemCategory: analyzedCategory,
        urgency: urgency === 'emergency' ? 'CRITICAL' : urgency === 'fast' ? 'HIGH' : 'MEDIUM',
        estimatedSize: analyzedSize,
      });
      
      const parcelId = res.data?.parcel?.id || res.data?.parcel?._id;
      setActiveOrder({
        id: parcelId,
        type: request || 'Package',
        from: pickup,
        to: drop || 'Drop Location',
        pickupLat: pickupCoords.latitude,
        pickupLng: pickupCoords.longitude,
        dropLat: dropCoords.latitude,
        dropLng: dropCoords.longitude,
        earnings: estimatedData?.price?.toString() || '85',
        urgency: urgency === 'emergency' ? 'Urgent' : urgency === 'fast' ? 'Fast' : 'Normal',
        urgencyColor: urgency === 'emergency' ? 'text-rose-500 bg-rose-50' : 'text-indigo-500 bg-indigo-50',
      });
      navigation.navigate('Tracking');
    } catch (error) {
      console.error('Create Parcel Error', error);
      Alert.alert('Booking failed', 'Please check the selected locations and try again.');
    }
  };

  const openMap = async (mode: 'pickup' | 'drop') => {
    setMapMode(mode);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
      
      // Set initial pin to current location (or Goa center if outside Goa)
      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      const initialCoord = isInsideGoa(lat, lng)
        ? { latitude: lat, longitude: lng }
        : { latitude: 15.2993, longitude: 74.1240 }; // Fallback to Goa center
      setMapCoordinate(initialCoord);
      setIsPinOutsideGoa(false);
      setIsMapVisible(true);
    } catch (error) {
      console.error('Error getting location:', error);
      setMapCoordinate({ latitude: 15.2993, longitude: 74.1240 });
      setIsPinOutsideGoa(false);
      setIsMapVisible(true);
    }
  };

  const confirmLocation = async () => {
    if (isPinOutsideGoa) {
      Alert.alert('Outside Goa', 'KhatKhat only operates within Goa. Please select a location inside Goa.');
      return;
    }
    setIsMapVisible(false);
    try {
      const geocode = await Location.reverseGeocodeAsync(mapCoordinate);
      if (geocode.length > 0) {
        const addressObj = geocode[0];
        // Create a readable address string
        const parts = [
          addressObj.name,
          addressObj.street,
          addressObj.city || addressObj.subregion,
        ].filter(Boolean);
        
        const readableAddress = parts.length > 0 ? parts.join(', ') : `${mapCoordinate.latitude.toFixed(4)}, ${mapCoordinate.longitude.toFixed(4)}`;
        
        if (mapMode === 'pickup') {
          setPickup(readableAddress);
          setPickupCoords(mapCoordinate);
        } else {
          setDrop(readableAddress);
          setDropCoords(mapCoordinate);
        }
      } else {
        const fallback = `${mapCoordinate.latitude.toFixed(4)}, ${mapCoordinate.longitude.toFixed(4)}`;
        if (mapMode === 'pickup') {
          setPickup(fallback);
          setPickupCoords(mapCoordinate);
        } else {
          setDrop(fallback);
          setDropCoords(mapCoordinate);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      const fallback = `${mapCoordinate.latitude.toFixed(4)}, ${mapCoordinate.longitude.toFixed(4)}`;
      if (mapMode === 'pickup') {
        setPickup(fallback);
        setPickupCoords(mapCoordinate);
      } else {
        setDrop(fallback);
        setDropCoords(mapCoordinate);
      }
    }
  };

  const handleSearchLocation = async () => {
    const query = locationSearch.trim();
    if (!query) {
      Alert.alert('Enter location', 'Please type a location to search.');
      return;
    }
    setIsSearchingLocation(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        Alert.alert('No results', 'Could not find this location. Try a more specific place name.');
        return;
      }
      const first = results[0];
      const coord = { latitude: first.latitude, longitude: first.longitude };
      setMapCoordinate(coord);
      setIsPinOutsideGoa(!isInsideGoa(coord.latitude, coord.longitude));
    } catch (error) {
      Alert.alert('Search failed', 'Could not search this location right now.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const useCurrentLocationForPickup = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
      const geocode = await Location.reverseGeocodeAsync(coords);
      
      if (geocode.length > 0) {
        const addr = geocode[0];
        const readable = [addr.name, addr.street, addr.city || addr.subregion].filter(Boolean).join(', ');
        setPickup(readable);
      } else {
        setPickup('Current Location');
      }
      setPickupCoords(coords);
    } catch (e) {
      setPickup('Current Location');
    }
  };

  const fetchEstimate = async (category: string, size: string) => {
    try {
      const estimateRes = await estimateMutation.mutateAsync({
        pickupLat: pickupCoords.latitude,
        pickupLng: pickupCoords.longitude,
        dropLat: dropCoords.latitude,
        dropLng: dropCoords.longitude,
        urgency: urgency === 'emergency' ? 'CRITICAL' : urgency === 'fast' ? 'HIGH' : 'MEDIUM',
        itemCategory: category,
        estimatedSize: size,
      });
      setEstimatedData(estimateRes.data);
    } catch (error) {
      console.error('API Error:', error);
      setEstimatedData({ price: 85, distanceKm: 2.5, estimatedMinutes: 15 });
    }
  };

  const analyzeRequest = async () => {
    setIsAnalyzing(true);
    try {
      const classifyRes = await classifyMutation.mutateAsync(request || 'package');
      const category = classifyRes.data?.itemCategory || 'other';
      const size = classifyRes.data?.estimatedSize || 'small';
      
      setAnalyzedCategory(category);
      setAnalyzedSize(size);
      
      await fetchEstimate(category, size);
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

  useEffect(() => {
    if (showResult) {
      fetchEstimate(analyzedCategory, analyzedSize);
    }
  }, [pickupCoords, dropCoords, urgency]);

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
          <ScrollView keyboardShouldPersistTaps="handled" className="flex-1 px-6 pt-8" showsVerticalScrollIndicator={false}>
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
                  style={{ minHeight: 80, textAlignVertical: 'top' }}
                  value={request}
                  onChangeText={setRequest}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                />
              </View>

              <View className="space-y-6">
                <View>
                  <TouchableOpacity onPress={() => openMap('pickup')} className="flex-row items-center">
                    <View className="w-10 h-10 bg-indigo-50 rounded-full items-center justify-center mr-4">
                      <MapPin size={20} color="#6366f1" />
                    </View>
                    <View className="flex-1 border-b border-gray-50 pb-2">
                      <Text className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Pickup Location</Text>
                      <Text className="text-base font-bold text-gray-800 py-1" numberOfLines={1}>
                        {pickup || 'Tap to select on map'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={useCurrentLocationForPickup}
                    className="flex-row items-center mt-2 ml-14"
                  >
                    <Navigation size={12} color="#6366f1" />
                    <Text className="text-xs font-bold text-primary ml-1">Use Current Location</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => openMap('drop')} className="flex-row items-center">
                  <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mr-4">
                    <MapPin size={20} color="#10b981" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Drop Location</Text>
                    <Text className="text-base font-bold text-gray-800 py-1" numberOfLines={1}>
                      {drop || 'Tap to select destination on map'}
                    </Text>
                  </View>
                </TouchableOpacity>
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
                  title={paymentMethod === 'online' ? "Pay & Book" : "Confirm & Book"}
                  loading={createParcelMutation.isPending || isProcessingPayment}
                  onPress={async () => {
                    if (paymentMethod === 'online') {
                      setIsPaymentModalVisible(true);
                      return;
                    }
                    handleFinalBooking();
                  }}
                  className="mb-10 h-18 shadow-indigo-300"
                  icon={<CheckCircle2 size={24} color="white" />}
                />
              </View>
            )}
            <View className="h-20" />
          </ScrollView>

          {/* Payment Modal */}
          <Modal visible={isPaymentModalVisible} transparent animationType="fade">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
              <View className="bg-white w-full rounded-[32px] p-8 items-center shadow-2xl">
                <View className="w-20 h-20 bg-indigo-50 rounded-full items-center justify-center mb-6">
                  <CreditCard size={40} color="#6366f1" />
                </View>
                <Text className="text-2xl font-black text-gray-900 mb-2">KhatKhat Pay</Text>
                <Text className="text-gray-500 text-center mb-8 font-medium">Generate a secure dummy payment link to proceed with your booking.</Text>
                
                <View className="bg-gray-50 w-full p-6 rounded-2xl mb-8 border border-gray-100">
                  <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-gray-400 font-bold uppercase text-[10px]">Amount to Pay</Text>
                    <Text className="text-2xl font-black text-indigo-600">₹{estimatedData?.price || 85}</Text>
                  </View>
                  <View className="h-[1px] bg-gray-100 w-full mb-4" />
                  <Text className="text-xs text-gray-400 font-semibold mb-2">Payment Options:</Text>
                  <View className="flex-row space-x-2">
                    <View className="bg-white px-3 py-1 rounded-full border border-gray-100"><Text className="text-[10px] font-bold">UPI</Text></View>
                    <View className="bg-white px-3 py-1 rounded-full border border-gray-100"><Text className="text-[10px] font-bold">Cards</Text></View>
                    <View className="bg-white px-3 py-1 rounded-full border border-gray-100"><Text className="text-[10px] font-bold">Net Banking</Text></View>
                  </View>
                </View>

                {!isProcessingPayment ? (
                  <>
                    <TouchableOpacity 
                      onPress={handleOpenPaymentLink}
                      className="w-full bg-indigo-600 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg shadow-indigo-200"
                    >
                      <Text className="text-white font-black text-lg">Generate & Open Link</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setIsPaymentModalVisible(false)}
                      className="w-full h-12 items-center justify-center"
                    >
                      <Text className="text-gray-400 font-bold">Cancel</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <View className="items-center py-4 w-full">
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text className="mt-4 text-indigo-600 font-bold">Waiting for payment...</Text>
                    <TouchableOpacity 
                      onPress={handleFinalBooking}
                      className="mt-6 bg-emerald-500 w-full h-16 rounded-2xl items-center justify-center shadow-lg shadow-emerald-200"
                    >
                      <Text className="text-white font-black text-lg">Simulate Payment Success</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>

          {/* Map Modal */}
          <Modal visible={isMapVisible} animationType="slide" transparent={false} onRequestClose={() => setIsMapVisible(false)}>
            <View className="flex-1">
              <View className="pt-12 pb-4 px-6 bg-white flex-row items-center justify-between shadow-sm z-10">
                <Text className="text-xl font-black text-gray-900">
                  {mapMode === 'pickup' ? 'Set Pickup Location' : 'Set Drop Location'}
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsMapVisible(false)}
                  className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center"
                >
                  <X size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              
              <View className="flex-1 relative">
                <View className="absolute top-4 left-4 right-4 z-20 bg-white rounded-[16px] border border-gray-100 shadow-sm flex-row items-center px-3 py-2">
                  <TextInput
                    value={locationSearch}
                    onChangeText={setLocationSearch}
                    placeholder="Search location (e.g. Panjim, Goa)"
                    placeholderTextColor="#9ca3af"
                    className="flex-1 text-gray-900 font-semibold"
                    returnKeyType="search"
                    onSubmitEditing={handleSearchLocation}
                  />
                  <TouchableOpacity
                    onPress={handleSearchLocation}
                    disabled={isSearchingLocation}
                    className="bg-indigo-50 px-3 py-2 rounded-xl"
                  >
                    <Text className="text-primary font-black text-xs">
                      {isSearchingLocation ? '...' : 'Search'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={{
                    latitude: mapCoordinate.latitude,
                    longitude: mapCoordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  region={{
                    latitude: mapCoordinate.latitude,
                    longitude: mapCoordinate.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  onPress={(e) => {
                    const coord = e.nativeEvent.coordinate;
                    setMapCoordinate(coord);
                    setIsPinOutsideGoa(!isInsideGoa(coord.latitude, coord.longitude));
                  }}
                >
                  <Marker coordinate={mapCoordinate} />
                </MapView>
                
                <View className="absolute bottom-10 left-6 right-6">
                  {isPinOutsideGoa && (
                    <View className="bg-rose-50 border border-rose-200 p-3 rounded-[16px] mb-3 flex-row items-center">
                      <AlertTriangle size={16} color="#ef4444" />
                      <Text className="ml-2 text-rose-600 font-bold text-xs flex-1">
                        This location is outside Goa. KhatKhat only operates within Goa.
                      </Text>
                    </View>
                  )}
                  <View className="bg-white p-4 rounded-[20px] shadow-lg mb-4 flex-row items-center">
                    <MapPin size={24} color={mapMode === 'pickup' ? '#6366f1' : '#10b981'} />
                    <View className="ml-3 flex-1">
                      <Text className="text-xs font-bold text-gray-400 uppercase">Selected Coordinates</Text>
                      <Text className="text-sm font-medium text-gray-900">
                        {mapCoordinate.latitude.toFixed(4)}, {mapCoordinate.longitude.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                  
                  <Button 
                    title={isPinOutsideGoa ? 'Outside Goa — Not Allowed' : 'Confirm Location'} 
                    onPress={confirmLocation} 
                    className={isPinOutsideGoa ? 'bg-gray-300 shadow-none' : mapMode === 'pickup' ? 'shadow-indigo-300' : 'bg-emerald-500 shadow-emerald-300'}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};
