# KhatKhat — Backend Build Specification
### AI Agent Prompt Document | Full System Context

---

## SYSTEM CONTEXT (Read this first)

You are building the backend for **KhatKhat** — a hyperlocal parcel relay platform for smaller Indian cities like Goa. The name means "knock knock" in Hindi, perfectly matching door-to-door delivery.

**Core innovation:** Instead of requiring dedicated full-time gig riders (like Swiggy Genie did, which failed), KhatKhat uses a **community relay model** — ordinary people already moving through the city (students, auto drivers, shopkeepers) carry parcels along their natural routes in a baton-pass chain. This solves the unit economics problem that killed every competitor.

**Three user roles:**
- **Sender** — books a delivery, pays, tracks
- **Carrier** — accepts jobs near their location/route, earns money
- **Relay Carrier** — second leg of a two-person relay chain (same as carrier, different assignment context)

**Tech stack decided:**
- Runtime: Node.js + Express
- Realtime: Socket.io
- Database: Firebase Firestore
- Auth: Firebase Auth (Phone OTP)
- File storage: Firebase Storage
- AI: Anthropic Claude API (`claude-sonnet-4-20250514`)
- Maps: Google Maps Platform (Places, Directions, Distance Matrix APIs)
- Payments: Razorpay
- Deployment: Railway or Render (free tier)

---

## PROMPT 1 — Project scaffold & environment setup

```
You are a senior Node.js backend engineer. Scaffold a production-ready Express + Socket.io backend for a hyperlocal delivery app called KhatKhat.

REQUIREMENTS:
- Node.js 20+, Express 4, Socket.io 4
- Firebase Admin SDK for Firestore + Auth verification
- dotenv for environment variables
- cors configured for React Native Expo client
- helmet for basic security headers
- morgan for request logging
- express-async-errors for clean async error handling
- Folder structure:
    /src
      /routes         (auth.js, parcels.js, carriers.js, relay.js, payments.js)
      /controllers    (one file per route group)
      /services       (firebase.js, maps.js, claude.js, razorpay.js, socket.js)
      /middleware     (auth.js, validate.js, errorHandler.js)
      /utils          (pricing.js, otp.js, distance.js)
    /config           (firebase.js)
    server.js         (entry point, attaches Socket.io to HTTP server)

ENVIRONMENT VARIABLES NEEDED (.env.example):
PORT=5000
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_MAPS_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLIENT_URL=http://localhost:8081

Generate the full scaffold with all files, package.json with all dependencies, and a working server.js that initialises Firebase Admin, attaches Socket.io, and mounts all route files.
```

---

## PROMPT 2 — Firestore data schema

