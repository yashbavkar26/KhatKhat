require('dotenv').config();
const { admin, initializeFirebaseAdmin } = require('./src/config/firebase');

console.log('Key looks like:', process.env.FIREBASE_PRIVATE_KEY.substring(0, 40));
try {
  initializeFirebaseAdmin();
  const db = admin.firestore();
  db.collection('test').doc('test1').set({ test: true })
    .then(() => console.log('Wrote successfully'))
    .catch(e => console.error('Write failed:', e.message));
} catch (e) {
  console.error('Init failed:', e.message);
}
