import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const paymentsService = {
  createOrder: (parcelId: string) => 
    client.post(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, { parcelId }),
  verifyPayment: (data: { parcelId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => 
    client.post(API_ENDPOINTS.PAYMENTS.VERIFY, data),
  refund: (parcelId: string, reason?: string) => 
    client.post(API_ENDPOINTS.PAYMENTS.REFUND, { parcelId, reason }),
};
