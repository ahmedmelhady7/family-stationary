import { STORAGE_KEYS } from '../config.js';

const subscribers = new Set();

function getStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.auth) || 'null');
  } catch (_error) {
    return null;
  }
}

function setStoredAuth(data) {
  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(data));
  subscribers.forEach((callback) => callback(data));
}

export async function signInWithMagicLink(email) {
  const payload = {
    email,
    token: `session-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
  };
  setStoredAuth(payload);
  return payload;
}

export async function signOut() {
  localStorage.removeItem(STORAGE_KEYS.auth);
  subscribers.forEach((callback) => callback(null));
}

export function getSession() {
  return getStoredAuth();
}

export function isAuthenticated() {
  return Boolean(getStoredAuth()?.token);
}

export function onAuthStateChange(callback) {
  subscribers.add(callback);
  callback(getStoredAuth());
  return () => subscribers.delete(callback);
}
