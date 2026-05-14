const admin = require('firebase-admin');

function getPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!privateKey) {
    return null;
  }

  return privateKey.replace(/\\n/g, '\n');
}

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const privateKey = getPrivateKey();
  const projectId = process.env.FIREBASE_PROJECT_ID || 'khatkhat-dev';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (privateKey && clientEmail) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    return admin.app();
  }

  admin.initializeApp({ projectId });
  return admin.app();
}

module.exports = {
  admin,
  initializeFirebaseAdmin,
};