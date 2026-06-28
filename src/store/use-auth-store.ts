import { create } from 'zustand'
import {
  GOOGLE_DRIVE_FILE_SCOPE,
  requestDriveUploadAccess,
  revokeGoogleToken,
  signInWithGoogle,
} from '@/features/auth/google-auth-service'
import type { AuthSession, AuthStatus } from '@/features/auth/types'

type AuthState = {
  status: AuthStatus
  session: AuthSession | null
  error: string | null
  signIn: () => Promise<boolean>
  signOut: () => Promise<void>
  getValidAccessToken: () => string
  authorizeDriveUpload: () => Promise<string>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  session: null,
  error: null,
  signIn: async () => {
    set({ status: 'loading', error: null })
    try {
      const session = await signInWithGoogle()
      set({ status: 'authenticated', session, error: null })
      return true
    } catch (error) {
      set({
        status: 'error',
        session: null,
        error: error instanceof Error ? error.message : 'Google sign-in failed.',
      })
      return false
    }
  },
  signOut: async () => {
    const token = get().session?.accessToken
    set({ status: 'idle', session: null, error: null })
    if (token) await revokeGoogleToken(token)
  },
  getValidAccessToken: () => {
    const session = get().session
    if (!session) throw new Error('Sign in with Google to continue.')
    if (session.expiresAt <= Date.now() + 15_000) {
      set({ status: 'error', session: null, error: 'Your Google session expired. Please sign in again.' })
      throw new Error('Your Google session expired. Please sign in again.')
    }
    return session.accessToken
  },
  authorizeDriveUpload: async () => {
    const session = get().session
    if (!session) throw new Error('Sign in with Google before saving to Drive.')
    if (session.grantedScopes.includes(GOOGLE_DRIVE_FILE_SCOPE)) {
      return get().getValidAccessToken()
    }
    const response = await requestDriveUploadAccess()
    const nextSession = {
      ...session,
      accessToken: response.access_token,
      expiresAt: Date.now() + response.expires_in * 1000,
      grantedScopes: response.scope.split(' '),
    }
    set({ session: nextSession, status: 'authenticated', error: null })
    return nextSession.accessToken
  },
}))
