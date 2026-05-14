import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export interface EstimateParcelPayload {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  itemCategory: string;
  specialHandling?: string;
}

export interface CreateParcelPayload {
  description: string;
  receiverName: string;
  receiverPhone: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupLandmark?: string;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  dropLandmark?: string;
  sealPhotoUrl?: string;
  itemCategory: string;
  urgency: string;
  estimatedSize: string;
  specialHandling?: string;
}

export interface ConfirmPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export const parcelsService = {
  estimate: (data: EstimateParcelPayload) => client.post(API_ENDPOINTS.PARCELS.ESTIMATE, data),
  create: (data: CreateParcelPayload) => client.post(API_ENDPOINTS.PARCELS.CREATE, data),
  confirmPayment: (id: string, data: ConfirmPaymentPayload) => 
    client.post(API_ENDPOINTS.PARCELS.CONFIRM_PAYMENT(id), data),
  getById: (id: string) => client.get(API_ENDPOINTS.PARCELS.GET_BY_ID(id)),
  getSenderHistory: () => client.get(API_ENDPOINTS.PARCELS.SENDER_HISTORY),
  getCarrierHistory: () => client.get(API_ENDPOINTS.PARCELS.CARRIER_HISTORY),
  cancel: (id: string, reason: string) => client.patch(API_ENDPOINTS.PARCELS.CANCEL(id), { reason }),
};
