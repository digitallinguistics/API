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
- Cannot be edited without permission
- Cannot be deleted without permission
- Display pseudonyms rather than real names
- Display their public metadata
- Do not display their private metadata
- Do not display personal information (except for public metadata)
- Could possibly be plagiarized or copied without permission (as with any publication)

## II. How to Use the API Service

### a. Registering Your App with the API
Before your app can interact with the DLX API, you'll need to register your app with the service. Do this by going to https://dlx.azurewebsites.net/developer and clicking `Register New Application`. Once your app is registered, you'll be provided with a client ID (the unique ID for your application). Save this ID - you'll need it to authenticate users later. You can also view your app's client ID at any time by returning to the API [developer page])(https://dlx.azurewebsites.net/developer).

### b. Authenticating Users
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

##### 4. Request a new token when the old one expires
The lifetime of an API access token is 1 hour (3600 seconds). After the token expires, attempts to access the API using the same token will return an error. When this happens, simply request a new token following Step 1 above. If the user is still logged into DLX, you will receive the new token automatically, without the user having to login again. Users are automatically logged out of DLX after 8 hours.

##### Handling Errors During Authentication
Sometimes the request you made in Step 1 will return an error. This can happen for a variety of reasons - incorrectly formatted URLs, bad request parameters, etc. If this happens, the user will be returned to the redirect URL, along with two querystring parameters: an `error` parameter indicating the type of error, and an `error_description` parameter with a more detailed description of the problem. A `state` parameter is also included if a `state` was provided in Step 1. A list of possible values for the `error` parameter can be viewed [here](http://tools.ietf.org/html/rfc6749#section-4.2.2.1).

### c. Making Requests to the API
### d. Handling Responses from the API



#### URI Syntax
- https://dlx.azurewebsites.net/v1/{collection}
- https://dlx.azurewebsites.net/v1/{collection}/{itemID}
- https://dlx.azurewebsites.net/v1/bundles/{bundleID}/items/{itemID}
- https://dlx.azurewebsites.net/v1/lexicons/{lexiconID}/entries/{entryID}
- https://dlx.azurewebsites.net/v1/texts/{textID}/phrases/{phraseID}

#### HTTPS
All programmatic requests to the DLX API should use HTTPS protocol rather than HTTP.

#### Host
The hostname for requests to the DLX API should always be `dlx.azurewebsites.net`.

#### Headers
- Accept
- Authorization

#### Path
Requests to the DLX database should include the API version number in the URL, immediately following the hostname, e.g. `https://dlx.azurewebsites.net/v1/...`.

#### Querystring
#### Request Body

### Getting Responses from the API
#### Response Headers &amp; Status Codes
- 200: Operation successful.
- 201: Upsert successful.
- 204: Delete operation successful.
- 207: Some resources unauthorized or not found.
- 400: Bad request. The request URL, headers, or body are invalid.
- 401: `Authorization` header missing or invalid.
- 403: Authorization token expired.
- 404: Not found.
- 405: Method not allowed.
- 500: Internal server error. [Open an issue.](https://github.com/digitallinguistics/dlx-api/issues)

#### Response Body
Requests to the DLX database always return a JSON object with a `status` attribute and either a `data` attribute (for successful requests) or a `message` attribute (for errors). Attributes in the response body include:

* `data`: an array containing the requested data for successful requests
* `details`: a more specific error message for help in debugging unsuccessful requests
* `included`: in the future, this attribute may be used to include related resources with the response
* `message`: a generic error message for unsuccessful requests
* `status`: contains the HTTP status code (as numeric)

## Technical Notes

* The DLX database uses [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/api/) to provide the API, and [Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) to store and query resources in the database.

* The API server is written in [Node](https://nodejs.org/en/) using the [Express](https://www.npmjs.com/package/express) web framework.

* The DLX API server implements the [Implicit grant type](http://tools.ietf.org/html/rfc6749#section-4.2) of the [OAuth 2.0 specification](http://tools.ietf.org/html/rfc6749) for authentication. In the future the [Authorization Code grant type](http://tools.ietf.org/html/rfc6749#section-4.1) may be implemented as well. For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki.

* Database resources are described in [JSON Schema](http://json-schema.org/) format. For more information on JSON Schema, check out this [excellent guide](http://spacetelescope.github.io/understanding-json-schema/) from the [Space Telescope Science Institute](http://www.stsci.edu/).

* The API structure is described in [Swagger](http://swagger.io/specification/) format.
