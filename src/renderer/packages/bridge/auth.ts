import { getChatBridgeHttpBase } from './chatbridge-origin'

const TOKEN_KEY = 'chatbridge_token'
const USER_KEY = 'chatbridge_user'

function apiUrl(): string {
  return getChatBridgeHttpBase()
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${apiUrl()}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Sign up failed')
  }
  const data = await res.json()
  setStoredToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${apiUrl()}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error || 'Sign in failed')
  }
  const data = await res.json()
  setStoredToken(data.token)
  setStoredUser(data.user)
  return data
}

export async function verifyAuth(): Promise<AuthUser | null> {
  const token = getStoredToken()
  if (!token) return null

  try {
    const res = await fetch(`${apiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      clearToken()
      return null
    }
    return await res.json()
  } catch {
    return null
  }
}
