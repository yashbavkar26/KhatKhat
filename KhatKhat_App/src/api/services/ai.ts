import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const aiService = {
  classify: (description: string) => 
    client.post(API_ENDPOINTS.AI.CLASSIFY, { description }),
  getEta: (parcelId: string, lat: number, lng: number) => 
    client.post(API_ENDPOINTS.AI.ETA, { parcelId, lat, lng }),
};
