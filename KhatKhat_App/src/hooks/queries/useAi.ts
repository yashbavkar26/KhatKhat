import { useMutation } from '@tanstack/react-query';
import { aiService } from '../../api/services/ai';

export const useClassifyParcel = () => {
  return useMutation({
    mutationFn: (description: string) => aiService.classify(description),
  });
};

export const useGetEta = () => {
  return useMutation({
    mutationFn: ({ parcelId, lat, lng }: { parcelId: string; lat: number; lng: number }) => 
      aiService.getEta(parcelId, lat, lng),
  });
};
