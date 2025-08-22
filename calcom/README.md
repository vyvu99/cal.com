# Cal.com Google Calendar Integration Test

This is a simple HTML page to test the Google Calendar integration with Cal.com API v2.

## Prerequisites

1. Cal.com API v2 server running
2. Google Calendar API credentials configured in your environment
3. Google Cloud Console OAuth redirect URI configured to point to your API v2 callback endpoint

## Correct Endpoints

The current Google Calendar integration uses these endpoints:

- **Connect**: `/v2/calendars/google/connect` - Gets the Google OAuth URL
- **Check**: `/v2/calendars/google/check` - Verifies the connection status
- **Callback**: `/v2/calendars/google/save` - Handles the OAuth callback from Google

## How to Use

1. Place this `index.html` file in a `calcom` directory in your Cal.com project root
2. Open the file in your browser (e.g., `http://localhost:3000/calcom/index.html`)
3. Configure the API settings:
   - Enter your API v2 base URL (e.g., `http://localhost:3000`)
   - Enter your access token (must start with `cal_` for API keys)
   - Optionally update the redirect URL
4. Click "Connect to Google Calendar" to initiate the OAuth flow
5. After authorizing, you'll be redirected back to this page
6. Click "Check Connection Status" to verify the connection

## Token Format

Make sure your access token is properly formatted:
- For API keys: Should start with `cal_` (e.g., `cal_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
- For access tokens: Should be a valid JWT token

## Troubleshooting

### Common Issues:

1. **"Invalid authentication method" errors**: 
   - Make sure your token starts with `cal_` if it's an API key
   - Make sure you're using the correct token type for the endpoint

2. **"Cannot GET" errors**: 
   - Make sure you're using the correct endpoint paths with `/v2/` prefix

3. **Permission errors**: 
   - Ensure your user account (associated with the token) has the necessary permissions

### Checking Token Validity:

```bash
curl -X GET \\
  http://localhost:3000/v2/me \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

If this returns user information, your token is valid.