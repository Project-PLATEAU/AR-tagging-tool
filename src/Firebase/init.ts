import { FirebaseApp, initializeApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getFunctions, Functions } from 'firebase/functions'
import { getStorage, FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGE_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENT_ID
}

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
export const auth: Auth = getAuth(app)
export const functions: Functions = getFunctions(app, 'asia-northeast1')

// export const apiApp: FirebaseApp = initializeApp(firebaseConfig, "api_version")
