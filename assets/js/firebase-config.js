export const firebaseConfig = {
  apiKey: "AIzaSyBdysWLQxHSc7_CDxMmb87GiNeOt_FsIqE",
  authDomain: "dentist-portfolio-b49e3.firebaseapp.com",
  projectId: "dentist-portfolio-b49e3",
  messagingSenderId: "679709934124",
  appId: "1:679709934124:web:871e7b35c4c2e47a55c789",
  measurementId: "G-D3PCBZVK0S",
};

export const firebaseCmsSettings = {
  adminEmails: ["ranazeshi41@gmail.com"],
  sdkVersion: "12.14.0",
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => {
    return typeof value === "string" && value.length > 0 && !value.startsWith("PASTE_");
  });
}
