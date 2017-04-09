# DLx Single Sign-On & API Authorization
The [https://login.digitallinguistics.org/](https://login.digitallinguistics.org/) subdomain is responsible for DLx's single sign-on page, and for issuing authorization tokens to access the DLx database. This repository contains its source code, and this readme explains how to authenticate a user with DLx and receive an access token for retrieving resources from the DLx database.

*Acknowledgements:* Some of this readme is modeled on, and borrows language from, Ryan Boyd's excellent (and short) book, *[Getting started with OAuth 2.0: Programming clients for secure web API authorization and authentication](http://shop.oreilly.com/product/0636920021810.do)*.

## App Registration
Before your app can interact programmatically with DLx tools like the database API, you must register your application on the [App Registration](https://developer.digitallinguistics.org/register/) page, or by clicking `Register New Application` on the [My Apps](https://developer.digitallinguistics.org/myapps) page. Once registered, you will be provided with an app ID (e.g. `900494d4-6f72-4f90-9359-088a8e47c230`) and secret (e.g. `uqRoAPFbwgEBAAAAAAAAAA==`) for use when authenticating with DLx services. It is important to keep both of these confidential, so that others cannot access DLx resources using your credentials. You can return to the [My Apps](https://developer.digitallinguistics.org/myapps) page to see your app ID and secret at any time.

If your application is capable of making secure requests from a server (i.e. your application is not a browser-based app), be sure to check the `Confidential` option during app registration. This will give your application increased levels of access to the database, such as the ability to retrieve a user's resources when they are offline.

## How Authentication Works
Once you've registered your application with DLx, you can use your app ID and secret to log in users and, with their permission, access resources on their behalf, following the steps in this section. Some DLx resources are publicly available, and require no special permission to access. Other resources are private, and require the user to be logged into DLx to access them. Any requests to create, edit, or delete resources also requires the user to be logged in. So before making these kinds of requests, you will need to authenticate the user with the API service following the steps below.

When you authenticate a user, you send a request to the DLx authorization server with your application credentials (i.e., your app ID). When the server receives the request, it first checks to see whether your application is registered, and then redirects the user's browser to the DLx login page (if they are not logged in already). The user logs in, and if this is the first time they're using your app, they are asked whether they give permission for your app to access resources on their behalf. Once the user is logged in, the server redirects the user back to your application URL (the redirect URI you provided when you registered your app), and includes an access token for accessing DLx resources. This token tells the DLx server which application is requesting access, who the logged in user is, and what resources they have permission to access. Your application needs to store this token, and then include it with any future requests to the DLx database. Most tokens expire after 1 hour, at which point your application requests a new one (new tokens can be requested before they expire as well).

### Authentication Strategies
There are three ways to authenticate with DLx:

* **[Authorization Code](#a-authorization-code-grant):** A two-step process where you first authenticate the user, and then your application. If you selected `Confidential` during app registration, you may also request refresh tokens to renew access when the old token expires (by using the `offline` scope). This is the preferred method of authentication, and should be used whenever possible. It is best suited to server-side applications.

* **[Implicit](#b-implicit-grant):** A single-step process where you authenticate the user and the client simultaneously. This method is less secure because the DLx access token is provided in the redirect URI, and therefore visible to the user. However, this authentication strategy is well-suited to client-side (browser) applications, where limiting the number of requests to the server is important. No refresh tokens are issued in this method.

* **[Client Credentials](#c-client-credentials-grant):** A single-step process where you authenticate your application and immediately receive an access token, without authenticating the user. In this strategy, your app will only have access to publicly-available resources. This is most useful when your app is acting on behalf of the app itself rather than on behalf of any particular user.

* **[Delegated Authentication](#d-delegated-authentication):** A method for other subdomains of `digitallinguistics.org` to send the user to `login.digitallinguistics.org` for authentication. Once the user is authenticated, `login.digitallinguistics.org` sets a user cookie, then redirects back to the original subdomain that requested the authentication. The subdomain can then read the cookie and use it retrieve the user from the DLx database.

*Technical Note:* The DLx authorization server follows the [OAuth 2.0](http://tools.ietf.org/html/rfc6749) specification for authentication, and implements the [Authorization Code](http://tools.ietf.org/html/rfc6749#section-1.3.1), [Implicit](http://tools.ietf.org/html/rfc6749#section-1.3.2), and [Client Credentials](http://tools.ietf.org/html/rfc6749#section-4.4) authentication strategies. For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki. For an excellent in-depth treatment of OAuth 2.0, check out Ryan Boyd's excellent book, *[Getting started with OAuth 2.0: Programming clients for secure web API authorization and authentication](http://shop.oreilly.com/product/0636920021810.do)*.

### Scopes
Every authentication request has an associated *scope* specifying the kinds of resources your application is requesting access to. More than one scope can be specified in a request. Some scopes require authorization from the user, and the user can choose to deny authorization for any individual scope. Therefore the access token you receive may not have the same scopes as your application requested, so be sure to check. The scopes that can be requested are:

Scope     | Description
--------- | -----------
`admin`   | Administrative access to all resources in the database. This scope subsumes all other scopes, so it is not necessary to include any other scopes in the request. This should only be used with the Client Credentials authorization strategy. (For DLx-internal applications only. Requests for `admin` scope from third-party applications will be denied.)
`public`  | Access to any public resources in the database.
`user`    | (*requires user authorization*) Access to all the resources that the authenticated user has permissions to view, including public resources. Does NOT grant access to the user's profile information. This scope subsumes the `public` scope, so it is not necessary to include both.

## Step-by-Step: How to use the authentication strategies

### A. Authorization Code Grant
(See the full specification for the Authorization Code grant strategy [here](http://tools.ietf.org/html/rfc6749#section-4.1).)

#### 1. Authenticate the user
If this is the first time the user is authenticating with your app, let the user know you'll be redirecting them to the DLx login page, where they'll be asked to grant permission for your app to access resources on their behalf. Then create a GET request following the format below (parameters are enclosed in `{curly brackets}` and optional parameters are enclosed in `[square brackets]`). Make sure that each of the parameters is properly URI encoded (using, for example, the `encodeURIComponent` method in JavaScript).

```
GET https://login.digitallinguistics.org/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}[&state={state}]
```

Property        | Description
--------------- | -----------
`client_id`     | (*required*) The app ID you received when registering your application. (Go to the [My Apps](https://developer.digitallinguistics.org/myapps) page to see your app ID.)
`redirect_uri`  | (*required*) The URL that user should be returned to once authentication is complete. This value must be the same as one of the redirect URIs you entered when registering your application. The code at this URL must be capable of retrieving data from the URL query string, since this is where your authorization code will be located in the response.
`response_type` | (*required*) Must be the value `code`, indicating that an authorization code is being requested.
`scope`         | (*optional*) The data your application is requesting access to. Defaults to `user`, which grants access to the resources that the user has permissions for, as well as any public resources. If your application only needs access to publicly-available resources, use the [Client Credentials Grant](c-client-credentials-grant) below. DLx-internal apps that need administrative access to the database should use the `admin` scope and the Client Credentials Grant.
`state`         | (*recommended*) A unique, opaque string used by your application to maintain state between the request and callback. Whatever value you provide for the `state` parameter will be returned in the response, allowing your application to both check the authenticity of the response, and use the string to lookup which user was being authenticated.

This request will direct the user to the DLx login page if they're not logged in already. Once the user is authenticated, they will be redirected to your redirect URI with an authorization code included in the URL query string. If the user is already logged in to DLx, they will be redirected automatically, without needing to login again, creating a seamless experience for the user. Users are automatically logged out of DLx after 4 hours of inactivity.

The DLx server uses a session cookie to keep the user logged in. If the cookie is missing, invalid, or expired, or if the user has blocked cookies, the server will be unable to identify the user, and they will have to log in to authenticate.

#### 2. Get the authorization code
Now that the user has either granted permission to your application, verified their identity by logging in, or had their identity verified by virtue of being logged in already, the next step is to authenticate your application by sending your app credentials to the server (the app ID and secret you received when you registered your application).

If the authorization code request in Step 1 is successful, the user will be returned to your redirect URI, with a `code` parameter included in the query string portion of the URL. Your application should retrieve the code from the query string, and use it to request an access token following the steps below. If you included a `state` parameter in Step 1, the query string in the response will also contain a `state` parameter, with the same value you provided in Step 1.

#### 3. Authenticate your application
Once your application has parsed the `code` parameter from the query string, it should make a POST request to `https://login.digitallinguistics.org/token` that includes the following:

* a `Content-Type` header with a value of `application/x-www-form-urlencoded;charset=utf-8`

* a Basic Access `Authorization` header with your application ID as the username and your application secret as the password

  - To create the Authorization header, construct a string consisting of your app ID, a colon, and your app secret, with no spaces, for example: `97a80b8f-c404-4e96-8898-0e66bfcd735b:uqRoAPFbwgEBAAAAAAAAAA==`. Then encode the string in Base64. Then set the value of the Authorization header to `Basic {encoded string}`.  The result should look something like `Authorization: Basic QWxhZGRpbjpPcGVuU2VzYW1l[...]`.

* a request body containing the following parameters in URL encoded format:

Property       | Description
-------------- | -----------
`code`         | (*required*) The authorization code you received from the server.
`grant_type`   | (*required*) Must have the value `authorization_code`, indicating that you're exchanging an authorization code for an access token.
`redirect_uri` | (*required*) The redirect URI to send the access token to. Must match the redirect URI you provided in Step 1.

A complete request might look as follows:

```
POST /token HTTP/1.1
Host: login.digitallinguistics.org
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb
```

#### 4. Get the access token
If your application is successfully authenticated and the other parameters are valid, the server will return a 200 OK response with an access token and other information included as JSON data in the response body.

The parameters in the response body are:

Parameter       | Description
--------------- | ----------- |
`access_token`  | The token that allows your application to access resources in the DLx database on behalf of the user. Store this token to use with future requests.
`expires_in`    | The lifetime of the access token in seconds. Access tokens issued with the Authorization Code strategy always expire in 1 hour, so this parameter will always have a value of `3600`.
`refresh_token` | If `offline` scope was requested, and your app has sufficient permissions, this parameter will be present with a refresh token that can be used to obtain a new access token when the old one expires (or before). This prevents the user from needing to log in again.
`scope`         | The scopes granted to your application. For client applications, this will generally be `user`. For DLx-internal applications, this will often be `admin`. *NB:* The scope of the access token may not be the same as the scope you requested, if the user denies access to some of the permissions you requested. Therefore you should always check the scope parameter of this response.
`token_type`    | Will always have the value `bearer`.

An example response might look like this:

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "tGzv3JOkF0XG5Qx2TlKWIA",
  "scope": "user profile"
}
```

#### 5. Use the access token
Once you've received the access token, you can use it to access resources in the DLx database. For any requests that require the user to be logged in, you should now include the access token as part of the request. (You may include the access token in other requests as well; if the token is not required for a request, it is simply ignored.) To include the token with an HTTP request, simply add an `Authorization` header to the request, whose value is `Bearer {access_token}`. To use the token to open a web socket with DLx, simply emit an `authenticate` event, and include an object with an attribute `token` whose value is your DLx token.

#### 6. Refresh the access token
DLx access tokens issued with the Authorization Code strategy expire after 1 hour (3600 seconds). When (or before) this happens, you can obtain a new access token by sending your refresh token to the server in a POST request to `https://login.digitallinguistics.org/token` in the following manner:

* The `Content-Type` header should be set to `application/x-www-form-urlencoded;charset=utf-8`.
* The `Authorization` header should contain a Basic Access authentication string with the app ID as the username and the app secret as the password (as outlined in Step 3 above).
* The request body should contain the following parameters in URL encoded format:

Parameter       | Description
--------------- | -----------
`grant_type`    | (*required*) Should have the value `refresh_token`, indicating that a refresh token is being exchanged for a new access token.
`refresh_token` | (*required*) The refresh token you received in Step 4.

An example refresh token request might look like this:

```
POST /token HTTP/1.1
Host: login.digitallinguistics.org
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

If your application authenticates successfully, you will receive a new access token in the same format as the one you received in Step 4.

Instead of continuing to use an access token until it expires, and wait for the server to return an error, it is good practice to check whether an access token has expired before making each request to the DLx database, and refresh the token if it has.

### B. Implicit Grant
(See the full specification for the Implicit Grant strategy [here](http://tools.ietf.org/html/rfc6749#section-4.2).)

#### 1. Authenticate the user
Let the user know that you are redirecting them to the DLx website, where they will login and be asked to grant your application permission to access the database on their behalf. Then create a GET request in the following format (parameters are enclosed in curly brackets `{ }` and optional parameters are enclosed in square brackets `[ ]`):

    GET https://login.digitallinguistics.org/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=token&scope=user[&state={state}]

Parameter       | Description
--------------- | -----------
`client_id`     | (*required*) The app ID you received when registering your application.
`redirect_uri`  | (*required*) The URL that user should be returned to once authentication is complete. This value must be the same as one of the redirect URIs you entered when registering your application. The code at this URL must be capable of retrieving data from the URL query string, since this is where your authorization code will be located in the response.
`response_type` | (*required*) This should always have the value `token`, indicating that an access token is being requested.
`scope`         | (*optional*) The data your application is requesting access to. Defaults to `user`, which grants access to the resources that the user has permissions for, as well as any public resources. If your application only needs access to publicly-available resources, use the [Client Credentials Grant](c-client-credentials-grant) below. DLx-internal apps that need administrative access to the database should use the `admin` scope and the Client Credentials Grant instead.
`state`         | (*recommended*) A unique, opaque string used by your application to maintain state between the request and callback. Whatever value you provide for the `state` parameter will be returned in the response, allowing your application to both check the authenticity of the response, and use the string to lookup which user was being authenticated.

If your request is correctly formatted and successful, the user is directed to the DLx login page. If this is the first time they have accessed the DLx API with your app, they are asked whether they wish to allow your app to make requests to the database on their behalf. If they are already logged in and have already granted permission to your application, they will not have to login again, and the server will automatically redirect the user to your application's redirect URI instead.

#### 2. Get the access token
If the user has granted your app permission, they will be redirected back to the URL you specified in the `redirect_uri` parameter. In addition, the URL will contain an added hash fragment (everything after the `#` in the URL) with the following properties:

Property       | Description
-------------- | -----------
`access_token` | The requested access token. Include this with any future requests to the API.
`expires_in`   | The lifetime of the access token (in seconds). Tokens issued with the Implicit Grant strategy expire after 1 hour (3600 seconds), so this value will always be `3600`.
`scope`        | The scopes being granted to your application in the access token. This will generally be `user` for client applications, and `admin` for DLx-internal applications. *NB:* The scope of the access token may not be the same as the scope you requested, if the user denies access to some of the permissions you requested. Therefore you should always check the scope parameter of this response.
`state`        | If the `state` parameter was included in the request in Step 1, this will contain the value you provided. You should programmatically check that the value of `state` matches the value you provided in Step 1.
`token_type`   | The type of token being issued. Will have the value `bearer`.

Here is an example redirect URL with the added hash fragment:

    http://myapplication.com/oauth.html#access_token=a1b2c3d4e5&expires_in=3600&scope=user&state=1234567890&token_type=bearer

Your redirect page should include script that examines the URL, parses the hash, checks the state (if provided), and stores the access token to make future requests with.

#### 3. Use the access token
Once you've received the access token, you can use it to access resources in the DLx database. Include the access token by adding an `Authorization` header to the request, whose value is `Bearer {access_token}`.

#### 4. Request a new token
The lifetime of an access token issued during the Implicit Grant strategy is 1 hour (3600 seconds). After the token expires, attempts to access the API using the same token will return an error. When this happens, simply request a new token following Step 1 above.

If you request a new token before the old one expires, and the user is still logged in, you will be sent a new token automatically, without the user having to log in again. Users are automatically logged out of DLx if they have not been active in four hours. Therefore it is best practice to check whether the access token is expired before each request to the DLx database, and request a new one if it is.


### C. Client Credentials Grant
(See the full specification for the Client Credentials Grant strategy [here](http://tools.ietf.org/html/rfc6749#section-4.4).)

#### 1. Request an access token
Create a POST request to `https://login.digitallinguistics.org/token` with the following details:

* The `Content-Type` header should be set to `application/x-www-form-urlencoded;charset=utf-8`.

* The `Authorization` header should contain a Basic Access string with your app ID as the username and your app secret as the password.
  - To create the Authorization header, construct a string consisting of your app ID, a colon, and your app secret, with no spaces, for example: `97a80b8f-c404-4e96-8898-0e66bfcd735b:uqRoAPFbwgEBAAAAAAAAAA==`. Then encode the string in Base64. Then set the value of the Authorization header to `Basic {encoded string}`.  The result should look something like `Authorization: Basic QWxhZGRpbjpPcGVuU2VzYW1l[...]`.

* The request body should contain a URL encoded string with the following parameters:

Parameter    | Description
------------ | -----------
`grant_type` | (*required*) Value must be set to `client_credentials`, indicating that your application credentials are being sent in exchange for an access token.
`scope`      | (*optional*) Defaults to `public`. A scope of `user` will be denied access (use one of the other authentication strategies to authenticate a user and access resources on their behalf). Use `admin` for administrative access to the database (DLx-internal applications only).

An example request might look as follows:

```
POST /token HTTP/1.1
Host: login.digitallinguistics.org
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

#### 2. Get the access token
(See [Step 4](#4-get-the-access-token) of the Authorization Code Grant type above.)

#### 3. Use the access token
Once you've received the access token, you can use it to access resources in the DLx database. With the Client Credentials authentication strategy, your application will only be able to access publicly-available resources with the access token. To include the token with the request, simply add an `Authorization` header to the request, whose value is `Bearer {access_token}`.

Access tokens issued with the Client Credentials Grant do not expire, and may be used for as long as your application needs. However, it is a good idea to refresh your application's access token regularly to minimize risk of the token being acquired and used by a third party.

### D. Delegated Authentication

#### 1. Direct the user to the DLx login page
Redirect the user to `https://login.digitallinguistics.org/authenticate`, and include a `redirect_uri` parameter in the querystring with the URL that the user should be returned to when complete.

#### 2. Retrieve the user cookie
Once the user is redirected back to the original subdomain, a signed cookie called `user` should be set to the user's email, which you can use to retrieve the user from the DLx database.

## Handling Errors

Sometimes the requests you make during authentication will return an error. This can happen for a variety of reasons - incorrectly formatted URLs, bad request parameters, etc. If the redirect URI is invalid, the user will be directed to a generic error page with more information about the error. Otherwise, the server will return an error response with a JSON-format string in the body containing two parameters: an `error` parameter indicating the type of error, and an `error_description` parameter with a more detailed description of the problem. A `state` parameter is also included if a `state` was provided by your application. A list of possible values for the `error` parameter can be viewed [here](http://tools.ietf.org/html/rfc6749#section-5.2).
