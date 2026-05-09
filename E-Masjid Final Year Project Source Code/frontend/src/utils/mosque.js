import { STORAGE_KEYS } from './constants.js'

const ACTIVE_MOSQUE_KEY = 'activeMosqueId'

export function getActiveMosqueId() {
  return localStorage.getItem(ACTIVE_MOSQUE_KEY)
}

export function setActiveMosqueId(mosqueId) {
  if (!mosqueId) {
    localStorage.removeItem(ACTIVE_MOSQUE_KEY)
    return
  }
  localStorage.setItem(ACTIVE_MOSQUE_KEY, mosqueId)
}

export function clearActiveMosqueId() {
  localStorage.removeItem(ACTIVE_MOSQUE_KEY)
}

export function getUserFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

