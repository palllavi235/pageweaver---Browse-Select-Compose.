# Deployment Notes

## Required environment

Create `.env.local` for local development or configure the same variable in your host:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## Google Cloud setup

1. Enable the Google Drive API.
2. Configure the OAuth consent screen.
3. Create a Web OAuth client.
4. Add local and production origins to Authorized JavaScript origins.
5. Add test users while the OAuth app is in testing mode.

PageWeaver requests identity scopes, Drive read access for browsing/opening PDFs, and Drive file access only when saving a generated PDF back to Drive.

## Production checklist

- `npm run lint`
- `npm run build`
- `npm run budget`
- Confirm production origin is configured in Google Cloud.
- Confirm OAuth consent copy matches actual Drive data usage.
- Confirm privacy policy and terms URLs are configured before broad OAuth distribution.

