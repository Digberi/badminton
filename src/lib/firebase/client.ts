"use client";

import {initializeApp, getApp, getApps} from "firebase/app";
import {getAuth} from "firebase/auth";

function getFirebaseConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;



  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      "Missing Firebase client env vars. Set NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }

  return {apiKey, authDomain, projectId};
}

console.log("Firebase config:", getFirebaseConfig())

export function getFirebaseApp() {
  return getApps().length ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}