```
You are a Firebase/Firestore architect. Define the complete Firestore data schema for KhatKhat, a hyperlocal parcel relay app.

Define all collections, document shapes, and indexing strategy. Output as:
1. Full schema in JSON-commented format (field: type // description)
2. List of composite indexes needed
3. Firestore security rules

COLLECTIONS AND EXACT SHAPES:

--- users/{userId} ---
{
  uid: string,                      // Firebase Auth UID
  name: string,
  phone: string,                    // +91XXXXXXXXXX
  role: "sender" | "carrier" | "both",
  profilePhoto: string | null,      // Firebase Storage URL
  trustScore: number,               // 0–100, default 50
  verified: boolean,                // true if ID submitted
  idType: "college" | "aadhaar" | null,
  idHash: string | null,            // SHA-256 hash of ID number only
  totalDeliveries: number,          // carrier: jobs completed
  totalSent: number,                // sender: parcels sent
  avgRating: number,                // 0–5
  currentLocation: GeoPoint | null, // updated every 10s when carrier is active
  isActive: boolean,                // carrier is online and available
  activeParcelId: string | null,    // current in-progress parcel
  fcmToken: string | null,          // for push notifications
  createdAt: Timestamp,
  updatedAt: Timestamp
}

--- parcels/{parcelId} ---
{
  id: string,
  senderId: string,
  senderName: string,
  senderPhone: string,

  receiverName: string,
  receiverPhone: string,

  description: string,              // raw natural language from sender

  // AI-extracted fields
  itemCategory: "document" | "medicine" | "electronics" | "food" | "clothing" | "keys" | "other",
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  estimatedSize: "small" | "medium" | "large",
  specialHandling: string | null,   // e.g. "fragile", "keep upright", "refrigerate"

  pickupAddress: string,
  pickupLat: number,
  pickupLng: number,
  pickupLandmark: string | null,

  dropAddress: string,
  dropLat: number,
  dropLng: number,
  dropLandmark: string | null,

  distanceKm: number,
  estimatedMinutes: number,

  price: number,                    // in INR
  platformFee: number,              // 12–15% of price
  carrierEarning: number,           // price - platformFee

  sealPhotoUrl: string | null,      // sender uploaded photo of parcel

  status: "PENDING" | "MATCHING" | "ACCEPTED" | "PICKED_UP" | "IN_RELAY" | "DELIVERED" | "CANCELLED" | "FAILED",

  // relay fields (null if single-carrier)
  isRelay: boolean,
  relayPointLat: number | null,
  relayPointLng: number | null,
  relayPointAddress: string | null,

  carrier1Id: string | null,        // first leg
  carrier1Name: string | null,
  carrier1Phone: string | null,
  carrier1AcceptedAt: Timestamp | null,
  carrier1PickedUpAt: Timestamp | null,
  carrier1RelayedAt: Timestamp | null,

  carrier2Id: string | null,        // second leg (relay)
  carrier2Name: string | null,
  carrier2Phone: string | null,
  carrier2AcceptedAt: Timestamp | null,
  carrier2PickedUpAt: Timestamp | null,

  pickupOtp: string,                // 4-digit, sender → carrier1
  relayOtp: string | null,          // 4-digit, carrier1 → carrier2
  deliveryOtp: string,              // 4-digit, carrier → receiver

  paymentId: string | null,         // Razorpay payment ID
  paymentStatus: "PENDING" | "PAID" | "REFUNDED",

  deliveredAt: Timestamp | null,
  cancelledAt: Timestamp | null,
  cancelReason: string | null,

  senderRating: number | null,      // 1–5 given by sender after delivery
  carrierRating: number | null,     // 1–5 given by carrier after delivery

  createdAt: Timestamp,
  updatedAt: Timestamp
}

--- carriers/{carrierId} ---
(Subcollection of users, for fast querying of active carriers)
{
  uid: string,
  name: string,
  phone: string,
  trustScore: number,
  avgRating: number,
  totalDeliveries: number,
  currentLat: number,
  currentLng: number,
  isActive: boolean,
  activeParcelId: string | null,
  destinationLat: number | null,    // where carrier is heading (for relay matching)
  destinationLng: number | null,
  destinationAddress: string | null,
  updatedAt: Timestamp
}

--- notifications/{notificationId} ---
{
  userId: string,
  type: "JOB_AVAILABLE" | "JOB_ACCEPTED" | "PICKUP_OTP" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "RELAY_NEEDED",
  title: string,
  body: string,
  parcelId: string | null,
  read: boolean,
  createdAt: Timestamp
}

--- ratings/{ratingId} ---
{
  parcelId: string,
  fromUserId: string,
  toUserId: string,
  role: "sender_to_carrier" | "carrier_to_sender",
  score: number,                    // 1–5
  comment: string | null,
  createdAt: Timestamp
}

COMPOSITE INDEXES NEEDED:
1. carriers: isActive ASC + currentLat ASC + currentLng ASC
2. parcels: status ASC + createdAt DESC
3. parcels: senderId ASC + createdAt DESC
4. parcels: carrier1Id ASC + status ASC
5. notifications: userId ASC + read ASC + createdAt DESC

SECURITY RULES:
- users: read/write own document only (uid match)
- parcels: sender and assigned carriers can read; only sender can create; status updates only by assigned carrier or system
- carriers: any authenticated user can read (for matching); only own document writable
- notifications: only own userId readable
- ratings: authenticated users can create; read own ratings

Generate full security rules in Firestore rules syntax.
```

---

## PROMPT 3 — Auth middleware & user routes

