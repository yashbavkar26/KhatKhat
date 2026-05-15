const { initializeFirebaseAdmin, admin } = require('./src/config/firebase');
initializeFirebaseAdmin();
const db = admin.firestore();

async function test() {
  try {
    await db.collection('test').doc('test1').set({ test: true });
    console.log('Wrote to Firestore successfully');
  } catch(e) {
    console.error('Failed to write to Firestore', e);
  }
}

test();
