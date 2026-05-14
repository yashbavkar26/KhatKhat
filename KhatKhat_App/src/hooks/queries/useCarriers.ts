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