```
You are a Node.js backend engineer. Build the authentication layer and user management routes for KhatKhat.

CONTEXT:
- Auth is Firebase Phone OTP (handled client-side by Expo)
- Every API request carries a Firebase ID token in Authorization: Bearer <token>
- Backend verifies this token using Firebase Admin SDK
- After verification, req.user = { uid, phone }

BUILD:

1. src/middleware/auth.js
   - verifyToken middleware: decode Firebase ID token
   - attachUser middleware: fetch user doc from Firestore, attach to req.user
   - requireRole(role) middleware factory: check req.user.role

2. src/routes/auth.js with endpoints:

POST /api/auth/register
- Body: { name, role: "sender"|"carrier"|"both", fcmToken? }
- Creates user doc in Firestore (users collection + carriers collection if role includes carrier)
- Returns: { user }

GET /api/auth/me
- Protected: verifyToken + attachUser
- Returns current user profile

PATCH /api/auth/profile
- Protected
- Body: { name?, profilePhoto?, destinationLat?, destinationLng?, destinationAddress? }
- Updates user doc, syncs carriers collection if applicable

POST /api/auth/verify-id
- Protected
- Body: { idType: "college"|"aadhaar", idNumber: string }
- Hashes idNumber with SHA-256 (never store raw)
- Sets verified: true in user doc
- Returns: { verified: true }

POST /api/auth/carrier/toggle-active
- Protected, requireRole("carrier" or "both")
- Body: { isActive: boolean, lat?: number, lng?: number }
- Updates carriers/{uid}.isActive and location
- Emits socket event "carrier:status_changed" to relevant rooms

POST /api/auth/carrier/update-location
- Protected
- Body: { lat: number, lng: number }
- Updates carriers/{uid}.currentLat, currentLng, updatedAt
- Emits socket event "carrier:location_update" to any active parcel room this carrier is assigned to

All routes return consistent JSON: { success: true, data: {...} } or { success: false, error: "message" }
```

---

## PROMPT 4 — Pricing & parcel creation

```
You are a Node.js backend engineer. Build the pricing engine and parcel creation flow for KhatKhat.

PRICING LOGIC (src/utils/pricing.js):

Base formula:
  price = BASE_FARE + (distanceKm * PER_KM_RATE) * URGENCY_MULTIPLIER

Constants:
  BASE_FARE = 30
  PER_KM_RATE = 8
  PLATFORM_FEE_PCT = 0.13   (13%)

URGENCY_MULTIPLIER:
  LOW      = 1.0
  MEDIUM   = 1.3
  HIGH     = 1.6
  CRITICAL = 2.2

Special handling surcharge:
  "fragile" or "refrigerate" → add ₹15 flat
  "medicine" category + CRITICAL urgency → cap price at ₹150 (social good)

Round final price to nearest ₹5.

carrierEarning = price - platformFee (floored to nearest rupee)

BUILD src/routes/parcels.js:

POST /api/parcels/estimate
- Public (no auth needed)
- Body: { pickupLat, pickupLng, dropLat, dropLng, urgency, itemCategory, specialHandling? }
- Call Google Distance Matrix API to get distanceKm and durationMinutes
- Run pricing logic
- Return: { distanceKm, estimatedMinutes, price, platformFee, carrierEarning, breakdown: {...} }

POST /api/parcels
- Protected: verifyToken + attachUser
- Body: {
    description: string,
    receiverName: string,
    receiverPhone: string,
    pickupAddress, pickupLat, pickupLng, pickupLandmark?,
    dropAddress, dropLat, dropLng, dropLandmark?,
    sealPhotoUrl?,
    // AI fields (pre-computed on client from /api/ai/classify)
    itemCategory, urgency, estimatedSize, specialHandling?
  }
- Server re-validates distance and price (never trust client pricing)
- Generate pickupOtp (4 digits), deliveryOtp (4 digits)
- Create parcel doc with status: "PENDING"
- Create Razorpay order: amount = price * 100 (paise), currency = "INR"
- Return: { parcel, razorpayOrderId, razorpayKeyId }

POST /api/parcels/:parcelId/confirm-payment
- Protected
- Body: { razorpayPaymentId, razorpaySignature }
- Verify Razorpay signature (HMAC SHA256)
- Update parcel: paymentStatus "PAID", status "MATCHING"
- Trigger matching flow (async, non-blocking)
- Emit socket event "parcel:matching_started" to sender
- Return: { success: true }

GET /api/parcels/:parcelId
- Protected (sender or assigned carrier only)
- Returns full parcel doc

GET /api/parcels/sender/history
- Protected
- Returns all parcels where senderId = req.user.uid, ordered by createdAt DESC, limit 20

GET /api/parcels/carrier/history
- Protected
- Returns all parcels where carrier1Id or carrier2Id = req.user.uid, ordered by createdAt DESC, limit 20

PATCH /api/parcels/:parcelId/cancel
- Protected, sender only, status must be PENDING or MATCHING
- Body: { reason: string }
- Updates status to CANCELLED, triggers Razorpay refund
- Emits socket event "parcel:cancelled"
```

---

## PROMPT 5 — Carrier matching engine

