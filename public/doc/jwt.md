# Claim types
* aud: The endpoint that the token is meant for.
  - user tokens: https://api.digitallinguistics.org
  - admin tokens: https://digitallinguistics.org OR https://api.digitallinguistics.org
* cid: The `client_id` of the application using the token.
* exp: The expiration time after which the JWT must not be accepted for processing.
  - user tokens: 3600s
  - admin tokens: N/A
* iat: Time the JWT was issued. (Used for determining age.)
* sub: Information about the subject/user
  - user tokens: The user RID.
  - admin tokens: `dlx-org`

# Scopes
* db - access to any resource in the database
* user - access only to the specific user's resources, and changing certain permissions on other users

# Signatures
* user tokens: Signed with the HMAC SHA256 algorithm using the client's application secret as the key.
* admin tokens: Signed with the SHA 256 algorithm using digitallinguistics.org's private SSL key as the key.

# Example DLx JWTs

## User Token
```
{
  "aud": "https://api.digitallinguistics.org",    // no trailing slash
  "cid": "uqRoAPFbwgEBAAAAAAAAAA==",              // the client application's RID (*not* the ID or `client_id`)
  "exp": 1454810229404,                           // 1 hour (3600s / 3600000ms)
  "iat": 1454808794689,                           // time issued
  "sub": "uqRoAPFbwgEDAAAAAAAAAA==",              // the user RID
  "scope": "user"                                 // may only access this user's permitted resources
}
```

## Admin Token
```
{
  "aud": "https://digitallinguistics.org",        // no trailing slash
  "exp": 1454809319909,                           // 5 min (300s / 300000ms) - admin tokens are meant for immediate use
  "iat": 1454809033720,                           // time issued
  "scope": "db",                                  // administrative access
  "sub": "dlx-org"                                // the DLx website
}
```
