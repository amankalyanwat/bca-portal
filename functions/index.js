const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

const db = getFirestore();

exports.registerDeviceSession = onCall(async (request) => {
  const uid = request.auth?.uid;
  const deviceId = request.data?.deviceId;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  if (!deviceId) {
    throw new HttpsError("invalid-argument", "Device ID is required.");
  }

  const profileRef = db.collection("users").doc(uid);
  const snapshot = await profileRef.get();

  if (!snapshot.exists) {
    throw new HttpsError("not-found", "User profile not found.");
  }

  const profile = snapshot.data();
  const currentActiveDeviceId = profile?.activeDeviceId || profile?.deviceId || null;

  if (currentActiveDeviceId && currentActiveDeviceId !== deviceId) {
    throw new HttpsError(
      "failed-precondition",
      "This account is already active on another device."
    );
  }

  await profileRef.set(
    {
      activeDeviceId: deviceId,
      deviceId,
      lastLoginAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      previousDeviceId: currentActiveDeviceId || null,
    },
    { merge: true }
  );

  return { ok: true };
});

exports.clearDeviceSession = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const profileRef = db.collection("users").doc(uid);
  await profileRef.set({ activeDeviceId: null }, { merge: true });

  return { ok: true };
});