```
You are a Node.js backend engineer specialising in real-time matching systems. Build the carrier matching engine for KhatKhat.

MATCHING LOGIC (src/services/matching.js):

This is the most critical service. When a parcel status becomes "MATCHING", this runs.

STEP 1 — Find candidate carriers:
Query carriers collection:
  - isActive == true
  - activeParcelId == null (not currently on a job)
  - Distance from pickupLat/pickupLng <= 3km (use Haversine formula)
  Sort by: trustScore DESC, then distance ASC
  Limit: 10 candidates

STEP 2 — Check if relay is needed:
If distanceKm > 5 OR urgency == "CRITICAL" and no carrier's destination passes near dropLat/dropLng:
  → Set isRelay = true
  → Call Claude relay optimizer (see PROMPT 7)
  → Claude returns relayPointLat, relayPointLng, carrier1Candidate, carrier2Candidate

STEP 3 — Direct assignment (single carrier):
  - Take best candidate (highest trust, closest)
  - Update parcel: status "ACCEPTED", carrier1Id, carrier1Name, carrier1Phone, carrier1AcceptedAt
  - Update carrier: activeParcelId = parcelId
  - Emit socket events:
      "parcel:carrier_assigned" → to sender's socket room (parcelId)
      "parcel:new_job" → to carrier's socket room (carrierId)
  - Set timeout: if carrier doesn't confirm pickup within 8 minutes → auto-reassign

STEP 4 — Auto-reassign logic:
  setTimeout(8 * 60 * 1000, async () => {
    re-fetch parcel, if status still "ACCEPTED" (not PICKED_UP):
      release current carrier (set activeParcelId null)
      widen search radius to 5km, retry STEP 1
      if still no carrier after 2nd attempt: status "FAILED", trigger refund
      emit "parcel:no_carrier_found" to sender
  })

BUILD src/routes/carriers.js:

POST /api/carriers/parcels/:parcelId/accept
- Protected, carrier only
- Verifies carrier is assigned to this parcel (carrier1Id or carrier2Id)
- Updates: carrier1AcceptedAt or carrier2AcceptedAt
- Emits "parcel:accepted" to parcel room
- Returns: { pickupOtp, pickupAddress, senderPhone, sealPhotoUrl }

POST /api/carriers/parcels/:parcelId/confirm-pickup
- Protected, carrier only
- Body: { otp: string }
- Validates OTP against parcel.pickupOtp (or relayOtp for carrier2)
- Updates: status "PICKED_UP", carrier1PickedUpAt
- Emits "parcel:picked_up" to parcel room (sender sees this)
- Returns: { dropAddress, receiverPhone, deliveryOtp }

POST /api/carriers/parcels/:parcelId/confirm-relay
- Protected, carrier1 only (relay parcels)
- Body: { otp: string }
- Validates otp against parcel.relayOtp
- Updates: status "IN_RELAY", carrier1RelayedAt
- Emits "parcel:in_relay" to parcel room
- Returns: { success: true }

POST /api/carriers/parcels/:parcelId/confirm-delivery
- Protected, carrier only
- Body: { otp: string }
- Validates otp against parcel.deliveryOtp
- Updates: status "DELIVERED", deliveredAt, carrier.activeParcelId = null, carrier.totalDeliveries++
- Updates sender: totalSent++
- Emits "parcel:delivered" to parcel room
- Returns: { success: true, earnings: carrierEarning }

GET /api/carriers/jobs/available
- Protected, carrier only
- Query: parcels where status == "MATCHING", within 3km of carrier's current location
- Return top 5, sorted by urgency (CRITICAL first) then distance
- Include: parcelId, itemCategory, urgency, distanceKm, price, carrierEarning, pickupAddress (street only, not full), estimatedMinutes

Haversine distance formula to use:
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
```

---

## PROMPT 6 — Socket.io real-time layer

