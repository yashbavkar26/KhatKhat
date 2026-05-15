import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carriersService } from '../../api/services/carriers';
import { parcelKeys } from './useParcels';

export const carrierKeys = {
  all: ['carriers'] as const,
  jobs: () => [...carrierKeys.all, 'jobs'] as const,
};

export const useAvailableJobs = (options?: { refetchInterval?: number; enabled?: boolean }) => {
  return useQuery({
    queryKey: carrierKeys.jobs(),
    queryFn: () => carriersService.getAvailableJobs(),
    refetchInterval: options?.refetchInterval,
    enabled: options?.enabled !== false,
  });
};

export interface RouteJobParams {
  currentLat: number;
  currentLng: number;
  destLat: number;
  destLng: number;
}

export const useRouteJobs = (params: RouteJobParams | null, options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: [...carrierKeys.jobs(), 'route', params],
    queryFn: () => carriersService.getRouteJobs(params!),
    enabled: params !== null,
    refetchInterval: options?.refetchInterval ?? 15000,
  });
};

export const useAcceptParcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carriersService.acceptParcel(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: carrierKeys.jobs() });
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.carrierHistory() });
    },
  });
};

export const useConfirmPickup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) => carriersService.confirmPickup(id, otp),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
};

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, otp }: { id: string; otp: string }) => carriersService.confirmDelivery(id, otp),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: parcelKeys.carrierHistory() });
    },
  });
};

export const useGeneratePickupOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carriersService.generatePickupOtp(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
};

export const useUploadPickupPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageBase64 }: { id: string; imageBase64: string }) => carriersService.uploadPickupPhoto(id, imageBase64),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
};

export const useSendDeliveryOtp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => carriersService.sendDeliveryOtp(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: parcelKeys.detail(id) });
    },
  });
};
