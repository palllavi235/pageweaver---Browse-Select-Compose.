import type { AuthSession, GoogleUser } from './types'

const GOOGLE_IDENTITY_SCRIPT = 'https://accounts.google.com/gsi/client'
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly'
export const GOOGLE_DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const IDENTITY_SCOPES = ['openid', 'email', 'profile', GOOGLE_DRIVE_SCOPE]

let scriptPromise: Promise<void> | undefined

export class AuthConfigurationError extends Error {
  constructor() {
    super('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to your environment.')
    this.name = 'AuthConfigurationError'
  }
}

export function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_IDENTITY_SCRIPT}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google sign-in could not be loaded.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GOOGLE_IDENTITY_SCRIPT
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google sign-in could not be loaded. Check your connection and retry.'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function requestUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('Your profile could not be loaded from Google.')
  const profile = (await response.json()) as {
    sub: string
    name?: string
    email?: string
    picture?: string
  }

  return {
    id: profile.sub,
    name: profile.name ?? 'Google user',
    email: profile.email ?? '',
    avatarUrl: profile.picture ?? '',
  }
}

async function requestGoogleToken(scopes: string[], prompt: '' | 'consent' | 'select_account') {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (!clientId) throw new AuthConfigurationError()
  await loadGoogleIdentity()
  if (!window.google) throw new Error('Google sign-in is unavailable right now.')

  const tokenResponse = await new Promise<GoogleTokenResponse>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(' '),
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description ?? 'Google authorization was not completed.'))
          return
        }
        resolve(response)
      },
      error_callback: (error) => {
        if (error.type === 'popup_closed') {
          reject(new Error('The Google sign-in window was closed.'))
          return
        }
        reject(new Error(error.message ?? 'Google sign-in failed. Please retry.'))
      },
    })
    client.requestAccessToken({ prompt })
  })
  return tokenResponse
}

export async function signInWithGoogle(): Promise<AuthSession> {
  const tokenResponse = await requestGoogleToken(IDENTITY_SCOPES, 'select_account')
  const user = await requestUser(tokenResponse.access_token)
  return {
    accessToken: tokenResponse.access_token,
    expiresAt: Date.now() + tokenResponse.expires_in * 1000,
    grantedScopes: tokenResponse.scope.split(' '),
    user,
  }
}

export async function requestDriveUploadAccess() {
  return requestGoogleToken([GOOGLE_DRIVE_FILE_SCOPE], 'consent')
}

export function revokeGoogleToken(accessToken: string): Promise<void> {
  if (!window.google) return Promise.resolve()
  return new Promise((resolve) => window.google!.accounts.oauth2.revoke(accessToken, resolve))
}
