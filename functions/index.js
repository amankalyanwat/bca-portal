const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

const db = getFirestore();
const callableOptions = {
  cors: ["https://bca-portal-bca17.vercel.app", "http://localhost:5173"],
};
const ADMIN_EMAIL = "amankalyanwat@gmail.com";

exports.createStudentAccount = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to add a student.");
  }

  if ((request.auth.token?.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only the admin can create student accounts.");
  }

  const name = String(request.data?.name || "").trim();
  const email = String(request.data?.email || "").trim().toLowerCase();
  const password = String(request.data?.password || "").trim();
  const semester = Number(request.data?.semester);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "Please enter a valid student email.");
  }

  if (!password || password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must be at least 6 characters long.");
  }

  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    throw new HttpsError("invalid-argument", "Semester must be a number between 1 and 12.");
  }

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: name || undefined,
      emailVerified: false,
    });

    await db.collection("users").doc(user.uid).set(
      {
        email,
        name: name || "",
        semester,
        role: "student",
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return {
      uid: user.uid,
      email: user.email,
      semester,
      name: name || null,
    };
  } catch (error) {
    if (error?.code === "auth/email-already-exists") {
      throw new HttpsError("already-exists", "This student email already exists.");
    }

    throw new HttpsError("internal", error?.message || "Failed to create the user account.");
  }
});

exports.updateStudentSemester = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to update a student.");
  }

  if ((request.auth.token?.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only the admin can update students.");
  }

  const uid = String(request.data?.uid || "").trim();
  const semester = Number(request.data?.semester);

  if (!uid) {
    throw new HttpsError("invalid-argument", "Student ID is required.");
  }

  if (!Number.isInteger(semester) || semester < 1 || semester > 12) {
    throw new HttpsError("invalid-argument", "Semester must be a number between 1 and 12.");
  }

  await db.collection("users").doc(uid).set({ semester }, { merge: true });

  return { ok: true, uid, semester };
});

exports.deleteStudentAccount = onCall(callableOptions, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be signed in to delete a student.");
  }

  if ((request.auth.token?.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Only the admin can delete students.");
  }

  const uid = String(request.data?.uid || "").trim();

  if (!uid) {
    throw new HttpsError("invalid-argument", "Student ID is required.");
  }

  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    if (error?.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "Student account not found.");
    }
    throw new HttpsError("internal", error?.message || "Unable to delete the student account.");
  }

  await db.collection("users").doc(uid).delete();

  return { ok: true, uid };
});

exports.registerDeviceSession = onCall(callableOptions, async (request) => {
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

exports.clearDeviceSession = onCall(callableOptions, async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be signed in.");
  }

  const profileRef = db.collection("users").doc(uid);
  await profileRef.set({ activeDeviceId: null }, { merge: true });

  return { ok: true };
});
