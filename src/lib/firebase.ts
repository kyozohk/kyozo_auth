import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

let app: FirebaseApp;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const auth = getAuth(app);

export { app, auth };
