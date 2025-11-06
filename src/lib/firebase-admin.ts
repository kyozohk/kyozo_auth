import "server-only";
import * as admin from "firebase-admin";

const serviceAccount = {
  "type": "service_account",
  "project_id": "kyozo-prod",
  "private_key_id": "c34c55c0d87a2a96524a3bb4309d83bc",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDkJXcNW57A0p02\nwItyF9eeQvKwgdOhZKXEu2DmsGkJnSHat1k2fMd96S8OHWqraCAhClW9goEndRok\nZ9t3CZzkbxn10H8zdTvuxsoHk4LXNuaxot0UT1mkWERY8/OKEtcM/vgvGFZ716+C\nSOu920GvzorJYJ/SShVP\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  "client_email": "firebase-adminsdk-8ml38@kyozo-prod.iam.gserviceaccount.com",
  "client_id": "111894975549132105345",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-8ml38%40kyozo-prod.iam.gserviceaccount.com"
};

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://kyozo-prod.firebaseio.com`,
    });
  } catch (e: any) {
      // Throw a more informative error to help with debugging.
      throw new Error(`Firebase Admin initialization failed: ${e.message}`);
  }
}

export const firestore = admin.firestore();
