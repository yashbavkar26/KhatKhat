# Prompt 4 Implementation — Pricing & Parcel Creation

## ✅ COMPLETED

### 1. **Pricing Engine** (`src/utils/pricing.js`)
- **Base formula**: `price = BASE_FARE + (distanceKm * PER_KM_RATE) * URGENCY_MULTIPLIER`
- **Constants**:
  - BASE_FARE = ₹30
  - PER_KM_RATE = ₹8/km
  - PLATFORM_FEE_PCT = 13%
- **Urgency multipliers**:
  - LOW = 1.0x
  - MEDIUM = 1.3x
  - HIGH = 1.6x
  - CRITICAL = 2.2x
- **Special handling**: +₹15 for fragile or refrigerate
- **Medicine + CRITICAL**: capped at ₹150
- **Rounding**: nearest ₹5
- **Output**: `{ price, platformFee, carrierEarning, breakdown }`

### 2. **Maps Service** (`src/services/maps.js`)
- Integrated **Google Distance Matrix API**
- Returns `{ distanceKm, durationMinutes }`
- Handles API errors gracefully
- Called before parcel creation to validate distance

### 3. **Parcel Routes** (`src/routes/parcels.js`)

#### `POST /api/parcels/estimate` (Public)
- **Body**: `{ pickupLat, pickupLng, dropLat, dropLng, urgency, itemCategory, specialHandling? }`
- **Response**: `{ distanceKm, estimatedMinutes, price, platformFee, carrierEarning, breakdown }`
- **No auth required** — client calls this to preview cost

#### `POST /api/parcels` (Protected)
- **Auth**: `verifyToken` + `attachUser`
- **Body**: Parcel details (description, receiver info, addresses, AI fields, seal photo)
- **Logic**:
  - Validates all inputs
  - Fetches sender from Firestore
  - Re-validates distance and pricing on server
  - Generates 4-digit OTPs (pickup, delivery)
  - Creates parcel doc in `parcels` collection with `status: "PENDING"`
  - Creates Razorpay order
  - Returns parcel + `razorpayOrderId` + `razorpayKeyId` for client payment
- **Response**: `{ parcel, razorpayOrderId, razorpayKeyId }`

#### `POST /api/parcels/:parcelId/confirm-payment` (Protected)
- **Auth**: Sender only
- **Body**: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature }`
- **Logic**:
  - Verifies Razorpay signature
  - Updates parcel: `paymentStatus: "PAID"`, `status: "MATCHING"`
  - Emits Socket event `parcel:matching_started` to sender
  - (TODO: trigger async matching engine)
- **Response**: `{ status: "MATCHING" }`

#### `GET /api/parcels/:parcelId` (Protected)
- **Auth**: Sender or assigned carrier only
- **Response**: Full parcel doc

#### `GET /api/parcels/sender/history` (Protected)
- **Auth**: Any authenticated user
- **Response**: Last 20 parcels where `senderId = req.user.uid`, sorted by `createdAt DESC`

#### `GET /api/parcels/carrier/history` (Protected)
- **Auth**: Any authenticated user
- **Response**: Last 20 parcels where `carrier1Id` OR `carrier2Id = req.user.uid`, sorted by `createdAt DESC`

#### `PATCH /api/parcels/:parcelId/cancel` (Protected)
- **Auth**: Sender only, status must be `PENDING` or `MATCHING`
- **Body**: `{ reason: string }`
- **Logic**:
  - Updates parcel: `status: "CANCELLED"`, `cancelledAt`, `cancelReason`
  - (TODO: Triggers Razorpay refund if payment was made)
  - Emits Socket event `parcel:cancelled`
- **Response**: `{ cancelled: true }`

## Testing Guide

### Prerequisites
1. `.env` must have:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `RAZORPAY_KEY_ID` (can be dummy for testing)
   - `RAZORPAY_KEY_SECRET` (can be dummy for testing)
   - `GOOGLE_MAPS_API_KEY` (required for distance calculation)

2. Server running: `npm run dev`

### Test Flow (Postman)

1. **Get estimate** (no auth needed):
   ```
   POST http://localhost:5000/api/parcels/estimate
   Body: {
     "pickupLat": 15.4909,
     "pickupLng": 73.8278,
     "dropLat": 15.5017,
     "dropLng": 73.8433,
     "urgency": "HIGH",
     "itemCategory": "food",
     "specialHandling": null
   }
   ```

2. **Register sender** (from Prompt 3):
   ```
   POST http://localhost:5000/api/auth/register
   Body: { "name": "John", "role": "sender", "fcmToken": "token123" }
   ```
   Response will have Firebase token. Save it.

3. **Create parcel** (with sender's token):
   ```
   POST http://localhost:5000/api/parcels
   Headers: Authorization: Bearer <TOKEN>
   Body: {
     "description": "Important documents for college admission",
     "receiverName": "Jane",
     "receiverPhone": "+919876543210",
     "pickupAddress": "123 Main St, Goa",
     "pickupLat": 15.4909,
     "pickupLng": 73.8278,
     "pickupLandmark": "Near Market",
     "dropAddress": "456 Road St, Goa",
     "dropLat": 15.5017,
     "dropLng": 73.8433,
     "dropLandmark": "Near College",
     "itemCategory": "document",
     "urgency": "HIGH",
     "estimatedSize": "small",
     "specialHandling": null
   }
   ```

4. **Confirm payment**:
   ```
   POST http://localhost:5000/api/parcels/:parcelId/confirm-payment
   Headers: Authorization: Bearer <TOKEN>
   Body: {
     "razorpayOrderId": "order_123",
     "razorpayPaymentId": "pay_123",
     "razorpaySignature": "sig_123"
   }
   ```

5. **View history**:
   ```
   GET http://localhost:5000/api/parcels/sender/history
   Headers: Authorization: Bearer <TOKEN>
   ```

## Implementation Notes

- **Route ordering**: History routes (`/sender/history`, `/carrier/history`) are defined **before** `/:parcelId` to prevent shadowing
- **Validation**: All inputs validated with `express-validator`
- **Firestore integration**: Parcel created with full schema from Prompt 2
- **Razorpay**: Order created immediately; payment verification on confirm
- **Socket events**: Emitted via `io.to("parcel:${parcelId}").emit(...)`
- **Error handling**: Try/catch with consistent error responses

## Next Steps

1. **Prompt 5**: Carrier matching engine (depends on this implementation)
2. **Prompt 6**: Socket.io enhancements (already partially done in Prompt 3)
3. **Prompt 7**: Claude AI integration for parcel classification and relay optimization

---

*Prompt 4 Complete | Ready for Prompt 5*
