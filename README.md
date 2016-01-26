# WARNING
This package is still under development. The version number will be incremented to v1.0.0 when this package is production-ready.

# The Digital Linguistics (DLX) API
This repository contains the source code and documentation for the DLX API, a service that allows software developers to programmatically access the DLX database. By sending requests to the API, developers can add, update, delete, or retrieve resources in the database using code. This page describes the structure of the DLX database and the resources in it, how to register your app with the API service, how to authenticate users so that they may access resources, how to properly format requests to the database, and how to handle responses from the database.

If you are writing your application using JavaScript, consider using the [DLX JavaScript SDK](https://github.com/digitallinguistics/dlx-js#dlx-javascript-sdk), a JavaScript module which contains a number of convenient methods for interacting with the DLX API, and handles most of the details on this page. See the [`dlx-js` GitHub repository](https://github.com/digitallinguistics/dlx-js#dlx-javascript-sdk) for more information on how to install and use this SDK.

## I. About the Database

### Collections &amp; Resource Types
The DLX database contains several types of resources, such as texts, lexicons, and media. There are separate collections ('tables') for each type of resource in the database, shown below. The DLX API allows users to perform various operations on the resources in these collections, depending on the type of resource and whether the user has permission to perform that operation. For example, a user may add a text to the `texts` collection or, if they have `Owner` permission for that text, update or delete that text.

Each item in a collection must be formatted according to the Digital Linguistics (DLX) data format specification. This is a standard format developed by [Patrick J. Hall](http://www.linguistics.ucsb.edu/people/patrick-hall) &amp; [Daniel W. Hieber](http://danielhieber.com) ([University of California, Santa Barbara Linguistics](http://www.linguistics.ucsb.edu/)) for exchanging linguistic data on the web. You can read more about this format [here](http://digitallinguistics.github.io/). If the user requests to add a resource to the database that is improperly formatted, the request returns an error and the resource is not uploaded. Click on any resource type to see its DLX specification.

Some types of resources contain subitems that may also be accessed with the API. For example, texts contain phrases, and so a user may request one or more phrases from a text, rather than having to request the entire text at once. Subitems in a collection are shown following a `>`.

* [bundles](http://digitallinguistics.github.io/docs/bundle) > [items](http://digitallinguistics.github.io/docs/bundle#items)
* [languages](http://digitallinguistics.github.io/docs/language)
* [lexicons](http://digitallinguistics.github.io/docs/lexicon) > [lexicon entries](http://digitallinguistics.github.io/docs/lexicon#lexEntries)
* [locations](http://digitallinguistics.github.io/docs/location)
* [media](http://digitallinguistics.github.io/docs/media)
* [persons](http://digitallinguistics.github.io/docs/person)
* [projects](http://digitallinguistics.github.io/docs/project)
* [texts](http://digitallinguistics.github.io/docs/text) > [phrases](http://digitallinguistics.github.io/docs/text#phrases)

### Permissions
Every resource in the database is given a set of permissions specifying who is allowed to view, edit, add/delete, or change permissions for that resource. There are three types of permissions that a user can have:

#### User Roles
* `Owner`: The user has full permissions to view, edit, delete, or change permissions for a resource. A user is automatically made an Owner for any resource they create. If a participant in a resource uses a pseudonym, both their real name and pseudonym are shown to the user.

* `Contributor`: The user has permission to view or edit the resource, but may not delete it or change its permissions. If a participant in a resource uses a pseudonym, both their real name and pseudonym are shown to the user.

* `Viewer`: The user may view the resource, but cannot change it or its permissions in any way. If a participant in a resource uses a pseudonym, only the pseudonym is shown; their real name is hidden from the user.

In addition to individual user permissions, resources can be made either Public or Private. Public resources may be viewed (but not edited) by anyone, even if they are not listed as a Viewer. Private resources may only be viewed by those with the appropriate permissions. Here are some additional things to note about Public resources:

#### Public Resources
- Can be downloaded
- Can be viewed
- Can be shared on social media
- Can be added to other users' projects
- Cannot be edited without permission
- Cannot be deleted without permission
- Display pseudonyms rather than real names
- Display their public metadata
- Do not display their private metadata
- Do not display personal information (except for public metadata)
- Could possibly be plagiarized or copied without permission (as with any publication)

Public resources can sometimes become Community resources. This happens when the Owner of the resource gives up the Owner permission, but opts to leave the resource Public. When this happens, the original Owner can no longer delete the resource or set its visibility to private. The resource may now only be deleted by a DLX Administrator (or perhaps in the future, some kind of Community Moderator).

## II. How to Use the API Service

### A. Registering Your App with the API
Before your app can interact with the DLX API, you'll need to register your app with the service. Do this by going to https://dlx.azurewebsites.net/developer and clicking `Register New Application`. Once your app is registered, you'll be provided with a client ID (the unique ID for your application). Save this ID - you'll need it to authenticate users later. You can also view your app's client ID at any time by returning to the API [developer page])(https://dlx.azurewebsites.net/developer).

### B. Authenticating Users
Some of the resources in the DLX database are publicly available, and require no special permission to access. Other resources are private, and require the user to be logged into the DLX database to access them. Any requests to create, edit, or delete resources also requires the user to be logged in. So before making these kinds of requests, you will need to authenticate the user with the API service following the steps below.

*Technical Note:* The DLX API server implements the [Implicit grant type](http://tools.ietf.org/html/rfc6749#section-4.2) of the [OAuth 2.0 specification](http://tools.ietf.org/html/rfc6749) for authentication. (In the future the [Authorization Code grant type](http://tools.ietf.org/html/rfc6749#section-4.1) may be implemented as well.) Note that a `scope` parameter is *not* required during the authorization process (all access tokens have the same default scope). For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki.

#### Authentication Process
(Adapted from *[Getting started with OAuth 2.0: Programming clients for secure web API authorization and authentication](http://shop.oreilly.com/product/0636920021810.do)* by Ryan Boyd)

##### 1. Let the user know what you're doing and request authorization from the API
Let the user know that you are redirecting them to the DLX website, where they will login and be asked to grant your application permission to access the database on their behalf. Then create a GET request in the following format (parameters are enclosed in curly brackets `{ }` and optional parameters are enclosed in square brackets `[ ]`):

    GET https://dlx.azurewebsites.net/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=token[&state={state}]

| Parameter       | Description |
| --------------- | ----------- |
| `client_id`     | (*required*) The unique client ID you received when registering your application. |
| `redirect_uri`  | (*required*) The location the user should be returned to after they finish granting permission to your application. |
| `response_type` | (*required*) Indicates that an access token is being requested. This should always have the value `token`. |
| `state`         | (*recommended*) A unique random string for this particular request, unguessable and kept secret in the client. Used to prevent CSRF attacks. |

If your request is correctly formatted and successful, the user is directed to the DLX login page. If this is the first time they have accessed the DLX API with your app, they are asked whether they wish to allow your app to make requests to the database on their behalf.

##### 2. Get the access token from the redirect URL
If the user has granted your app permission, they will be redirected back to the URL you specified in the `redirect_uri` parameter. In addition, the URL will contain an added hash fragment (everything after the `#` in the URL) with the following properties:

| Property       | Description |
| -------------- | ----------- |
| `access_token` | The requested access token. Include this with any future requests to the API. |
| `expires_in`   | The lifetime of the access token (in seconds). Once the token expires, the user will have to reauthenticate. |
| `state`        | If the `state` parameter was included in the request in Step 1, this will contain the value you provided. You should programmatically check that the value of `state` matches the value you provided in Step 1 to prevent CSRF attacks. |

Here is an example redirect URL with the added hash fragment:

    http://myapplication.com/oauth.html#access_token=a1b2c3d4e5&expires_in=3600&state=1234567890

Your redirect page should include script that examines the URL, parses the hash, checks the state (if provided), and stores the access token for make future requests.

##### 3. Include the access token in requests to the API
For any requests that require the user to be logged in, you should now include the access token you received in Step 2 as part of the request. (You may include the access token in other requests as well; if the token is not required for a request, it is simply ignored.) To include the token with the request, simply add an `Authorization` header to the request, whose value is `bearer {access_token}`.

##### 4. Request a new token when the old one expires (or before)
The lifetime of an API access token is 1 hour (3600 seconds). After the token expires, attempts to access the API using the same token will return an error. When this happens, simply request a new token following Step 1 above. If the user is still logged into DLX, you will receive the new token automatically, without the user having to login again. Users are automatically logged out of DLX if they have not been active in four hours.

If you request a new token before the old one expires, you will be sent a new one automatically (as long as the user is still logged in). Therefore you can keep the user logged in by simply requesting a new token every hour (or 59 minutes, etc.).

##### Handling Errors During Authentication
Sometimes the request you made in Step 1 will return an error. This can happen for a variety of reasons - incorrectly formatted URLs, bad request parameters, etc. If this happens, the user will be returned to the redirect URL, along with two querystring parameters: an `error` parameter indicating the type of error, and an `error_description` parameter with a more detailed description of the problem. A `state` parameter is also included if a `state` was provided in Step 1. A list of possible values for the `error` parameter can be viewed [here](http://tools.ietf.org/html/rfc6749#section-4.2.2.1).

### C. Making Requests to the API

#### URL Syntax
Each resource and collection in the database corresponds to a different URL. Requests made to that URL can be used to perform various operations on that resource or collection. For example, the text with an ID of `17` can be retrieved by sending a GET request to https://dlx.azurewebsites.net/v1/texts/17, and a lexicon can be added to the database by sending a PUT request to https://dlx.azurewebsites.net/v1/lexicons. Below is a set of schemas showing how to format URLS for different types of operations:

* Operations on a collection: https://dlx.azurewebsites.net/v1/{collection}
* Operations on an item: https://dlx.azurewebsites.net/v1/{collection}/{itemId}
* Operations on a subitem (not available for all collections): https://dlx.azurewebsites.net/v1/{collection}/{itemId}/{subItemType}/{subItemId}

Some examples:
- https://dlx.azurewebsites.net/v1/texts
- https://dlx.azurewebsites.net/v1/texts/17
- https://dlx.azurewebsites.net/v1/texts/17/phrases/4

A complete list of the operations that can be performed on each type of resource and collection is available [here](https://dlx.azurewebsites.net/docs/api).

Because the API uses regular URLs, GET requests (but not other operations) can be made simply by typing the URL into the browser. Since GET requests return an HTML representation of the resource by default, the user will see an HTML page with the requested resources. If the resource has its permissions set to `public`, the text/html response allows users to share a visual representation of a resource using the static link for that resource. If its permissions are set to `private`, only authorized users will be able to view the HTML page. Unauthorized users will simply see an error message if they try to open the link. For requests to a collection, a summary of the DLX resources in that collection will be returned. For requests for multiple resources, a list of links to the individual resources will be returned.

The other way to send requests to the API is to programmatically construct an HTTP request and send it to the appropriate URL. Below is information explaining how to format each part of your requests to the API.

#### Parts of the Request

* ##### Protocol
All requests to the DLX API should use HTTPS protocol rather than HTTP.

* ##### Host
The hostname for requests to the DLX API should always be `dlx.azurewebsites.net`.

* ##### Headers
Certain requests to the API take optional or required headers. The following headers are used:

| Header        | Description |
| ------------- | ----------- |
| Accept        | Indicates whether the response should be an HTML (`text/html`) or JSON `application/json` representation of the resource(s). Defaults to `text/html`. |
| Authorization | Required for most operations, and for accessing private resources. Should contain the access token you received from the API during authentication, in the format `bearer {access_token}`. |

* ##### Path
Requests to the DLX API should include the API version number immediately after the hostname, like so: `https://dlx.azurewebsites.net/v1/`. The rest of the path should follow the URL syntax outlined above. The current version of the API is `v1`.

* ##### Querystring
Many requests to the API take optional or required querstring parameters. These are added to the end of the URL following a `?`, in the format `{parameter}={value}`. For example, the URL https://dlx.azurewebsites.net/v1/texts?ids=1,2,17,43,44,62 will retrieve texts with IDs 1, 2, 17, 43, 44, and 62 from the database. Be sure to encode the querystring as a URI component (using a method such as JavaScript's `encodeURI Component`) to avoid errors due to spaces or special characters. For a complete list of which query parameters are accepted for which types of requests, visit the [API documentation](https://dlx.azurewebsites.net/docs/api).

* ##### Body
The body of the request should contain any resources to be uploaded to the database, in the [DLX JSON data format](https://github.com/digitallinguistics/digitallinguistics.github.io).

### D. Handling Responses from the API
If the request is successful, the API will return a response with a `2xx` status and a JSON object in the response body. A `WWW-Authenticate` header may also be included for invalid authorization requests.

Unsuccessful requests will return a response with a `4xx` or `5xx` status, as well as a JSON object in the response body containing additional details about the error.

The response body may contain the following attributes:

| Attribute  | Description |
| ---------- | ----------- |
| `data`     | (2xx responses only) an array containing the requested data for successful requests |
| `error_description`  | (4xx or 5xx responses only) a more specific error message for help in debugging unsuccessful requests |
| `error`  | (4xx or 5xx responses only) a generic error message for unsuccessful requests   |
| `included` | (2xx responses only) in the future, this attribute may be used to include related resources with the response |
| `status`   | (all responses) contains the HTTP status code (as numeric) |

#### Response Headers &amp; Status Codes
The following status codes are used in responses from the API. Your application should be prepared to handle any of these response types.
- 200: Operation successful.
- 201: Upsert successful.
- 204: Delete operation successful.
- 207: Some resources unauthorized or not found.
- 400: Bad request. The request URL, headers, or body are invalid.
- 401: `Authorization` header missing or invalid.
- 403: Unauthorized. (Insufficient user permissions.)
- 404: Not found.
- 405: Method not allowed.
- 409: Data conflict.
- 419: Authorization token expired.
- 500: Internal server error. [Open an issue.](https://github.com/digitallinguistics/dlx-api/issues)

## III. Technical Notes

* The DLX database uses [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/api/) to provide the API, and [Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) to store and query resources in the database.

* The API server is written in [Node](https://nodejs.org/en/) using the [Express](https://www.npmjs.com/package/express) web framework.

* The DLX API server implements the [Implicit grant type](http://tools.ietf.org/html/rfc6749#section-4.2) of the [OAuth 2.0 specification](http://tools.ietf.org/html/rfc6749) for authentication. In the future the [Authorization Code grant type](http://tools.ietf.org/html/rfc6749#section-4.1) may be implemented as well. For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki.

* Database resources are described in [JSON Schema](http://json-schema.org/) format. For more information on JSON Schema, check out this [excellent guide](http://spacetelescope.github.io/understanding-json-schema/) from the [Space Telescope Science Institute](http://www.stsci.edu/).

* The API structure is described using the [Swagger](http://swagger.io/specification/) format for describing APIs.
