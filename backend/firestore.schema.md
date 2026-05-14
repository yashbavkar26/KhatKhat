# Firestore Data Schema - KhatKhat

This file defines the Firestore model in JSON-commented format.

## users/{userId}

```js
{
  uid: string,                      // Firebase Auth UID
  name: string,
  phone: string,                    // +91XXXXXXXXXX
  role: "sender" | "carrier" | "both",
  profilePhoto: string | null,      // Firebase Storage URL
  trustScore: number,               // 0-100, default 50
  verified: boolean,                // true if ID submitted
  idType: "college" | "aadhaar" | null,
  idHash: string | null,            // SHA-256 hash of ID number only
  totalDeliveries: number,          // carrier: jobs completed
  totalSent: number,                // sender: parcels sent
  avgRating: number,                // 0-5
  currentLocation: GeoPoint | null, // updated every 10s when carrier is active
  isActive: boolean,                // carrier is online and available
  activeParcelId: string | null,    // current in-progress parcel
  fcmToken: string | null,          // for push notifications
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## parcels/{parcelId}

```js
{
  id: string,
  senderId: string,
  senderName: string,
  senderPhone: string,

  receiverName: string,
  receiverPhone: string,

  description: string,              // raw natural language from sender

  itemCategory: "document" | "medicine" | "electronics" | "food" | "clothing" | "keys" | "other",
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  estimatedSize: "small" | "medium" | "large",
  specialHandling: string | null,   // e.g. fragile, keep upright, refrigerate

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

  price: number,                    // INR
  platformFee: number,              // 12-15% of price
  carrierEarning: number,           // price - platformFee

  sealPhotoUrl: string | null,      // sender uploaded parcel photo

  status: "PENDING" | "MATCHING" | "ACCEPTED" | "PICKED_UP" | "IN_RELAY" | "DELIVERED" | "CANCELLED" | "FAILED",

  isRelay: boolean,
  relayPointLat: number | null,
  relayPointLng: number | null,
  relayPointAddress: string | null,

  carrier1Id: string | null,
  carrier1Name: string | null,
  carrier1Phone: string | null,
  carrier1AcceptedAt: Timestamp | null,
  carrier1PickedUpAt: Timestamp | null,
  carrier1RelayedAt: Timestamp | null,

  carrier2Id: string | null,
  carrier2Name: string | null,
  carrier2Phone: string | null,
  carrier2AcceptedAt: Timestamp | null,
  carrier2PickedUpAt: Timestamp | null,

  pickupOtp: string,                // 4-digit, sender -> carrier1
  relayOtp: string | null,          // 4-digit, carrier1 -> carrier2
  deliveryOtp: string,              // 4-digit, carrier -> receiver

  paymentId: string | null,         // Razorpay payment ID
  paymentStatus: "PENDING" | "PAID" | "REFUNDED",

  deliveredAt: Timestamp | null,
  cancelledAt: Timestamp | null,
  cancelReason: string | null,

  senderRating: number | null,      // 1-5 by sender after delivery
  carrierRating: number | null,     // 1-5 by carrier after delivery

  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## carriers/{carrierId}

```js
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
  destinationLat: number | null,
  destinationLng: number | null,
  destinationAddress: string | null,
  updatedAt: Timestamp
}
```

## notifications/{notificationId}

```js
{
  userId: string,
  type: "JOB_AVAILABLE" | "JOB_ACCEPTED" | "PICKUP_OTP" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "RELAY_NEEDED",
  title: string,
  body: string,
  parcelId: string | null,
  read: boolean,
  createdAt: Timestamp
}
```

## ratings/{ratingId}

```js
{
  parcelId: string,
  fromUserId: string,
  toUserId: string,
  role: "sender_to_carrier" | "carrier_to_sender",
  score: number,                    // 1-5
  comment: string | null,
  createdAt: Timestamp
}
```

## Composite Indexes

1. carriers: isActive ASC + currentLat ASC + currentLng ASC
2. parcels: status ASC + createdAt DESC
3. parcels: senderId ASC + createdAt DESC
4. parcels: carrier1Id ASC + status ASC
5. notifications: userId ASC + read ASC + createdAt DESC