```
You are a Node.js + Socket.io engineer. Build the complete real-time event system for KhatKhat.

ARCHITECTURE:
- Each parcel gets its own Socket.io room: "parcel:{parcelId}"
- Each user gets their own room: "user:{userId}"
- Carriers join "carriers:active" room when they go active

BUILD src/services/socket.js:

EXPORT a function initSocket(httpServer) that:
1. Creates io = new Server(httpServer, { cors: { origin: "*" } })
2. Middleware: verify Firebase token on connection (socket.handshake.auth.token)
3. Attaches socket.userId after verification
4. Handles all events below

CONNECTION EVENTS:

socket.on("join:parcel", ({ parcelId }) => {
  // Verify user is sender or assigned carrier for this parcel
  // socket.join("parcel:" + parcelId)
})

socket.on("join:carrier_pool", () => {
  // Verify user is carrier and isActive
  // socket.join("carriers:active")
})

socket.on("carrier:location_ping", ({ lat, lng }) => {
  // Update carriers/{userId} in Firestore
  // Emit to all parcel rooms this carrier is assigned to:
  io.to("parcel:" + carrier.activeParcelId).emit("carrier:location_update", { lat, lng, carrierId: socket.userId })
})

socket.on("disconnect", () => {
  // If carrier: set isActive = false in Firestore after 30s grace period
  // (use setTimeout, cancel if they reconnect)
})

SERVER-EMITTED EVENTS (emit from controllers, import io):

"parcel:matching_started"   → to "parcel:{parcelId}"  payload: { message: "Finding a carrier..." }
"parcel:carrier_assigned"   → to "parcel:{parcelId}"  payload: { carrierName, estimatedPickupMinutes, carrierTrustScore }
"parcel:new_job"            → to "user:{carrierId}"    payload: { parcelId, itemCategory, urgency, earning, pickupAddress }
"carrier:location_update"   → to "parcel:{parcelId}"  payload: { lat, lng, carrierId }
"parcel:accepted"           → to "parcel:{parcelId}"  payload: { acceptedAt }
"parcel:picked_up"          → to "parcel:{parcelId}"  payload: { pickedUpAt, estimatedDeliveryMinutes }
"parcel:in_relay"           → to "parcel:{parcelId}"  payload: { relayPoint, carrier2Name }
"parcel:delivered"          → to "parcel:{parcelId}"  payload: { deliveredAt }
"parcel:cancelled"          → to "parcel:{parcelId}"  payload: { reason }
"parcel:no_carrier_found"   → to "user:{senderId}"    payload: { message, refundInitiated: true }
"carrier:status_changed"    → to "carriers:active"    payload: { carrierId, isActive }

Export io instance so controllers can call io.to(...).emit(...) directly.
```

---

## PROMPT 7 — Claude AI integration

