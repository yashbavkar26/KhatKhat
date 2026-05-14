import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, RegisterPayload, ProfileUpdatePayload } from '../../api/services/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export const useUser = () => {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => authService.getMe(),
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProfileUpdatePayload) => authService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};

export const useToggleCarrierActive = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { isActive: boolean; lat?: number; lng?: number }) => 
      authService.toggleCarrierActive(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.me() });
    },
  });
};
