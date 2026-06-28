type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

type GoogleTokenClient = {
  requestAccessToken: (options?: { prompt?: '' | 'consent' | 'select_account' }) => void
}

type GoogleAccountsOAuth2 = {
  initTokenClient: (config: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type: string; message?: string }) => void
  }) => GoogleTokenClient
  revoke: (token: string, callback?: () => void) => void
}

interface Window {
  google?: {
    accounts: {
      oauth2: GoogleAccountsOAuth2
    }
  }
}