```
You are a Node.js backend engineer integrating the Anthropic Claude API into KhatKhat. Build all AI-powered features.

API DETAILS:
- Model: claude-sonnet-4-20250514
- API key from process.env.ANTHROPIC_API_KEY
- All calls wrapped in try/catch with graceful fallbacks (never let AI failure break a delivery)

BUILD src/services/claude.js with these 4 functions:

---

FUNCTION 1: classifyParcel(description: string)

SYSTEM PROMPT:
"You are a parcel classification AI for KhatKhat, a hyperlocal delivery service in Goa, India. 
Extract structured information from the sender's natural language description of their parcel.
Respond ONLY with valid JSON. No explanation, no markdown, no backticks."

USER PROMPT:
"Classify this parcel description and return a JSON object with exactly these fields:
{
  itemCategory: one of [document, medicine, electronics, food, clothing, keys, other],
  urgency: one of [LOW, MEDIUM, HIGH, CRITICAL],
  estimatedSize: one of [small, medium, large],
  specialHandling: string or null (e.g. 'fragile', 'keep upright', 'refrigerate', null if none),
  shortLabel: string (3-5 word label for the parcel, e.g. 'Medical prescription documents')
}

Rules:
- medicine → at minimum HIGH urgency unless sender says 'no rush'
- CRITICAL = life-dependent (insulin, urgent documents for surgery, legal deadline today)
- keys or phone charger → MEDIUM
- regular documents → LOW or MEDIUM
- food → HIGH (time-sensitive)
- 'forgotten' or 'urgent' keywords → bump urgency one level up

Description: ${description}"

FALLBACK if Claude fails or JSON parse error:
return { itemCategory: 'other', urgency: 'MEDIUM', estimatedSize: 'small', specialHandling: null, shortLabel: 'Parcel delivery' }

---

FUNCTION 2: optimizeRelay(parcel, carriers)
// Called when isRelay = true
// carriers = array of active carriers with their currentLat, currentLng, destinationLat, destinationLng

SYSTEM PROMPT:
"You are a route optimization AI for KhatKhat, a parcel relay delivery service.
You find the optimal two-person relay chain to move a parcel from A to B.
Respond ONLY with valid JSON. No explanation, no markdown."

USER PROMPT:
"Find the optimal relay handoff point and carrier assignments for this delivery.

PARCEL:
- From: (${parcel.pickupLat}, ${parcel.pickupLng}) — ${parcel.pickupAddress}
- To: (${parcel.dropLat}, ${parcel.dropLng}) — ${parcel.dropAddress}
- Urgency: ${parcel.urgency}
- Distance: ${parcel.distanceKm}km

AVAILABLE CARRIERS:
${carriers.map((c, i) => `Carrier ${i+1}: id=${c.uid}, name=${c.name}, trustScore=${c.trustScore}, currentLocation=(${c.currentLat},${c.currentLng}), heading to (${c.destinationLat},${c.destinationLng})`).join('\n')}

Return JSON:
{
  carrier1Id: string (uid of best carrier for first leg),
  carrier2Id: string (uid of best carrier for second leg),
  relayPointLat: number,
  relayPointLng: number,
  relayPointDescription: string (short landmark description),
  reasoning: string (one sentence why this relay works)
}

Rules:
- Relay point should be roughly the midpoint but biased toward a public landmark (bus stop, petrol pump, market)
- Carrier 1 must be closer to pickup than relay point
- Carrier 2 must be closer to relay point than drop
- Prefer higher trust scores
- If no good relay possible, return carrier1Id = best single carrier, carrier2Id = null"

FALLBACK: return null (caller falls back to single carrier assignment)

---

FUNCTION 3: generateETA(parcel, currentCarrierLat, currentCarrierLng, stage)
// stage: "to_pickup" | "to_drop" | "to_relay"

SYSTEM PROMPT:
"You are a delivery time estimator for KhatKhat in Goa, India.
Goa has unique traffic patterns: beach roads are busy in tourist season (Oct-Mar), 
city roads (Panaji, Margao) have moderate traffic, rural roads are mostly clear.
Respond ONLY with a JSON object."

USER PROMPT:
"Estimate delivery time in minutes.

Stage: ${stage}
Carrier current location: (${currentCarrierLat}, ${currentCarrierLng})
Destination: (${destinationLat}, ${destinationLng})
Straight-line distance: ${distance}km
Urgency: ${parcel.urgency}
Current time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
Day: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', timeZone: 'Asia/Kolkata' })}

Return: { estimatedMinutes: number, confidence: 'low'|'medium'|'high' }"

FALLBACK: return { estimatedMinutes: Math.round(distance * 4 + 5), confidence: 'low' }

---

FUNCTION 4: generateFallbackMessage(parcel)
// Called when no carrier found after 2 attempts

SYSTEM PROMPT:
"You are a helpful assistant for KhatKhat delivery app in Goa, India.
When no carrier is available, suggest practical local alternatives.
Be concise, warm, and specific to Goa. Respond in plain text, 2-3 sentences max."

USER PROMPT:
"No delivery carrier is currently available for this parcel.
Item: ${parcel.shortLabel || parcel.itemCategory}
Urgency: ${parcel.urgency}
Pickup area: ${parcel.pickupAddress}
Drop area: ${parcel.dropAddress}

Suggest 1-2 practical alternatives the sender can try right now in Goa."

FALLBACK: return "No carrier is available right now. Try calling a local auto-rickshaw or ask a trusted neighbour. We'll keep searching and notify you when someone's available."

---

BUILD src/routes/ai.js:

POST /api/ai/classify
- Protected
- Body: { description: string }
- Calls classifyParcel()
- Returns: { itemCategory, urgency, estimatedSize, specialHandling, shortLabel }

POST /api/ai/eta
- Protected (sender or carrier of that parcel)
- Body: { parcelId, lat, lng }
- Calls generateETA()
- Returns: { estimatedMinutes, confidence }
```

---

## PROMPT 8 — Payments & refunds

```
You are a Node.js backend engineer. Build the Razorpay payment integration for KhatKhat.

CONTEXT:
- Payment collected upfront when parcel is created
- Razorpay order created server-side, payment done client-side
- Server verifies signature after payment
- Refund triggered if: sender cancels before pickup, no carrier found, delivery fails

BUILD src/services/razorpay.js:

import Razorpay from 'razorpay'
const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

FUNCTION createOrder(amount, parcelId):
  rzp.orders.create({
    amount: amount * 100,  // paise
    currency: 'INR',
    receipt: 'kk_' + parcelId,
    notes: { parcelId }
  })
  return { orderId, amount, currency }

FUNCTION verifyPayment(orderId, paymentId, signature):
  const body = orderId + "|" + paymentId
  const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex')
  return expectedSig === signature

FUNCTION initiateRefund(paymentId, amount, reason):
  rzp.payments.refund(paymentId, {
    amount: amount * 100,
    notes: { reason }
  })

BUILD src/routes/payments.js:

POST /api/payments/create-order
- Protected
- Body: { parcelId }
- Fetches parcel, verifies senderId matches req.user.uid
- Calls createOrder(parcel.price, parcelId)
- Returns: { orderId, amount, currency, key: process.env.RAZORPAY_KEY_ID }

POST /api/payments/verify
- Protected  
- Body: { parcelId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
- Calls verifyPayment()
- If valid: update parcel paymentStatus "PAID", status "MATCHING", store paymentId
- Trigger matchCarrier(parcelId) async
- If invalid: return 400 { error: "Payment verification failed" }

POST /api/payments/refund
- Protected (sender only, or internal system call)
- Body: { parcelId, reason }
- Verifies parcel status allows refund (PENDING, MATCHING, FAILED only)
- Calls initiateRefund()
- Updates parcel: paymentStatus "REFUNDED"
- Returns: { refundId, amount }

GET /api/payments/razorpay-webhook
- Public (Razorpay webhook)
- Verify webhook signature from X-Razorpay-Signature header
- Handle events: payment.captured, payment.failed, refund.processed
- Update parcel statuses accordingly
```

