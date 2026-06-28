import { firebaseCmsSettings, firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

export { isFirebaseConfigured } from "./firebase-config.js";

export const CMS_COLLECTIONS = {
  appointments: "appointmentRequests",
  services: "services",
  gallery: "galleryCases",
  testimonials: "testimonials",
  publications: "publications",
  socialLinks: "socialLinks",
  faqs: "faqs",
  cvHighlights: "cvHighlights",
  settings: "siteSettings",
};

const firebaseState = {
  sdk: null,
  app: null,
  auth: null,
  db: null,
  promise: null,
};

function sdkUrl(packageName) {
  return `https://www.gstatic.com/firebasejs/${firebaseCmsSettings.sdkVersion}/${packageName}.js`;
}

function assertCollectionName(collectionName) {
  const safeCollectionName = String(collectionName ?? "").trim();
  if (!safeCollectionName) throw new Error("Missing Firestore collection name.");
  return safeCollectionName;
}

function assertDocumentId(id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) throw new Error("Missing Firestore document id.");
  return safeId;
}

async function loadFirebaseSdk() {
  if (firebaseState.sdk) return firebaseState.sdk;

  const [app, auth, firestore] = await Promise.all([
    import(sdkUrl("firebase-app")),
    import(sdkUrl("firebase-auth")),
    import(sdkUrl("firebase-firestore")),
  ]);

  firebaseState.sdk = { app, auth, firestore };
  return firebaseState.sdk;
}

export async function getFirebaseServices() {
  if (!isFirebaseConfigured()) {
    return { configured: false };
  }

  if (firebaseState.promise) {
    return firebaseState.promise;
  }

  firebaseState.promise = loadFirebaseSdk().then((sdk) => {
    firebaseState.app = firebaseState.app || sdk.app.initializeApp(firebaseConfig);
    firebaseState.auth = firebaseState.auth || sdk.auth.getAuth(firebaseState.app);
    firebaseState.db = firebaseState.db || sdk.firestore.getFirestore(firebaseState.app);

    return {
      configured: true,
      sdk,
      app: firebaseState.app,
      auth: firebaseState.auth,
      db: firebaseState.db,
    };
  });

  return firebaseState.promise;
}

export function isAdminEmail(email) {
  if (!email) return false;
  return firebaseCmsSettings.adminEmails.includes(email.toLowerCase());
}

export async function signInAdmin(email, password) {
  const services = await getFirebaseServices();
  if (!services.configured) throw new Error("Firebase is not configured yet.");

  const credential = await services.sdk.auth.signInWithEmailAndPassword(services.auth, email, password);
  const userEmail = credential.user.email?.toLowerCase();

  if (firebaseCmsSettings.adminEmails.length && !isAdminEmail(userEmail)) {
    await services.sdk.auth.signOut(services.auth);
    throw new Error("This email is not listed in firebaseCmsSettings.adminEmails.");
  }

  return credential.user;
}

export async function signOutAdmin() {
  const services = await getFirebaseServices();
  if (!services.configured) return;
  await services.sdk.auth.signOut(services.auth);
}

export async function onAdminAuthStateChanged(callback) {
  const services = await getFirebaseServices();
  if (!services.configured) {
    callback(null);
    return () => {};
  }

  return services.sdk.auth.onAuthStateChanged(services.auth, (user) => {
    if (user && firebaseCmsSettings.adminEmails.length && !isAdminEmail(user.email?.toLowerCase())) {
      services.sdk.auth.signOut(services.auth);
      callback(null);
      return;
    }

    callback(user);
  });
}

export async function subscribeCollection(collectionName, callback, options = {}) {
  const services = await getFirebaseServices();
  if (!services.configured) {
    callback([]);
    return () => {};
  }

  const { collection, onSnapshot, orderBy, query } = services.sdk.firestore;
  const safeCollectionName = assertCollectionName(collectionName);
  const collectionRef = collection(services.db, safeCollectionName);
  const queryRef = options.orderBy === false ? collectionRef : query(collectionRef, orderBy(options.orderBy || "order", "asc"));

  return onSnapshot(queryRef, (snapshot) => {
    callback(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  });
}

export async function getOrderedCollection(collectionName, options = {}) {
  const services = await getFirebaseServices();
  if (!services.configured) return [];

  const { collection, getDocs, orderBy, query } = services.sdk.firestore;
  const safeCollectionName = assertCollectionName(collectionName);
  const collectionRef = collection(services.db, safeCollectionName);
  const queryRef = options.orderBy === false ? collectionRef : query(collectionRef, orderBy(options.orderBy || "order", "asc"));
  const snapshot = await getDocs(queryRef);

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getSiteSettings() {
  const services = await getFirebaseServices();
  if (!services.configured) return null;

  const { doc, getDoc } = services.sdk.firestore;
  const snapshot = await getDoc(doc(services.db, CMS_COLLECTIONS.settings, "main"));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function saveSiteSettings(data) {
  const services = await getFirebaseServices();
  if (!services.configured) throw new Error("Firebase is not configured yet.");

  const { doc, serverTimestamp, setDoc } = services.sdk.firestore;
  await setDoc(
    doc(services.db, CMS_COLLECTIONS.settings, "main"),
    cleanRecord({ ...data, updatedAt: serverTimestamp() }),
    { merge: true }
  );
}

export async function saveDocument(collectionName, data, id = "") {
  const services = await getFirebaseServices();
  if (!services.configured) throw new Error("Firebase is not configured yet.");

  const { addDoc, collection, doc, serverTimestamp, setDoc } = services.sdk.firestore;
  const safeCollectionName = assertCollectionName(collectionName);
  const safeId = String(id ?? "").trim();
  const payload = cleanRecord(
    safeId
      ? {
          ...data,
          updatedAt: serverTimestamp(),
        }
      : {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
  );

  if (safeId) {
    await setDoc(doc(services.db, safeCollectionName, safeId), payload, { merge: true });
    return safeId;
  }

  const created = await addDoc(collection(services.db, safeCollectionName), payload);
  return created.id;
}

export async function deleteDocument(collectionName, id) {
  const services = await getFirebaseServices();
  if (!services.configured) throw new Error("Firebase is not configured yet.");

  const { deleteDoc, doc } = services.sdk.firestore;
  const safeCollectionName = assertCollectionName(collectionName);
  const safeId = assertDocumentId(id);
  await deleteDoc(doc(services.db, safeCollectionName, safeId));
}

export async function saveAppointmentRequest(data) {
  const services = await getFirebaseServices();
  if (!services.configured) throw new Error("Firebase is not configured yet.");

  const { addDoc, collection, serverTimestamp } = services.sdk.firestore;
  const payload = cleanRecord({
    ...data,
    status: "new",
    source: "website",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const created = await addDoc(collection(services.db, CMS_COLLECTIONS.appointments), payload);
  return created.id;
}

export function cleanRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}
