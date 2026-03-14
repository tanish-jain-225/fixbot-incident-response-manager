import { STORAGE_KEYS } from '../constants/storage'

function parseStoredUser(rawUser) {
  if (!rawUser) {
    return null
  }

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export function getStoredAuth() {
  return {
    token: localStorage.getItem(STORAGE_KEYS.token),
    user: parseStoredUser(localStorage.getItem(STORAGE_KEYS.user)),
  }
}

export function saveAuthSession({ token, user }) {
  localStorage.setItem(STORAGE_KEYS.token, token)
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function saveUserProfile(user) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.user)
}
