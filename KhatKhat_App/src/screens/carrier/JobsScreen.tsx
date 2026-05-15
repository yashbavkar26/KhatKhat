import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Animated, Alert, Dimensions, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  MapPin, Navigation, Zap, AlertCircle, Clock, ChevronRight,
  CheckCircle2, TrendingUp, Package, RefreshCw, Star,
} from 'lucide-react-native';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { useAppContext } from '../../context/AppContext';
import { useRouteJobs, useAcceptParcel } from '../../hooks/queries/useCarriers';
import { authService } from '../../api/services/auth';
import { useSocket } from '../../hooks/useSocket';
import { Linking } from 'react-native';
import { navigateFromRoot } from '../../navigation/navigationRef';

const { height } = Dimensions.get('window');

type Step = 'LOCATING' | 'SET_DESTINATION' | 'JOBS';

const URGENCY_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  CRITICAL: { label: '🚨 CRITICAL', bg: '#fff1f2', text: '#be123c', dot: '#ef4444' },
  HIGH:     { label: '⚡ HIGH',     bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  MEDIUM:   { label: '📦 MEDIUM',  bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  LOW:      { label: '🐢 LOW',     bg: '#f8fafc', text: '#64748b', dot: '#94a3b8' },
};

export const JobsScreen = ({ navigation }: any) => {
  const { setActiveOrder } = useAppContext();
  const [step, setStep] = useState<Step>('LOCATING');
  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destAddress, setDestAddress] = useState('');
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [pinCoords, setPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [assignedJob, setAssignedJob] = useState<any>(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [searchingDestination, setSearchingDestination] = useState(false);

  const { socket } = useSocket();
  const acceptMutation = useAcceptParcel();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  // Route jobs query — only fires once destination is set
  const routeParams = currentCoords && destCoords ? {
    currentLat: currentCoords.latitude,
    currentLng: currentCoords.longitude,
    destLat: destCoords.latitude,
    destLng: destCoords.longitude,
  } : null;
  const { data: jobsResponse, isLoading: jobsLoading, refetch } = useRouteJobs(routeParams);
  const jobs = (jobsResponse as any)?.data?.jobs ?? [];

  // Pulse animation while locating
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
      ])
    );
    if (step === 'LOCATING') pulse.start();
    else { pulse.stop(); pulseAnim.setValue(1); }
    return () => pulse.stop();
  }, [step]);

  // Auto-detect current GPS on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location Required', 'Please enable location permission to find jobs near you.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCurrentCoords(coords);
        setPinCoords(coords);
        setMapRegion({
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        });
        setStep('SET_DESTINATION');
      } catch (err) {
        Alert.alert('Error', 'Could not get your location. Please try again.');
      }
    })();
  }, []);

  // Listen for new job assignments
  useEffect(() => {
    if (!socket) return;

    const handleNewJob = (data: any) => {
      console.log('Received new job assignment:', data);
      Alert.alert('🎉 New Job Assigned!', `Parcel ${data.parcelId} has been assigned to you. Pickup: ${data.pickupAddress}`);
      refetch(); // Refresh job list
    };

    socket.on('parcel:new_job', handleNewJob);

    return () => {
      socket.off('parcel:new_job', handleNewJob);
    };
  }, [socket]);

  const handleConfirmDestination = async () => {
    if (!pinCoords || !currentCoords) return;
    setDestCoords(pinCoords);

    // Refresh GPS right before confirming so matching uses latest accurate carrier location.
    let latestCurrent = currentCoords;
    try {
      const latest = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      latestCurrent = { latitude: latest.coords.latitude, longitude: latest.coords.longitude };
      setCurrentCoords(latestCurrent);
    } catch (err) {
      console.warn('Could not refresh live location, using previous coordinates');
    }

    // Auto-activate carrier with current GPS so backend can match + relay location.
    try {
      await authService.toggleCarrierActive({
        isActive: true,
        lat: latestCurrent.latitude,
        lng: latestCurrent.longitude,
      });
    } catch (err) {
      // Non-fatal: carrier may already be active
      console.warn('Could not activate carrier:', err);
    }

    // Reverse geocode the pin
    try {
      const [place] = await Location.reverseGeocodeAsync(pinCoords);
      const addr = [place.street, place.district, place.city].filter(Boolean).join(', ');
      setDestAddress(addr || 'Selected Destination');
    } catch {
      setDestAddress('Selected Destination');
    }
    setStep('JOBS');
  };

  const handleSearchDestination = async () => {
    const query = destinationQuery.trim();
    if (!query) {
      Alert.alert('Enter location', 'Please type a destination to search.');
      return;
    }
    setSearchingDestination(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        Alert.alert('No results', 'Could not find that location. Try a more specific name.');
        return;
      }
      const first = results[0];
      const coords = { latitude: first.latitude, longitude: first.longitude };
      setPinCoords(coords);
      mapRef.current?.animateToRegion(
        {
          ...coords,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        500
      );
    } catch (error) {
      Alert.alert('Search failed', 'Could not search this location right now.');
    } finally {
      setSearchingDestination(false);
    }
  };

  const handleAccept = async (job: any) => {
    try {
      await acceptMutation.mutateAsync(job.parcelId);
      setActiveOrder({
        id: job.parcelId,
        type: job.itemCategory || 'Package',
        from: job.pickupAddress || 'Pickup',
        to: job.dropAddress || 'Drop',
        pickupLat: job.pickupLat,
        pickupLng: job.pickupLng,
        earnings: job.carrierEarning?.toString() || '50',
      });
      // Open external maps for navigation to pickup, then open Active screen
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${job.pickupLat},${job.pickupLng}&travelmode=driving`;
      try { Linking.openURL(mapsUrl); } catch (e) { /* ignore */ }
      navigateFromRoot('Active');
    } catch (error) {
      Alert.alert('Error', 'Could not accept this job. It may have been taken already.');
    }
  };

  // ─── STEP 1: Locating ───────────────────────────────────────────────────────
  if (step === 'LOCATING') {
    return (
      <View style={{ flex: 1 }}>
        <LinearGradient colors={['#f8f9ff', '#ffffff']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <SafeAreaView style={{ alignItems: 'center', width: '100%' }}>
            <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 40, height: 180 }}>
              <Animated.View style={{
                position: 'absolute', width: 180, height: 180, borderRadius: 90,
                backgroundColor: '#6366f120', transform: [{ scale: pulseAnim }],
              }} />
              <Animated.View style={{
                position: 'absolute', width: 130, height: 130, borderRadius: 65,
                backgroundColor: '#6366f130', transform: [{ scale: pulseAnim }],
              }} />
              <View style={{
                width: 90, height: 90, borderRadius: 45, backgroundColor: '#6366f1',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#6366f1', shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.4, shadowRadius: 20, elevation: 20,
              }}>
                <Navigation size={40} color="white" />
              </View>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 12 }}>
              Finding Your Location
            </Text>
            <Text style={{ fontSize: 15, color: '#9ca3af', fontWeight: '500', textAlign: 'center' }}>
              Getting your GPS position to show{'\n'}parcels near your route…
            </Text>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  // ─── STEP 2: Set Destination ─────────────────────────────────────────────────
  if (step === 'SET_DESTINATION') {
    return (
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={mapRegion}
          onRegionChangeComplete={(region) => {
            setPinCoords({ latitude: region.latitude, longitude: region.longitude });
          }}
        >
          {currentCoords && (
            <Marker coordinate={currentCoords} title="You are here">
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center',
                borderWidth: 3, borderColor: 'white',
                shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
              }}>
                <Navigation size={20} color="white" />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Crosshair pin in map centre */}
        <View style={{
          position: 'absolute', top: '50%', left: '50%',
          marginLeft: -24, marginTop: -48, pointerEvents: 'none',
        }}>
          <MapPin size={48} color="#6366f1" />
        </View>

        {/* Header */}
        <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16 }}>
          <View style={{
            backgroundColor: 'white', borderRadius: 20, padding: 16,
            shadowColor: '#6366f1', shadowOpacity: 0.12, shadowRadius: 16, elevation: 8,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '900', color: '#9ca3af', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>
              WHERE ARE YOU HEADING?
            </Text>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#111827' }}>
              Drop the pin at your destination
            </Text>
          </View>
        </SafeAreaView>

        {/* Confirm button */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 36 }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 10,
            marginBottom: 12,
            shadowColor: '#6366f1',
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 5,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <TextInput
              value={destinationQuery}
              onChangeText={setDestinationQuery}
              placeholder="Search destination (e.g. Panjim, Goa)"
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, color: '#111827', fontWeight: '600', paddingHorizontal: 10, paddingVertical: 8 }}
              returnKeyType="search"
              onSubmitEditing={handleSearchDestination}
            />
            <TouchableOpacity
              onPress={handleSearchDestination}
              disabled={searchingDestination}
              style={{
                backgroundColor: '#e0e7ff',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                opacity: searchingDestination ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#4f46e5', fontWeight: '800' }}>
                {searchingDestination ? '...' : 'Search'}
              </Text>
            </TouchableOpacity>
          </View>
          <Button
            title="Confirm Destination & Find Jobs"
            onPress={handleConfirmDestination}
            icon={<ChevronRight size={20} color="white" />}
          />
        </View>
      </View>
    );
  }

  // ─── STEP 3: Route Jobs ───────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9ff' }}>
      {/* Mini route map at top */}
      {currentCoords && destCoords && (
        <View style={{ height: height * 0.28 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: (currentCoords.latitude + destCoords.latitude) / 2,
              longitude: (currentCoords.longitude + destCoords.longitude) / 2,
              latitudeDelta: Math.abs(currentCoords.latitude - destCoords.latitude) * 2.2 + 0.02,
              longitudeDelta: Math.abs(currentCoords.longitude - destCoords.longitude) * 2.2 + 0.02,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={currentCoords} title="Your Location">
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' }}>
                <Navigation size={16} color="white" />
              </View>
            </Marker>
            <Marker coordinate={destCoords} title="Destination">
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'white' }}>
                <MapPin size={16} color="white" />
              </View>
            </Marker>
            {jobs.map((job: any) => (
              <Marker key={job.parcelId} coordinate={{ latitude: job.pickupLat, longitude: job.pickupLng }} title={job.pickupAddress}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: job.isRelay ? '#10b981' : '#f59e0b', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'white' }}>
                  <Text style={{ fontSize: 14 }}>{job.isRelay ? '🔄' : '📦'}</Text>
                </View>
              </Marker>
            ))}
            <Polyline
              coordinates={[currentCoords, destCoords]}
              strokeColor="#6366f1"
              strokeWidth={3}
              lineDashPattern={[8, 6]}
            />
          </MapView>
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '900', color: '#9ca3af', letterSpacing: 3, textTransform: 'uppercase' }}>
                JOBS ALONG YOUR ROUTE
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 2 }} numberOfLines={1}>
                → {destAddress}
              </Text>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => { setStep('SET_DESTINATION'); setDestCoords(null); }}
                style={{ width: 44, height: 44, backgroundColor: '#e0e7ff', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 8 }}
              >
                <MapPin size={20} color="#6366f1" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{ width: 44, height: 44, backgroundColor: '#e0e7ff', borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
              >
                <RefreshCw size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Corridor info chip */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e7ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 20 }}>
            <TrendingUp size={13} color="#6366f1" />
            <Text style={{ marginLeft: 6, fontSize: 11, fontWeight: '700', color: '#6366f1' }}>
              Showing parcels within 1.5 km of your route
            </Text>
          </View>

          {/* Assigned Jobs Section */}
          {jobs.filter((job: any) => job.isAssignedJob).length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Star size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>
                  Assigned to You
                </Text>
              </View>
              {jobs.filter((job: any) => job.isAssignedJob).map((job: any) => {
                const urg = URGENCY_CONFIG[job.urgency] || URGENCY_CONFIG.LOW;
                return (
                  <View key={job.parcelId} style={{
                    backgroundColor: '#f0fdf4', borderRadius: 28, marginBottom: 16,
                    borderLeftWidth: 4, borderLeftColor: '#10b981',
                    shadowColor: '#10b981', shadowOpacity: 0.12, shadowRadius: 20, elevation: 6,
                    overflow: 'hidden',
                  }}>
                    <View style={{ height: 4, backgroundColor: urg.dot }} />

                    <View style={{ padding: 20 }}>
                      {/* Badge and earning */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <View>
                          <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 6 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#166534' }}>✅ ASSIGNED</Text>
                          </View>
                          <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
                            {job.itemCategory || 'Package'}
                          </Text>
                          {job.description ? (
                            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>{job.description}</Text>
                          ) : null}
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>
                            ₹{job.carrierEarning ?? job.price ?? '—'}
                          </Text>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>YOU EARN</Text>
                        </View>
                      </View>

                      {/* Sender & Recipient Info */}
                      <View style={{ backgroundColor: '#ffffff', borderRadius: 14, padding: 12, marginBottom: 14 }}>
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>FROM</Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{job.senderName || 'Sender'}</Text>
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>{job.senderPhone || '—'}</Text>
                        </View>
                        <View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 2 }}>TO</Text>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{job.recipientName || 'Recipient'}</Text>
                          <Text style={{ fontSize: 11, color: '#6b7280' }}>{job.recipientPhone || '—'}</Text>
                        </View>
                      </View>

                      {/* Route card */}
                      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#dcfce7' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginRight: 10 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginRight: 6, textTransform: 'uppercase' }}>PICKUP</Text>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', flex: 1 }} numberOfLines={1}>
                            {job.pickupAddress || '—'}
                          </Text>
                        </View>
                        <View style={{ width: 1, height: 14, backgroundColor: '#e2e8f0', marginLeft: 3, marginBottom: 8 }} />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 10 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginRight: 6, textTransform: 'uppercase' }}>DROP</Text>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', flex: 1 }} numberOfLines={1}>
                            {job.dropAddress || '—'}
                          </Text>
                        </View>
                      </View>

                      {/* Stats row */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                        {[
                          { icon: <AlertCircle size={16} color="#ef4444" />, value: job.urgency || 'MEDIUM', label: 'URGENCY', bg: '#fee2e2' },
                          { icon: <Clock size={16} color="#f59e0b" />, value: job.estimatedMinutes ? `${job.estimatedMinutes} min` : '~15 min', label: 'ETA', bg: '#fffbeb' },
                          { icon: <MapPin size={16} color="#6366f1" />, value: `${job.pickupDistanceKm ?? '—'} km`, label: 'PICKUP DIST', bg: '#eef2ff' },
                        ].map((stat, i) => (
                          <View key={i} style={{ alignItems: 'center' }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: stat.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                              {stat.icon}
                            </View>
                            <Text style={{ fontSize: 12, fontWeight: '900', color: '#374151' }}>{stat.value}</Text>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{stat.label}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Special notes if any */}
                      {job.notes && (
                        <View style={{ backgroundColor: '#fef3c7', borderLeftWidth: 3, borderLeftColor: '#f59e0b', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                          <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '600' }}>📝 {job.notes}</Text>
                        </View>
                      )}

                      {/* Action: Navigate to pickup */}
                      <TouchableOpacity
                        onPress={() => {
                          setActiveOrder({
                            id: job.parcelId,
                            type: job.itemCategory || 'Package',
                            from: job.pickupAddress || 'Pickup',
                            to: job.dropAddress || 'Drop',
                            pickupLat: job.pickupLat,
                            pickupLng: job.pickupLng,
                            earnings: job.carrierEarning?.toString() || job.price?.toString() || '50',
                          });
                          navigateFromRoot('Active');
                        }}
                        style={{
                          borderRadius: 18, overflow: 'hidden',
                        }}
                      >
                        <LinearGradient colors={['#10b981', '#059669']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                          <Navigation size={20} color="white" />
                          <Text style={{ marginLeft: 8, color: 'white', fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Navigate to Pickup
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {jobsLoading ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <ActivityIndicator color="#6366f1" size="large" />
              <Text style={{ marginTop: 16, color: '#9ca3af', fontWeight: '600' }}>Scanning parcels along route…</Text>
            </View>
          ) : jobs.length === 0 ? (
            <View style={{ paddingVertical: 60, alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Package size={40} color="#cbd5e1" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#374151', marginBottom: 8 }}>No parcels on this route</Text>
              <Text style={{ color: '#9ca3af', textAlign: 'center', fontWeight: '500' }}>
                Try a different destination or{'\n'}check back in a few minutes.
              </Text>
              <TouchableOpacity
                onPress={() => { setStep('SET_DESTINATION'); setDestCoords(null); }}
                style={{ marginTop: 24, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16 }}
              >
                <Text style={{ color: 'white', fontWeight: '800' }}>Change Destination</Text>
              </TouchableOpacity>
            </View>
          ) : (
            jobs.filter((job: any) => !job.isAssignedJob).length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#6b7280' }}>No available parcels at the moment</Text>
              </View>
            ) : (
              jobs.filter((job: any) => !job.isAssignedJob).map((job: any) => {
              const urg = URGENCY_CONFIG[job.urgency] || URGENCY_CONFIG.LOW;
              const isRelay = job.isRelay === true;
              return (
                <View key={job.parcelId} style={{
                  backgroundColor: 'white', borderRadius: 28, marginBottom: 16,
                  shadowColor: isRelay ? '#10b981' : '#6366f1',
                  shadowOpacity: 0.08, shadowRadius: 20, elevation: 6,
                  overflow: 'hidden',
                  borderWidth: isRelay ? 2 : 0,
                  borderColor: isRelay ? '#d1fae5' : 'transparent',
                }}>
                  {/* Top colour strip based on urgency + relay */}
                  <View style={{ height: 4, backgroundColor: isRelay ? '#10b981' : urg.dot }} />

                  <View style={{ padding: 20 }}>
                    {/* Row 1: badge + earning + relay label */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <View style={{ backgroundColor: urg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginRight: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: urg.text }}>{urg.label}</Text>
                          </View>
                          {isRelay && (
                            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                              <Text style={{ fontSize: 10, fontWeight: '900', color: '#166534' }}>🔄 RELAY PICKUP</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>
                          {job.itemCategory || 'Package'}
                        </Text>
                        {job.description ? (
                          <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }} numberOfLines={1}>{job.description}</Text>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#10b981' }}>
                          ₹{job.carrierEarning ?? job.price ?? '—'}
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>YOU EARN</Text>
                      </View>
                    </View>

                    {/* Route card */}
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 18, padding: 14, marginBottom: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isRelay ? '#10b981' : '#6366f1', marginRight: 10 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginRight: 6, textTransform: 'uppercase' }}>
                          {isRelay ? 'RELAY POINT' : 'PICKUP'}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', flex: 1 }} numberOfLines={1}>
                          {job.pickupAddress || '—'}
                        </Text>
                      </View>
                      <View style={{ width: 1, height: 14, backgroundColor: '#e2e8f0', marginLeft: 3, marginBottom: 8 }} />
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 10 }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#9ca3af', marginRight: 6, textTransform: 'uppercase' }}>DROP</Text>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', flex: 1 }} numberOfLines={1}>
                          {job.dropAddress || '—'}
                        </Text>
                      </View>
                      {isRelay && job.relayRouteType && (
                        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                            {job.relayRouteType === 'transit' ? '🚌 Transit Route Relay' : '🔄 Optimized Relay'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Stats row */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
                      {[
                        { icon: <MapPin size={16} color="#6366f1" />, value: `${job.pickupDistanceKm ?? '—'} km`, label: isRelay ? 'RELAY DIST' : 'PICKUP DIST', bg: '#eef2ff' },
                        { icon: <Clock size={16} color="#f59e0b" />, value: job.estimatedMinutes ? `${job.estimatedMinutes} min` : '~15 min', label: 'ETA', bg: '#fffbeb' },
                        { icon: <Zap size={16} color="#10b981" />, value: `${job.corridorDistanceKm ?? '—'} km`, label: 'OFF ROUTE', bg: '#f0fdf4' },
                      ].map((stat, i) => (
                        <View key={i} style={{ alignItems: 'center' }}>
                          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: stat.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                            {stat.icon}
                          </View>
                          <Text style={{ fontSize: 12, fontWeight: '900', color: '#374151' }}>{stat.value}</Text>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase' }}>{stat.label}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Accept button */}
                    <TouchableOpacity
                      onPress={() => handleAccept(job)}
                      disabled={acceptMutation.isPending}
                      style={{
                        borderRadius: 18, overflow: 'hidden',
                        opacity: acceptMutation.isPending ? 0.6 : 1,
                      }}
                    >
                      <LinearGradient colors={isRelay ? ['#10b981', '#059669'] : ['#6366f1', '#4f46e5']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        {acceptMutation.isPending
                          ? <ActivityIndicator color="white" size="small" />
                          : <CheckCircle2 size={20} color="white" />
                        }
                        <Text style={{ marginLeft: 8, color: 'white', fontWeight: '900', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>
                          {acceptMutation.isPending ? 'Accepting…' : isRelay ? 'Accept Relay' : 'Accept Job'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
            )
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
