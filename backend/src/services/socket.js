const { Server } = require('socket.io');
const { auth, db } = require('./firebase');

let ioInstance = null;
const disconnectTimers = new Map();

function clearDisconnectTimer(userId) {
  const timer = disconnectTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(userId);
  }
}

async function emitCarrierStatusChange(io, carrierId, isActive) {
  io.to('carriers:active').emit('carrier:status_changed', {
    carrierId,
    isActive,
  });

  io.to(`user:${carrierId}`).emit('carrier:status_changed', {
    carrierId,
    isActive,
  });
}

function initSocket(httpServer) {
  if (ioInstance) {
    return ioInstance;
  }

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      // HACKATHON DEMO BYPASS: Accept mock tokens for testing
      if (token.startsWith('DEMO_TOKEN_')) {
        const mockPhone = '+' + token.split('_')[2];
        socket.userId = `demo_${mockPhone}`;
        socket.phoneNumber = mockPhone;
        return next();
      }

      const decoded = await auth.verifyIdToken(token);
      socket.userId = decoded.uid;
      socket.phoneNumber = decoded.phone_number || null;
      return next();
    } catch (error) {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    clearDisconnectTimer(socket.userId);

    socket.on('join:parcel', async ({ parcelId }) => {
      if (!parcelId) {
        return;
      }

      try {
        const parcelDoc = await db.collection('parcels').doc(parcelId).get();
        if (!parcelDoc.exists) {
          return;
        }

        const parcel = parcelDoc.data();
        const canJoin =
          parcel.senderId === socket.userId || parcel.carrier1Id === socket.userId || parcel.carrier2Id === socket.userId;

        if (canJoin) {
          socket.join(`parcel:${parcelId}`);
        }
      } catch (error) {
        console.error('join:parcel error:', error.message);
      }
    });

    socket.on('join:carrier_pool', async () => {
      try {
        const carrierDoc = await db.collection('carriers').doc(socket.userId).get();
        if (!carrierDoc.exists) {
          return;
        }

        const carrier = carrierDoc.data();
        if (carrier.isActive) {
          socket.join('carriers:active');
        }
      } catch (error) {
        console.error('join:carrier_pool error:', error.message);
      }
    });

    socket.on('carrier:location_ping', async ({ lat, lng }) => {
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        return;
      }

      try {
        await db.collection('carriers').doc(socket.userId).set(
          {
            currentLat: lat,
            currentLng: lng,
            updatedAt: new Date(),
          },
          { merge: true }
        );

        const carrierDoc = await db.collection('carriers').doc(socket.userId).get();
        if (carrierDoc.exists) {
          const carrier = carrierDoc.data();
          if (carrier.activeParcelId) {
            io.to(`parcel:${carrier.activeParcelId}`).emit('carrier:location_update', {
              lat,
              lng,
              carrierId: socket.userId,
              parcelId: carrier.activeParcelId,
            });
          }
        }
      } catch (error) {
        console.error('carrier:location_ping error:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      clearDisconnectTimer(socket.userId);

      const timer = setTimeout(async () => {
        try {
          const carrierRef = db.collection('carriers').doc(socket.userId);
          const carrierDoc = await carrierRef.get();
          if (!carrierDoc.exists) {
            return;
          }

          const carrier = carrierDoc.data();
          if (!carrier.isActive) {
            return;
          }

          await carrierRef.set(
            {
              isActive: false,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          await db.collection('users').doc(socket.userId).set(
            {
              isActive: false,
              updatedAt: new Date(),
            },
            { merge: true }
          );

          await emitCarrierStatusChange(io, socket.userId, false);
        } catch (error) {
          console.error('disconnect grace period error:', error.message);
        } finally {
          disconnectTimers.delete(socket.userId);
        }
      }, 30000);

      disconnectTimers.set(socket.userId, timer);
    });
  });

  ioInstance = io;
  return ioInstance;
}

function getIo() {
  return ioInstance;
}

module.exports = {
  initSocket,
  getIo,
};
