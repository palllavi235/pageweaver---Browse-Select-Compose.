export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

export type GoogleUser = {
  id: string
  name: string
  email: string
  avatarUrl: string
}

export type AuthSession = {
  accessToken: string
  expiresAt: number
  grantedScopes: string[]
  user: GoogleUser
}
