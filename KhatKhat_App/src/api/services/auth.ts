import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface RegisterPayload {
  name: string;
  role: 'sender' | 'carrier' | 'both';
  fcmToken?: string;
}

export interface ProfileUpdatePayload {
  name?: string;
  profilePhoto?: string;
  destinationLat?: number;
  destinationLng?: number;
  destinationAddress?: string;
  fcmToken?: string;
}

export interface VerifyIdPayload {
  idType: 'college' | 'aadhaar';
  idNumber: string;
}

export const authService = {
  register: (data: RegisterPayload) => client.post(API_ENDPOINTS.AUTH.REGISTER, data),
  getMe: () => client.get(API_ENDPOINTS.AUTH.ME),
  updateProfile: (data: ProfileUpdatePayload) => client.patch(API_ENDPOINTS.AUTH.PROFILE, data),
  verifyId: (data: VerifyIdPayload) => client.post(API_ENDPOINTS.AUTH.VERIFY_ID, data),
  toggleCarrierActive: (data: { isActive: boolean; lat?: number; lng?: number }) => 
    client.post(API_ENDPOINTS.AUTH.CARRIER_TOGGLE_ACTIVE, data),
  updateCarrierLocation: (data: { lat: number; lng: number }) => 
    client.post(API_ENDPOINTS.AUTH.CARRIER_UPDATE_LOCATION, data),
};