---

## PROMPT 9 — Ratings & trust score system

```
You are a Node.js backend engineer. Build the ratings and trust score system for KhatKhat.

TRUST SCORE ALGORITHM:
Trust score is a number 0–100. Default: 50 on signup.

Factors that INCREASE score:
  +3 per successful delivery (carrier)
  +2 per successful send (sender)
  +5 if receiver gives 5-star rating to carrier
  +2 if receiver gives 4-star rating
  +10 on first ID verification
  +5 on 10th delivery milestone

Factors that DECREASE score:
  -10 for cancelling an accepted job (carrier)
  -5 for cancelling as sender after carrier accepted
  -15 for failed OTP match (potential fraud, after 2 wrong attempts)
  -8 for 1-star or 2-star rating received

Score clamped between 0 and 100.

BUILD src/routes/ratings.js:

POST /api/ratings
- Protected
- Body: { parcelId, score: 1-5, comment?: string }
- Verify parcel is DELIVERED
- Verify user is sender or carrier of this parcel
- Determine toUserId (if sender is rating → toUserId = carrier1Id, vice versa)
- Create rating doc
- Recalculate toUser avgRating: (sum of all ratings / count)
- Update trust score based on algorithm above
- Update users/{toUserId}.avgRating and trustScore
- Sync carriers/{toUserId} if applicable
- Return: { success: true }

GET /api/ratings/user/:userId
- Protected
- Returns last 10 ratings received by this user (public info for trust building)
- Returns: { ratings: [...], avgRating, trustScore }

INTERNAL FUNCTION updateTrustScore(userId, delta):
  Firestore transaction:
    newScore = clamp(currentScore + delta, 0, 100)
    update users/{userId}.trustScore
    if carrier: update carriers/{userId}.trustScore
```

---

## PROMPT 10 — Error handling, validation & deployment

```
You are a Node.js senior engineer. Build the error handling, input validation, and deployment config for KhatKhat.

BUILD src/middleware/validate.js:
Use express-validator to validate all route inputs.

Key validation rules:
- Phone numbers: /^\+91[6-9]\d{9}$/ (Indian mobile)
- Lat: -90 to 90, Lng: -180 to 180
- OTP: exactly 4 digits /^\d{4}$/
- Score: integer 1-5
- urgency: enum ["LOW","MEDIUM","HIGH","CRITICAL"]
- role: enum ["sender","carrier","both"]
- Parcel description: min 10 chars, max 500 chars

BUILD src/middleware/errorHandler.js:
- Global error handler (last middleware in Express chain)
- Log full error to console in development
- Return consistent JSON: { success: false, error: message, code: statusCode }
- Never leak stack traces in production (NODE_ENV check)
- Handle Firebase errors (auth/id-token-expired → 401, permission-denied → 403)
- Handle Razorpay errors
- Handle Google Maps quota exceeded

BUILD src/middleware/rateLimiter.js:
- Use express-rate-limit
- Global: 100 requests per 15 minutes per IP
- Auth routes: 10 requests per 15 minutes (prevent OTP abuse)
- AI routes: 20 requests per minute per user (prevent Claude API abuse)

BUILD Procfile (for Railway/Render):
  web: node server.js

BUILD .railway.toml OR render.yaml:
  startCommand: node server.js
  healthCheckPath: /api/health
  
BUILD GET /api/health endpoint:
  Returns: { status: "ok", timestamp, version: "1.0.0", env: process.env.NODE_ENV }

BUILD scripts in package.json:
  "start": "node server.js"
  "dev": "nodemon server.js"
  "test": "jest --coverage"

ENVIRONMENT SETUP CHECKLIST for teammate running this:
1. npm install
2. Copy .env.example to .env and fill all keys
3. Download Firebase service account JSON from Firebase Console → Project Settings → Service Accounts
4. Add service account values to .env (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)
5. Enable Google Maps APIs in Google Cloud Console: Places API, Directions API, Distance Matrix API
6. Create Razorpay test account at dashboard.razorpay.com, get test key_id and key_secret
7. npm run dev → confirm server starts on PORT 5000
8. Test /api/health → should return { status: "ok" }
9. Deploy: connect GitHub repo to Railway, set all env vars in Railway dashboard, deploy
```

