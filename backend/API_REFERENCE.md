KhatKhat Backend — API Reference

Base URLs
- Dev: http://localhost:5000
- Prod: https://khatkhat-backend.production (replace with real host)

Authentication
- All protected routes require header: `Authorization: Bearer <firebase_id_token>`
- Socket.io connect: `io(BASE_URL, { auth: { token: firebase_id_token } })`

Standard response format
- Success: { "success": true, "data": { ... } }
- Error:   { "success": false, "error": "Human readable message", "code": 400 }

**Health**
- GET /api/health
  - Auth: no
  - Response:
    - 200 { success: true, data: { status: "ok", timestamp: ISOString, version: "1.0.0", env } }

**Auth & Users**
- POST /api/auth/register
  - Auth: yes (Firebase token)
  - Body: { name: string, role: "sender"|"carrier"|"both", fcmToken?: string }
  - Response: { success: true, data: { user: { uid, name, phone, role, trustScore, verified, avgRating, isActive } } }

- GET /api/auth/me
  - Auth: yes
  - Response: { success: true, data: { user } }

- PATCH /api/auth/profile
  - Auth: yes
  - Body (any): { name?, profilePhoto?, destinationLat?, destinationLng?, destinationAddress?, fcmToken? }
  - Note: `destination*` fields only for carriers; updates `carriers/{uid}` when role includes carrier
  - Response: { success: true, data: { user } }

- POST /api/auth/verify-id
  - Auth: yes
  - Body: { idType: "college"|"aadhaar", idNumber: string }
  - Notes: Server stores SHA-256 hash of `idNumber` only; returns { verified: true }

- POST /api/auth/carrier/toggle-active
  - Auth: yes (carrier or both)
  - Body: { isActive: boolean, lat?: number, lng?: number }
  - Effect: updates `users/{uid}.isActive` and `carriers/{uid}.currentLat/currentLng`; emits `carrier:status_changed` to `carriers:active` and `user:{uid}`
  - Response: { success: true, data: { updated: true } }

- POST /api/auth/carrier/update-location
  - Auth: yes (carrier or both)
  - Body: { lat: number, lng: number }
  - Effect: updates `users` + `carriers`; emits `carrier:location_update` to parcel room if assigned
  - Response: { success: true, data: { updated: true } }

**Parcels**
- POST /api/parcels/estimate
  - Auth: no
  - Body: { pickupLat: number, pickupLng: number, dropLat: number, dropLng: number, urgency: "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", itemCategory: [document|medicine|electronics|food|clothing|keys|other], specialHandling?: string }
  - Response: { success: true, data: { distanceKm, estimatedMinutes, price, platformFee, carrierEarning, breakdown } }
  - Notes: uses Google Distance Matrix; requires `GOOGLE_MAPS_API_KEY`

- POST /api/parcels
  - Auth: yes
  - Body: {
      description: string (10–500), receiverName, receiverPhone (+91...), pickupAddress, pickupLat, pickupLng, pickupLandmark?, dropAddress, dropLat, dropLng, dropLandmark?, sealPhotoUrl?, itemCategory, urgency, estimatedSize, specialHandling?
    }
  - Response: 201 { success: true, data: { parcel, razorpayOrderId, razorpayKeyId } }
  - Notes: server re-calculates distance & price; creates Razorpay order (or mock order in dev)

- POST /api/parcels/:parcelId/confirm-payment
  - Auth: yes
  - Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
  - Response: { success: true, data: { status: 'MATCHING' } }
  - Effect: verifies payment signature, updates parcel.paymentStatus='PAID', status='MATCHING', emits `parcel:matching_started`, starts matching flow asynchronously

- GET /api/parcels/:parcelId
  - Auth: yes
  - Authorization: sender or assigned carrier only
  - Response: { success: true, data: { parcel } }

- GET /api/parcels/sender/history
  - Auth: yes (sender)
  - Response: { success: true, data: { parcels: [...] } }

- GET /api/parcels/carrier/history
  - Auth: yes (carrier)
  - Response: { success: true, data: { parcels: [...] } }

- PATCH /api/parcels/:parcelId/cancel
  - Auth: yes (sender only)
  - Body: { reason: string }
  - Allowed statuses: PENDING, MATCHING
  - Effect: sets status to CANCELLED, attempts refund if paid, emits `parcel:cancelled`
  - Response: { success: true, data: { cancelled: true } }

**Carriers**
- GET /api/carriers/jobs/available
  - Auth: yes (carrier)
  - Response: { success: true, data: { jobs: [ { parcelId, itemCategory, urgency, distanceKm, price, carrierEarning, pickupAddress, estimatedMinutes } ] } }
  - Notes: finds parcels with status==MATCHING within 3km of carrier current location; sorts CRITICAL first

- POST /api/carriers/parcels/:parcelId/accept
  - Auth: yes (carrier)
  - Body: none
  - Precondition: carrier must be assigned to parcel (carrier1Id or carrier2Id)
  - Response: { success: true, data: { pickupOtp, pickupAddress, senderPhone, sealPhotoUrl, relayOtp? } }
  - Emits: `parcel:accepted` to parcel room

- POST /api/carriers/parcels/:parcelId/confirm-pickup
  - Auth: yes (carrier)
  - Body: { otp: 4-digit }
  - Validates pickupOtp (or relayOtp for carrier2 if relay)
  - Effect: updates status -> PICKED_UP, emits `parcel:picked_up`, clears match timer
  - Response: { success: true, data: { dropAddress, receiverPhone, deliveryOtp } }

