import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const carriersService = {
  getAvailableJobs: () => client.get(API_ENDPOINTS.CARRIERS.JOBS_AVAILABLE),
  getRouteJobs: (params: { currentLat: number; currentLng: number; destLat: number; destLng: number }) =>
    client.get(API_ENDPOINTS.CARRIERS.JOBS_ROUTE, { params }),
  acceptParcel: (id: string) => client.post(API_ENDPOINTS.CARRIERS.ACCEPT_PARCEL(id)),
  confirmPickup: (id: string, otp: string) => 
    client.post(API_ENDPOINTS.CARRIERS.CONFIRM_PICKUP(id), { otp }),
  confirmRelay: (id: string, otp: string) => 
    client.post(API_ENDPOINTS.CARRIERS.CONFIRM_RELAY(id), { otp }),
  confirmDelivery: (id: string, otp: string) => 
    client.post(API_ENDPOINTS.CARRIERS.CONFIRM_DELIVERY(id), { otp }),
  generatePickupOtp: (id: string) => client.post(API_ENDPOINTS.CARRIERS.GENERATE_PICKUP_OTP(id)),
  uploadPickupPhoto: (id: string, imageBase64: string) => client.post(API_ENDPOINTS.CARRIERS.UPLOAD_PICKUP_PHOTO(id), { imageBase64 }),
  sendDeliveryOtp: (id: string) => client.post(API_ENDPOINTS.CARRIERS.SEND_DELIVERY_OTP(id)),
};

