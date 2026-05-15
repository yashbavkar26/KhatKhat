import axios from 'axios';
import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';

// Use environment variables or default to the host IP instead of localhost
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.27.135.83:5000';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Firebase ID Token
client.interceptors.request.use(
  async (config) => {
    try {
      // 1. Try to read Demo Token first
      const demoToken = await SecureStore.getItemAsync('userToken');
      if (demoToken && demoToken.startsWith('DEMO_TOKEN_')) {
        config.headers.Authorization = `Bearer ${demoToken}`;
        return config;
      }

      // 2. Fallback to actual Firebase Auth
      if (getApps().length > 0) {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.warn('Firebase not initialized or token error skipped:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data, 'URL:', error.config && error.config.url);
      // Handle 401 Unauthorized globally if needed (e.g., force logout)
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default client;
