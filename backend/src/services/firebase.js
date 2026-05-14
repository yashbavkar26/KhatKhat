const { admin, initializeFirebaseAdmin } = require('../config/firebase');

initializeFirebaseAdmin();

const auth = admin.auth();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;
const GeoPoint = admin.firestore.GeoPoint;

module.exports = {
  admin,
  auth,
  db,
  FieldValue,
  Timestamp,
  GeoPoint,
};