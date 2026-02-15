import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEYS = {
  users: 'cooking_app_users',
  currentUser: 'cooking_app_current_user',
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
}

function getStoredCurrentUsername() {
  return localStorage.getItem(STORAGE_KEYS.currentUser)
}

function setStoredCurrentUser(username) {
  if (username) localStorage.setItem(STORAGE_KEYS.currentUser, username)
  else localStorage.removeItem(STORAGE_KEYS.currentUser)
}

const defaultProfile = () => ({
  dietaryRestrictions: [],
  allergies: [],
  preferredCuisines: [],
  spiceLevel: '',
  avatar: '',
  onboardingCompleted: false,
})

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const resolveUser = useCallback(() => {
    const username = getStoredCurrentUsername()
    if (!username) return null
    const users = loadUsers()
    const u = users.find((x) => x.username === username) || null
    if (u && !u.profile) u.profile = defaultProfile()
    return u
  }, [])

  useEffect(() => {
    setUser(resolveUser())
    setAuthReady(true)
  }, [resolveUser])

  const login = useCallback((username, password) => {
    const users = loadUsers()
    const u = users.find((x) => x.username === username.trim())
    if (!u || u.password !== password) return { ok: false, error: 'Incorrect username or password.' }
    if (!u.profile) u.profile = defaultProfile()
    setStoredCurrentUser(u.username)
    setUser(u)
    return { ok: true, user: u }
  }, [])

  const signup = useCallback((username, password) => {
    const trimmed = username.trim()
    if (!trimmed || !password) return { ok: false, error: 'Please enter a username and password.' }
    const users = loadUsers()
    if (users.some((x) => x.username === trimmed)) return { ok: false, error: 'That account name is already taken.' }
    const newUser = {
      username: trimmed,
      password,
      profile: defaultProfile(),
      favorites: [],
    }
    users.push(newUser)
    saveUsers(users)
    setStoredCurrentUser(newUser.username)
    setUser(newUser)
    return { ok: true, user: newUser }
  }, [])

  const logout = useCallback(() => {
    setStoredCurrentUser(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updated) => {
    const users = loadUsers()
    const i = users.findIndex((x) => x.username === updated.username)
    if (i >= 0) {
      users[i] = updated
      saveUsers(users)
      if (getStoredCurrentUsername() === updated.username) setUser(updated)
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
