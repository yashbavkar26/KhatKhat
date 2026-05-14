import client from '../client';
import { API_ENDPOINTS } from '../endpoints';

export const ratingsService = {
  createRating: (data: { parcelId: string; score: number; comment?: string }) => 
    client.post(API_ENDPOINTS.RATINGS.CREATE, data),
  getUserRatings: (userId: string) => 
    client.get(API_ENDPOINTS.RATINGS.GET_USER_RATINGS(userId)),
};
