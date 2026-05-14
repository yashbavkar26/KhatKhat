import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentsService } from '../../api/services/payments';
import { parcelKeys } from './useParcels';

export const useCreatePaymentOrder = () => {
  return useMutation({
    mutationFn: (parcelId: string) => paymentsService.createOrder(parcelId),
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { parcelId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) => 
      paymentsService.verifyPayment(data),
    onSuccess: (_, { parcelId }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(parcelId) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.senderHistory() });
    },
  });
};

export const useRefundPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ parcelId, reason }: { parcelId: string; reason?: string }) => 
      paymentsService.refund(parcelId, reason),
    onSuccess: (_, { parcelId }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(parcelId) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.senderHistory() });
    },
  });
};
