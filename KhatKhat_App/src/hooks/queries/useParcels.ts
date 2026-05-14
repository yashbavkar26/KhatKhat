import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelsService, EstimateParcelPayload, CreateParcelPayload, ConfirmPaymentPayload } from '../../api/services/parcels';

export const parcelKeys = {
  all: ['parcels'] as const,
  detail: (id: string) => [...parcelKeys.all, 'detail', id] as const,
  senderHistory: () => [...parcelKeys.all, 'sender-history'] as const,
  carrierHistory: () => [...parcelKeys.all, 'carrier-history'] as const,
};

export const useEstimateParcel = () => {
  return useMutation({
    mutationFn: (data: EstimateParcelPayload) => parcelsService.estimate(data),
  });
};

export const useCreateParcel = () => {
  return useMutation({
    mutationFn: (data: CreateParcelPayload) => parcelsService.create(data),
  });
};

export const useConfirmPayment = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmPaymentPayload }) => 
      parcelsService.confirmPayment(id, data),
  });
};

export const useParcel = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: parcelKeys.detail(id),
    queryFn: () => parcelsService.getById(id),
    enabled: options?.enabled !== false && !!id,
  });
};

export const useSenderHistory = () => {
  return useQuery({
    queryKey: parcelKeys.senderHistory(),
    queryFn: () => parcelsService.getSenderHistory(),
  });
};

export const useCarrierHistory = () => {
  return useQuery({
    queryKey: parcelKeys.carrierHistory(),
    queryFn: () => parcelsService.getCarrierHistory(),
  });
};

export const useCancelParcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => parcelsService.cancel(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.senderHistory() });
    },
  });
};