- POST /api/carriers/parcels/:parcelId/confirm-relay
  - Auth: yes (carrier1 only)
  - Body: { otp }
  - Effect: status -> IN_RELAY, carrier1RelayedAt set, carrier1.activeParcelId cleared, emits `parcel:in_relay`
  - Response: { success: true }

- POST /api/carriers/parcels/:parcelId/confirm-delivery
  - Auth: yes (carrier)
  - Body: { otp }
  - Effect: validates deliveryOtp, status -> DELIVERED, deliveredAt set, carrier.activeParcelId cleared, carrier.totalDeliveries++, sender.totalSent++, emits `parcel:delivered`
  - Response: { success: true, data: { earnings } }

**AI (Anthropic Claude) endpoints**
- POST /api/ai/classify
  - Auth: yes
  - Body: { description: string }
  - Response: { success: true, data: { itemCategory, urgency, estimatedSize, specialHandling, shortLabel } }
  - Notes: calls `src/services/claude.classifyParcel`; falls back to defaults if API key missing or error occurs

- POST /api/ai/eta
  - Auth: yes (sender or assigned carrier)
  - Body: { parcelId: string, lat: number, lng: number }
  - Response: { success: true, data: { estimatedMinutes: number, confidence: 'low'|'medium'|'high' } }
  - Notes: calls `src/services/claude.generateETA`

**Payments (Razorpay)**
- POST /api/payments/create-order
  - Auth: yes
  - Body: { parcelId }
  - Response: { success: true, data: { orderId, amount, currency, key } }
  - Notes: creates Razorpay order; in dev, a mock order is returned when keys are not configured

- POST /api/payments/verify
  - Auth: yes
  - Body: { parcelId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
  - Response: { success: true, data: { status: 'MATCHING' } }
  - Effect: verifies HMAC signature, updates parcel paymentStatus->PAID, status->MATCHING, emits `parcel:matching_started`, triggers matching

- POST /api/payments/refund
  - Auth: yes (sender only)
  - Body: { parcelId, reason? }
  - Precondition: parcel.status in [PENDING, MATCHING, FAILED] and paymentStatus == PAID
  - Response: { success: true, data: { refund } }
  - Notes: calls `src/services/razorpay.initiateRefund()`; in dev returns mock refund

- POST /api/payments/razorpay-webhook
  - Auth: public (Razorpay)
  - Body: raw webhook payload (server captures `req.rawBody` for signature verify)
  - Header: `X-Razorpay-Signature`
  - Notes: verifies signature using `RAZORPAY_KEY_SECRET`, handles `payment.captured` to mark parcel PAID and start matching

**Ratings & Trust**
- POST /api/ratings
  - Auth: yes
  - Body: { parcelId: string, score: int 1..5, comment?: string }
  - Preconditions: parcel.status == DELIVERED; user must be sender or carrier of the parcel
  - Effect: creates rating doc, recalculates avgRating, updates trustScore via rules
  - Response: { success: true, data: { avgRating } }

- GET /api/ratings/user/:userId
  - Auth: yes
  - Response: { success: true, data: { ratings: [...], avgRating, trustScore } }

**Socket.IO Events**
- Client emits:
  - `join:parcel` { parcelId }
  - `join:carrier_pool` {}
  - `carrier:location_ping` { lat, lng }

- Server emits:
  - `parcel:matching_started` -> room `parcel:{parcelId}` payload { message }
  - `parcel:carrier_assigned` -> room `parcel:{parcelId}` payload { carrierName, estimatedPickupMinutes, carrierTrustScore }
  - `parcel:new_job` -> room `user:{carrierId}` payload { parcelId, itemCategory, urgency, earning, pickupAddress }
  - `carrier:location_update` -> room `parcel:{parcelId}` payload { lat, lng, carrierId }
  - `parcel:accepted` -> room `parcel:{parcelId}` payload { acceptedAt }
  - `parcel:picked_up` -> room `parcel:{parcelId}` payload { pickedUpAt, estimatedDeliveryMinutes }
  - `parcel:in_relay` -> room `parcel:{parcelId}` payload { relayPoint, carrier2Name }
  - `parcel:delivered` -> room `parcel:{parcelId}` payload { deliveredAt }
  - `parcel:cancelled` -> room `parcel:{parcelId}` payload { reason }
  - `parcel:no_carrier_found` -> user `{senderId}` payload { message, refundInitiated }
  - `carrier:status_changed` -> room `carriers:active` payload { carrierId, isActive }

Security & Notes
- Inputs validated with `express-validator` (phone: /^\+91[6-9]\d{9}$/, OTP: /^\d{4}$/, lat/lng ranges, urgency enum, description length 10–500).
- Rate limiting: global 100/15min, auth routes 10/15min, AI routes 20/min per IP.
- Webhook security: server computes HMAC of `req.rawBody` using `RAZORPAY_KEY_SECRET` and compares with header `X-Razorpay-Signature`.

Developer checklist to run locally
```bash
cp .env.example .env
# fill in FIREBASE_*, GOOGLE_MAPS_API_KEY, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, ANTHROPIC_API_KEY (optional for AI)
npm install
npm run dev
# health check
curl http://localhost:5000/api/health
```

If you want, I can export this as a more compact OpenAPI/Swagger spec next.