---

## PROMPT 11 — Complete API reference (for frontend integration)

```
You are a technical writer. Generate a complete API reference document for KhatKhat's backend.
The frontend team (React Native + Expo) needs this to build against.

BASE URL: https://khatKhat-backend.railway.app (production) | http://localhost:5000 (dev)

AUTHENTICATION:
All protected routes require: Authorization: Bearer <firebase_id_token>

STANDARD RESPONSE FORMAT:
Success: { "success": true, "data": { ... } }
Error:   { "success": false, "error": "Human readable message", "code": 400 }

SOCKET.IO CONNECTION:
const socket = io(BASE_URL, { auth: { token: firebase_id_token } })

Document every endpoint with:
- Method + path
- Auth required? (yes/no)
- Request body (JSON schema)
- Response body (JSON schema)
- Socket events emitted (if any)
- Error codes and meanings

ENDPOINTS TO DOCUMENT:

AUTH & USERS:
POST   /api/auth/register
GET    /api/auth/me
PATCH  /api/auth/profile
POST   /api/auth/verify-id
POST   /api/auth/carrier/toggle-active
POST   /api/auth/carrier/update-location

PARCELS:
POST   /api/parcels/estimate
POST   /api/parcels
POST   /api/parcels/:parcelId/confirm-payment
GET    /api/parcels/:parcelId
GET    /api/parcels/sender/history
GET    /api/parcels/carrier/history
PATCH  /api/parcels/:parcelId/cancel

CARRIERS:
GET    /api/carriers/jobs/available
POST   /api/carriers/parcels/:parcelId/accept
POST   /api/carriers/parcels/:parcelId/confirm-pickup
POST   /api/carriers/parcels/:parcelId/confirm-relay
POST   /api/carriers/parcels/:parcelId/confirm-delivery

AI:
POST   /api/ai/classify
POST   /api/ai/eta

PAYMENTS:
POST   /api/payments/create-order
POST   /api/payments/verify
POST   /api/payments/refund

RATINGS:
POST   /api/ratings
GET    /api/ratings/user/:userId

HEALTH:
GET    /api/health

SOCKET EVENTS (CLIENT LISTENS):
parcel:matching_started
parcel:carrier_assigned
parcel:new_job
carrier:location_update
parcel:accepted
parcel:picked_up
parcel:in_relay
parcel:delivered
parcel:cancelled
parcel:no_carrier_found
carrier:status_changed

SOCKET EVENTS (CLIENT EMITS):
join:parcel         { parcelId }
join:carrier_pool
carrier:location_ping { lat, lng }
```

---

## EXECUTION ORDER FOR AI AGENTS

Feed these prompts **in this exact sequence** to your AI coding agent (Claude Code, Cursor, Copilot Workspace):

```
1. PROMPT 1   → Get the folder structure and server running
2. PROMPT 2   → Set up Firestore schema and security rules  
3. PROMPT 3   → Build auth so all other routes work
4. PROMPT 6   → Set up Socket.io early (needed by matching)
5. PROMPT 4   → Build parcel creation and pricing
6. PROMPT 5   → Build the matching engine
7. PROMPT 7   → Add Claude AI layer
8. PROMPT 8   → Add payments
9. PROMPT 9   → Add ratings and trust
10. PROMPT 10  → Add error handling, validation, deploy
11. PROMPT 11  → Generate API docs for frontend team
```

After each prompt, run the server and test that endpoint before moving to the next.
Use Thunder Client (VS Code) or Postman to test each route as you build.

---

## HACKATHON SHORTCUTS (if short on time)

Skip these for the demo, implement post-hackathon:
- PROMPT 9 (ratings) — show UI but don't wire backend
- Razorpay (PROMPT 8) — mock payment, skip signature verification
- Rate limiting (PROMPT 10) — skip entirely for demo
- Webhook handling — skip, use polling instead

Must-have for demo (non-negotiable):
- PROMPT 1 + 2 + 3 (auth and Firestore)
- PROMPT 4 (parcel creation)
- PROMPT 6 (Socket.io — judges love seeing live tracking)
- PROMPT 7 (Claude AI — this is your differentiator, show it prominently)
- PROMPT 5 (matching — even a simplified version)
```

---

*KhatKhat Backend Spec v1.0 | Generated for 24-hour hackathon | Goa, India*
