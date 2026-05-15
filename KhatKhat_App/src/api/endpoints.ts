export const API_ENDPOINTS = {
  HEALTH: '/api/health',
  AUTH: {
    REGISTER: '/api/auth/register',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    VERIFY_ID: '/api/auth/verify-id',
    CARRIER_TOGGLE_ACTIVE: '/api/auth/carrier/toggle-active',
    CARRIER_UPDATE_LOCATION: '/api/auth/carrier/update-location',
  },
  PARCELS: {
    ESTIMATE: '/api/parcels/estimate',
    CREATE: '/api/parcels',
    CONFIRM_PAYMENT: (id: string) => `/api/parcels/${id}/confirm-payment`,
    GET_BY_ID: (id: string) => `/api/parcels/${id}`,
    SENDER_HISTORY: '/api/parcels/sender/history',
    CARRIER_HISTORY: '/api/parcels/carrier/history',
    CANCEL: (id: string) => `/api/parcels/${id}/cancel`,
  },
  CARRIERS: {
    JOBS_AVAILABLE: '/api/carriers/jobs/available',
    JOBS_ROUTE: '/api/carriers/jobs/route',
    ACCEPT_PARCEL: (id: string) => `/api/carriers/parcels/${id}/accept`,
    CONFIRM_PICKUP: (id: string) => `/api/carriers/parcels/${id}/confirm-pickup`,
    CONFIRM_RELAY: (id: string) => `/api/carriers/parcels/${id}/confirm-relay`,
    CONFIRM_DELIVERY: (id: string) => `/api/carriers/parcels/${id}/confirm-delivery`,
    GENERATE_PICKUP_OTP: (id: string) => `/api/carriers/parcels/${id}/generate-pickup-otp`,
    UPLOAD_PICKUP_PHOTO: (id: string) => `/api/carriers/parcels/${id}/upload-pickup-photo`,
    SEND_DELIVERY_OTP: (id: string) => `/api/carriers/parcels/${id}/send-delivery-otp`,
  },
  AI: {
    CLASSIFY: '/api/ai/classify',
    ETA: '/api/ai/eta',
  },
  PAYMENTS: {
    CREATE_ORDER: '/api/payments/create-order',
    VERIFY: '/api/payments/verify',
    REFUND: '/api/payments/refund',
  },
  RATINGS: {
    CREATE: '/api/ratings',
    GET_USER_RATINGS: (userId: string) => `/api/ratings/user/${userId}`,
  },
};
