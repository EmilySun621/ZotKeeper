import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEYS = {
  users: 'cooking_app_users',
  currentUser: 'cooking_app_current_user',
  profiles: 'cooking_app_user_profiles',
}

function defaultProfile() {
  return {
    dietaryRestrictions: [],
    allergies: [],
    preferredCuisines: [],
    spiceLevel: '',
    avatar: '',
    onboardingCompleted: false,
  }
}

function safeParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function loadProfiles() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEYS.profiles), {})
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
  return {}
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEYS.profiles, JSON.stringify(profiles))
  } catch {}
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null
  const username = typeof user.username === 'string' ? user.username.trim() : ''
  if (!username) return null
  return {
    ...user,
    username,
    profile: { ...defaultProfile(), ...(user.profile || {}) },
    favorites: Array.isArray(user.favorites) ? user.favorites : [],
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  } catch {}
}

function loadUsers() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEYS.users), [])
  let users = []
  if (Array.isArray(parsed)) users = parsed
  else if (parsed && typeof parsed === 'object') users = Object.values(parsed)

  const profiles = loadProfiles()
  let profilesChanged = false
  let usersChanged = false

  const normalized = users
    .map((u) => normalizeUser(u))
    .filter(Boolean)
    .map((u) => {
      const storedProfile = profiles[u.username]
      const mergedProfile = { ...defaultProfile(), ...(storedProfile || u.profile || {}) }
      if (!storedProfile || JSON.stringify(storedProfile) !== JSON.stringify(mergedProfile)) {
        profiles[u.username] = mergedProfile
        profilesChanged = true
      }
      if (JSON.stringify(u.profile) !== JSON.stringify(mergedProfile)) {
        usersChanged = true
        return { ...u, profile: mergedProfile }
      }
      return u
    })

  if (profilesChanged) saveProfiles(profiles)
  if (usersChanged) saveUsers(normalized)
  return normalized
}

function getStoredCurrentUsername() {
  return localStorage.getItem(STORAGE_KEYS.currentUser)
}

function setStoredCurrentUser(username) {
  if (username) localStorage.setItem(STORAGE_KEYS.currentUser, username)
  else localStorage.removeItem(STORAGE_KEYS.currentUser)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const resolveUser = useCallback(() => {
    const username = getStoredCurrentUsername()
    if (!username) return null
    const users = loadUsers()
    return users.find((x) => x.username === username) || null
  }, [])

  useEffect(() => {
    setUser(resolveUser())
    setAuthReady(true)
  }, [resolveUser])

  const login = useCallback((username, password) => {
    const users = loadUsers()
    const trimmed = username.trim()
    const u = users.find((x) => x.username === trimmed)
    if (!u || u.password !== password) return { ok: false, error: 'Incorrect username or password.' }
    setStoredCurrentUser(trimmed)
    setUser(u)
    return { ok: true, user: u }
  }, [])

  const signup = useCallback((username, password) => {
    const trimmed = username.trim()
    if (!trimmed || !password) return { ok: false, error: 'Please enter a username and password.' }
    const users = loadUsers()
    if (users.some((x) => x.username === trimmed)) return { ok: false, error: 'That account name is already taken.' }
    const newUser = normalizeUser({
      username: trimmed,
      password,
      profile: defaultProfile(),
      favorites: [],
    })
    if (!newUser) return { ok: false, error: 'Please enter a username and password.' }
    users.push(newUser)
    saveUsers(users)
    const profiles = loadProfiles()
    profiles[newUser.username] = newUser.profile
    saveProfiles(profiles)
    setStoredCurrentUser(trimmed)
    setUser(newUser)
    return { ok: true, user: newUser }
  }, [])

  const logout = useCallback(() => {
    setStoredCurrentUser(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updated) => {
    const normalized = normalizeUser(updated)
    if (!normalized) return
    const users = loadUsers()
    const i = users.findIndex((x) => x.username === normalized.username)
    if (i >= 0) {
      users[i] = normalized
      saveUsers(users)
      const profiles = loadProfiles()
      profiles[normalized.username] = normalized.profile
      saveProfiles(profiles)
      if (getStoredCurrentUsername() === normalized.username) setUser(normalized)
    }
  }, [])

  const value = {
    user,
    authReady,
    login,
    signup,
    logout,
    updateUser,
    resolveUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
