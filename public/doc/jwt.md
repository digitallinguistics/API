# Claim types
* `aud`: The endpoint that the token is meant for.
* `cid`: The client ID of the application using the token.
* `exp`: The expiration time after which the JWT must not be accepted for processing.
* `iat`: Time the JWT was issued. (Used for determining age.)
* `jti`: The JWT ID, an ID unique to the particular JWT.
* `sub`: The subject of the token, i.e. what the token contains details about.

# Token Types

## User token
A token provided to the client application for use when accessing resources in the DLx database. Each user token represents a combination of a particular client app and a user.

* Key: Signed with the HMAC SHA256 algorithm using the client's application secret as the key.
* Header: the User token as a Bearer token in the `Authorization` header
* Body: database resources
```
{
  "aud": "https://api.digitallinguistics.org",    // no trailing slash
  "cid": "uqRoAPFbwgEBAAAAAAAAAA==",              // the client application's RID
  "exp": 1454810229404,                           // 1 hour (3600s / 3600000ms)
  "iat": 1454808794689,                           // time issued
  "sub": "uqRoAPFbwgEDAAAAAAAAAA=="               // the user RID
}
```

## Auth Token
A token sent to the single sign-on page requesting that the user be signed in and their information returned.

* POST https://digitallinguistics.org/login
* Header: N/A
* Body: the Auth token
* Key: Signed with the SHA 256 algorithm using digitallinguistics.org's private SSL key as the key.
```
{
  "aud": "https://digitallinguistics.org",        // no trailing slash
  "exp": 1454810229404,                           // 5 min (300s / 300000ms)
  "iat": 1454810229104,                           // time issued
  "jti": "de305d54-75b4-431b-adb2-eb6b9e546014"   // used to track state (technically not to spec)
}
```

## OAuth Token
A token sent in response to an authentication request.

* POST https://api.digitallinguistics.org
* Header: the OAuth token as a Bearer token in the `Authorization` header
* Body: the User object
* Key: Signed with the SHA 256 algorithm using digitallinguistics.org's private SSL key as the key.
```
{
  "aud": "https://api.digitallinguistics.org",    // no trailing slash
  "exp": 1454810229404,                           // 5 min (300s / 300000ms)
  "iat": 1454810229104,                           // time issued
  "jti": "de305d54-75b4-431b-adb2-eb6b9e546014"   // matches the state sent in the Auth request token (technically not to spec)
}
```
