# The Digital Linguistics (DLx) API
This repository contains the source code and documentation for the DLx API, a service that allows software developers to programmatically access the DLx database. By sending requests to the API, developers can add, update, delete, or retrieve resources in the database. This readme includes the following information:

  - the structure of the DLx database and the resources in it
  - how to register your app with the API service
  - how to authenticate users so that your application may access resources on their behalf
  - how to make requests to the database
  - how to handle responses from the database

There are two ways your application can connect to the database:
1. the REST API, using HTTP requests to URLs
2. the Socket API, using a web socket connection

**[View the complete reference documentation for the REST API here.][3]**

If you are writing your application using JavaScript or Node, consider using the [JavaScript library][1] or [Node library][2] to access the database. These libraries contain a number of convenient methods for interacting with the DLx API, and handle most of the details on this page for you automatically.

**NB:** The API always returns JSON data. If you would like to see HTML representations of the data instead, use the [Data Explorer][11].

## Contents
* [I. About the Database](i-about-the-database)
* [II. App Registration](ii-app-registration)
* [III. Using the REST API](iii-using-the-rest-api)
* [IV. Using the Socket API](iv-using-the-socket-api)

## I. About the Database

### Resources
The DLx database contains several types of resources relating to linguistic data, such as texts, lexicons, and media. The DLx API allows users to perform various operations on these resources, depending on the type of resource and whether the user and the application have permission to perform that operation. For example, a user may add a text to the database or, if they have `Owner` permission for that text, update or delete that text.

Each item in the database must be formatted according to the Digital Linguistics (DLx) data format. This is a standard format in JSON for exchanging linguistic data on the web (you can read more about this format [here][4]). If your application attempts to add data to the database that is improperly formatted, the request will return an error and the operation will not be completed.

Some types of resources contain subitems that may also be accessed with the API. For example, texts contain phrases, so a user may request one or more phrases from a text, rather than having to request the entire text at once.

#### Resource Properties
- **IDs (`id`):** Each resource in the database is given a unique ID which cannot be altered or set by your application. If you attempt to create a new resource with an `id` property, the API will return an error. (If you are just updating a resource, however, including the `id` property will not throw an error.) If your application needs to maintain its own set of IDs, it is recommended that you create a `cid` (Client ID) property for that purpose.

- **URL (`url`):** The `url` property of a resource is a unique URL where that resource can be accessed, or used to perform different operations on the resource.

- **ETag (`_etag`):** Each resource in the database has an `_etag` property. This property can be used along with the `If-Match` or `If-None-Match` headers to ensure that you have the most up-to-date version of the resource before making any changes to it.

- **Empty Properties:** If a property of a resource is empty (i.e. an empty string, array, or object), it will often be removed when it is added to the database. This helps keep the size of the files in the database relatively small. So if you save a resource with a `"myProperty": ""` attribute to the database, and then retrieve that resource from the database, the `myProperty` attribute will be undefined rather than an empty string.

### Permissions
Every resource in the database is given a set of permissions specifying who is allowed to delete, edit, or view that resource. There are three types of permissions that a user can have:

* `Owner`: The user has full permissions to view, edit, delete, or change permissions for a resource. A user is automatically made an Owner for any resource they create. A resource may have multiple Owners. A user with Owner permission for a Person resource will be able to see both the real name and the pseudonym of that Person.

* `Contributor`: The user has permission to view or edit the resource, but may not delete it or change its permissions. A user with Contributor permission for a Person resource will be able to see both the real name and the pseudonym of that Person.

* `Viewer`: The user may view the resource, but cannot change it or its permissions in any way. Users with Viewer permissions for a Person resource will only be able to see the pseudonym of that Person.

In addition to individual user permissions, resources can be made either `Public` or `Private`. Resources are private by default. Public resources may be viewed (but not edited) by anyone, even if they are not listed as a Viewer. Private resources may only be viewed by those with the appropriate permissions. Here are some additional things to note about Public resources:

#### Public Resources
- Can be downloaded
- Can be viewed
- Can be shared on social media
- Cannot be edited without permission
- Cannot be deleted without permission
- Display pseudonyms rather than real names
- Display public metadata
- Do not display private metadata
- Do not display personal information (except for public metadata)
- Could possibly be plagiarized or copied without permission (as with any publication)

### Concurrency
*Concurrency* refers to how a database deals with simultaneous operations, i.e. if you and another person both make updates to the same resource. The DLx API supports *optimistic concurrency*, providing you with a way to easily check whether you have the most up-to-date version of a resource before making changes to it, and to avoid having to retrieve the same resource multiple times. Details on how to use optimistic concurrency with the REST API and Web Socket API are below.

**Note:** The DLx API does not use the `dateModified` field for concurrency, and does not update this field automatically. Your application is free to change the `dateModified` field as appropriate.

## II. App Registration
Before your app can interact programmatically with the DLx database API, you must register your application. Once registered, you will be provided with a client ID and a client secret which you can use to authenticate your app with the API service. It is important to keep both of these confidential, so that others cannot access DLx resources using your credentials.

DLx manages application registration through [Auth0][5]. In order to register your application, you will need to send a request to `https://digitallinguistics.auth0.com/oidc/register`, following the steps in [this documentation][6]. Be sure to save your client ID and client secret when you receive a the response from Auth0. You do not need to follow the instructions in the "Configure Your Client" section of Auth0's documentation at this time (though you will need to do so later in order to access the DLx API).

### III. Using the REST API

#### Authentication
Once you've registered your application, you can use your client ID and secret to request access tokens that allow your application to access the DLx database. The type of access token you request determines which databases resources your application is allowed to access.

Most of the time your application will request a token that provides access to a specific user's data. To do this, your application will direct the user to the DLx login page, where the user logs in and grants your application permission to access their data. The login page then sends your application an access token keyed to that specific user. Your application must include that access token with any future requests to the DLx API. The token allows your application to access to that user's resources (and only that user's resources - separate access tokens must be requested for each user). Follow the steps in either the [Authorization Code Grant](a-authorization-code-grant) or [Implicit Grant](b-implicit-grant) sections to receive this type of token.

Some DLx resources are publicly available, and do not require user permissions to access. To request an access token for public resources, you simply provide your client ID and client secret. Follow the steps in the [Client Credentials Grant](c-client-credentials-grant) to receive this type of token.

DLx uses [Auth0][5] to log in users and issue access tokens. Requests for tokens must be sent to the domain `digitallinguistics.auth0.com`.

##### Authentication Strategies
There are three ways to request tokens for use with the DLx API service:

* **[Authorization Code](#a-authorization-code-grant):** A two-step process where you first authenticate the user, and then your application. This is the preferred method of authentication, and should be used whenever possible. It is best suited to server-side applications. Follow [these directions][7] to authenticate using this strategy.

* **[Implicit](#b-implicit-grant):** A single-step process where you authenticate the user and the client simultaneously. This method is less secure because the DLx access token is provided in the redirect URI, and therefore visible to the user. However, this authentication strategy is well-suited to client-side (browser) applications. Follow [these directions][8] to authenticate using this strategy.

* **[Client Credentials](#c-client-credentials-grant):** A single-step process where you authenticate your application and immediately receive an access token, without authenticating the user. In this strategy, your app will only have access to publicly-available resources. This is most useful when your app is acting on behalf of the app itself rather than on behalf of any particular user. Follow [these directions][9] to authenticate using this strategy.

##### Scopes
Every access token has associated *scopes* specifying the kinds of resources your application is requesting access to. Your application may only use scopes that it has been given permission to use. The scopes that can be requested are:

Scope            | Description
---------------- | -----------
`admin`          | Administrative access to all resources in the database. This scope subsumes all other scopes, so it is not necessary to include any other scopes in the request. This should only be used with the Client Credentials authorization strategy. (For DLx-internal applications only. Requests for `admin` scope from third-party applications will be denied.)
`offline_access` | (*requires user permission*) Access to a user's resources even when the user is offline.
`public`         | Access to any public resources in the database. Data cannot be added, deleted, or modified using the `public` scope, only retrieved.
`user`           | (*requires user permission*) Access to all the resources that the authenticated user has permissions to view, including public resources. This scope subsumes the `public` scope, so it is not necessary to include both.

##### Using Access Tokens
Once your application receives an access token, it can begin making requests to the DLx API. There are two ways to interact with the database: via the REST API or via web sockets. If your application is using the REST API, it should include the access token in the `Authorization` header of the request, in the format `Bearer YOUR_ACCESS_TOKEN`. To use the token via web sockets, simply emit an `authenticate` event, and include a `token` attribute in the payload, like so: `{ token: YOUR_ACCESS_TOKEN }`

##### Handling Authentication Errors
Sometimes the requests you make during authentication will return an error. This can happen for a variety of reasons - incorrectly formatted URLs, bad request parameters, etc. If the redirect URI is invalid, the user will be directed to a generic error page with more information about the error. Otherwise, the server will return an error response with a JSON-format string in the body containing two parameters: an `error` parameter indicating the type of error, and an `error_description` parameter with a more detailed description of the problem. A `state` parameter is also included if a `state` was provided by your application. A list of possible values for the `error` parameter can be viewed [here][10].

#### Making Requests to the REST API
Once you have [registered your application](ii-app-registration) and [received an access token](iii-authentication), you are ready to make requests to the database. To use the REST API, your application will need to construct requests to various URLs that map to different kinds of resources in the database. The following sections outline how these requests work.

##### URL Syntax
Each resource in the database corresponds to a different URL. For example, the language with an ID of `17` would be accessible at the URL `https://api.digitallinguistics.io/languages/17` (this URL is stored in the `url` property of every resource in the database). The type of request you make to the URL (i.e. either DELETE, GET, or PATCH) indicates the type of operation you are performing on the resource. For example, a GET request to the above URL would retrieve that Language, while a DELETE request would delete it (if the user has sufficient permissions).

The following table shows the different operations that can be performed on a resource.

Method | Description
------ | -----------
DELETE | Deletes the resource
GET    | Retrieves the resource
PATCH  | Updates the resource

You can also perform operations on multiple resources at once by sending requests to the entire collection (the first part of the path, e.g. `/languages` or `/lexicons`).

You can retrieve multiple items at once by making a GET request to a collection. For example, a GET request to `https://api.digitallinguistics.io/languages` will retrieve all the Languages that the currently-authenticated user has permission to access.

You can create new items in a collection or overwrite existing ones by making a POST or PUT request to the collection. For example, a POST request to `https://api.digitallinguistics.io/languages` with a Language object in the body will add that Language object to the database.

The following operations are available on most collections (see the full [API reference documentation][3] for exceptions).

Request Format                                        | Operation
----------------------------------------------------- | ---------
`GET https://api.digitallinguistics.io/{collection}`  | Retrieve items from the collection
`POST https://api.digitallinguistics.io/{collection}` | Create a new item in the collection
`PUT https://api.digitallinguistics.io/{collection}`  | Upsert (add/update) an item to the collection

**[View the complete reference documentation for the REST API here.][3]**

##### Versioning
The DLX REST API is versioned, so that applications can continue using older versions of the API as new versions come out. If no version is specified, requests to the API default to the most current version. To specify a version, simply include the version number in the form of `/vX` immediately after the domain. For example, `https://api.digitallinguistics.io/v1/languages` is a request to version 1 of the API, while `https://api.digitallinguistics.io/v2/languages` is a request to version 2.

##### Operations on Subitems **NOT YET SUPPORTED**
Certain resources contain subitems or references to other resources. These can often be accessed by appending additional segments to the URL. For example, to retrieve all the phrases in a text, you would make a GET request to `https://api.digitallinguistics.io/texts/{text}/phrases`. To retrieve a specific phrase from a text, you would make a GET request to `https://api.digitallinguistics.io/texts/{text}/phrases/{phrase}`. In general, the format for performing operations on collections of subitems or individual subitems is as follows:

* Operations on collections of subitems: `https://api.digitallinguistics.io/{collection}/{item}/{subitems}`
* Operations on individual subitems: `https://api.digitallinguistics.io/{collection}/{item}/{subitems}/{subitem}`

A complete list of the operations that can be performed on each type of resource and collection is available [here][3].

##### Operations on Permissions **NOT YET SUPPORTED**
To add or delete permissions for an object, simply make a POST or DELETE request to the resource URL with `/permissions` appended to the end. For example, to add a new permission for a text with the ID `17`, you would make a PUT request to `https://api.digitallinguistics.io/texts/17/permissions`.

##### Parts of the Request

* ###### Protocol
All requests to the DLx REST API should use HTTPS protocol rather than HTTP.

* ###### Host
The hostname for requests to the DLx REST API should always be `api.digitallinguistics.io`.

* ###### Headers
Every request to the REST API requires an Authorization header, which should contain the access token you received from `login.digitallinguistics.io` during authentication, in the format `Bearer {access_token}`.

The REST API also supports the following headers:

* `If-Match`: It is generally a good idea to check whether you have the most recent version of a resource before attempting to update or delete it in the database. The DLx API allows you to do this by including an `If-Match` header with a PUT or DELETE request, whose value is the ETag (`_etag` property) of the resource you wish to change. If you already have the most up-to-date version of the resource, it will be updated/deleted as normal. If your version of the resource is out of date, the API will return a `412: Precondition Failed` error. Your application can then retrieve the most recent version of the resource from the database, and try making the change again.

* `If-None-Match`: It is also a good idea to check whether you already have the latest version of a resource before retrieving it from the database again. This helps cut down on bandwidth, since the resource doesn't have to be sent to your application multiple times. To check whether you already have the latest version of a resource, include an `If-None-Match` header in the GET request, whose value is the ETag (`_etag` property) of the resource you wish to retrieve. If you already have the most up-to-date version of the resource, the API will return a `304: Not Modified` response. Otherwise, the requested resource will be returned as normal.

* `If-Modified-Since`: If you are requesting multiple resources, you can include a `If-Modified-Since` header to return only the resources modified since the timestamp in the header. The timestamp should be a valid UTC string ([see MDN for more documentation][13]).

* ###### Path
Requests to the DLx API may optionally include the API version number immediately after the hostname, like so: `https://api.digitallinguistics.io/v1/`. The rest of the path should follow the URL syntax outlined above. If the version number is omitted, the service defaults to the latest version of the API.

* ###### Querystring **NOT YET SUPPORTED**
Many requests to the API take optional or required querystring parameters. These are added to the end of the URL following a `?`, in the format `{parameter}={value}`. For example, the URL `https://api.digitallinguistics.io/texts?fields=id,title,` will retrieve all the user's texts, but only return the ID and title fields for each text. Be sure to encode the querystring as a URI component (using a method such as JavaScript's `encodeURIComponent`) to avoid errors due to spaces or special characters. For a complete list of which query parameters are accepted for which types of requests, visit the [API documentation][3].

* ###### Body
The body of the request should contain any resources to be uploaded to the database, in [DLx data format][4] (JSON).

#### Handling Responses from the REST API
If the request is successful, the API will return a response with a `2xx` status and JSON data in the response body (or sometimes a `3xx` status and no response body, if an `If-None-Match` header was included).

The response may also include a `Last-Modified` header, containing a timestamp of the last time that the resource was modified, in UTC format.

Unsuccessful requests will return a response with a `4xx` or `5xx` status, and sometimes a JSON object in the response body containing additional details about the error. A `WWW-Authenticate` header may also be included for invalid authorization requests.

An error response body may contain the following attributes:

Attribute           | Description
------------------- | -----------
`status`            | the HTTP status code (as numeric)
`error`             | a generic error code
`error_description` | a more specific error message for help in debugging unsuccessful requests

##### Paging
By default, most endpoints in the DLx REST API will return all the results of a request in a single response (some endpoints, such as `/lexemes`, return only 100 by default). You can set the number of results to return in a response (the *page size*) by including a `dlx-max-item-count` header in the request, whose value is the number of results you want returned for each request (between 1 and 1000).

If the request finds more items than the page size, a continuation token will be returned with the response in the `dlx-continuation` header, along with the first set of results. You can then send this continuation token with your next request (in the `dlx-continuation` header) to retrieve the next set of results.

##### Status Codes
The following status codes are used in responses from the REST API. Your application should be prepared to handle any of these response types.

Status | Description
------ | -----------
200    | Operation successful
201    | Upsert successful
204    | Delete operation successful
304    | Not Modified
400    | Bad request The request URL, headers, or body are invalid
401    | `Authorization` header missing or invalid
403    | Unauthorized (Insufficient permissions)
404    | Not found
405    | Method not allowed
409    | Data conflict
412    | Precondition Failed
419    | Authorization token expired
500    | Internal server error [Open an issue][12]

### IV. Using the Socket API

#### Connecting to the Socket
To use the DLx web socket API, your application first needs to connect to the socket.

If your application is running on the server, first install `socket.io-client` (`npm i --save socket.io-client`), and then include the following code in your app:

```js
const io     = require(`socket.io-client`);
const opts   = { transports: [`websocket`, `xhr-polling`] };
const socket = io.connect(`https://api.digitallinguistics.io/`, opts);
```

If your application is running in a browser, first add a link to the Socket.IO script in your web page, like so:

```html
<script src=https://api.digitallinguistics.io/socket.io/socket.io.js charset=utf-8></script>
```

This will make `io` available as a global variable. You can then use `io` to connect to the socket:

```js
const opts   = { transports: [`websocket`, `xhr-polling`] };
const socket = io.connect(`https://api.digitallinguistics.io/`, opts);
```

If you would like to specify a particular version of the API, simply append the version to the connection URL, e.g. `https://api.digitallinguistics.io/v1`.

#### Authenticating with the Socket API
Your application must authenticate with the socket API using an access token before it can make additional requests. To authenticate, simply emit an `authenticate` event once the socket is connected, sending the token in the body of the message:

```js
const token = YOUR_ACCESS_TOKEN;
socket.on(`connect`, () => socket.emit(`authenticate`, { token }));
socket.on(`authenticated`, () => { /* Do other things with the socket */ });
```

If authentication fails, the socket will emit an `unauthenticated` event.

If your application attempts to send a message to the socket API without authenticating, the socket will emit an `error` event and the message will not be processed.

#### Making Requests to the Socket API
You can make requests to the socket using `socket.emit({event}, arg1, arg2, ..., callback)`. The socket API follows a Node-style, error-first callback. If an error occurs, it will be the first argument passed to the callback function. Otherwise, the response will be passed as the second argument. For example:

```js
socket.emit(`getText`, `TEXT_ID`, (err, text) => {
  if (err) { /* handle error */ }
  else { /* do something with the text */ }
});
```

#### Event Syntax
The events emitted and accepted by the socket API directly mirror the REST API. The table below compares how to make the same request in the REST API vs. the socket API:

Operation                          | REST API                       | Socket API
---------------------------------- | ------------------------------ | ----------
Create a language                  | `POST   /languages`            | `addLanguage`
Get multiple languages             | `GET    /languages`            | `getLanguages`
Upsert (add or replace) a language | `PUT    /languages`            | `upsertLanguage`
Delete a language                  | `DELETE /languages/{language}` | `deleteLanguage`
Get a language                     | `GET    /languages/{language}` | `getLanguage`
Update a language                  | `PATCH  /languages/{language}` | `updateLanguage`

You can also use a more generic syntax, using the following events:
- `add`
- `delete`
- `get`
- `getAll`
- `update`
- `upsert`

For the `add` event, you will need to specify the type of the object to add as the first argument. For example:

```js
const data = { /* language data */ };

socket.emit(`add`, `Language`, data, (err, language) => {
  if (err) /* handle error */
  else /* do something with the new language object */
});
```

#### Events Emitted by the Socket API
Each time data in the database is modified, the Socket API emits an event indicating the type of operation that was performed on the database, and the ID of the affected data. Your application can then decide whether it needs to make a request for the updated data. This is useful for ensuring that the data in your application stays in sync with the data on the server.

The following events are emitted by the Socket API. These events are always emitted along with the ID of the affected item.

Event    | Description
-----    | -----------
`add`    | A new item was added to the database
`delete` | An item was deleted
`update` | A partial update was performed on the item
`upsert` | An item was upserted (added or replaced)

Your application should add listeners for each of these events, like so:

```js
socket.on(`add`, id => {
  socket.get(id, (err, res) => { /* do something with the new data */ });
});
```

#### Parameters
Parameters that are part of the path in the REST API must be passed as arguments in the socket API. For example, this is how you would run `GET /languages/12345` in the socket API:

```js
socket.emit(`getLanguage`, `12345`, (err, language) => {
  /* Do something with the returned language object */
});
```

Parameters that are part of the query string in the REST API must be passed as part of an optional options argument in the socket API. For example, this is how you would run `GET /languages?fields=id,title` in the socket API:

```js
socket.emit(`getLanguages`, { fields: [`id`, `title`] }, (err, languages) => {
  /* Do something with the returned array of languages */
});
```

#### Operations on Permissions **NOT YET SUPPORTED**
Operations on permissions use the following syntax:

Operation                   | Syntax
--------------------------- | ------
Add a permission            | `addPermission`
Delete a permission         | `deletePermission`
Add multiple permissions    | `addPermissions`
Delete multiple permissions | `deletePermissions`

The ID of the resource to change permissions for must be provided as the first argument, followed by the permission object. The example below shows how to give the user `linguist@university.edu` a `Viewer` permission for the text with the ID `12345`.

```js
const permission = {
  user:       `linguist@university.edu`,
  permission: `viewer`
};

socket.emit(`addPermission`, `12345`, permission, (err, response) => {
  /* Handle error or do something after getting success response */
});
```

This example shows how to add permissions for multiple users:

```js
const permissions = {
  users:      [`linguist@university.edu`, `anthropologist@university.edu`],
  permission: `contributor`,
};

socket.emit(`addPermissions`, `12345`, permissions);
```

This example shows how to make a resource public:

```js
socket.emit(`updatePermission`, `12345`, { public: true });
```

[1]:  https://github.com/digitallinguistics/api-js#readme (JavaScript Library)
[2]:  https://github.com/digitallinguistics/api-node#readme (Node Library)
[3]:  https://app.swaggerhub.com/api/DLx/dlx/ (Swagger Reference)
[4]:  http://developer.digitallinguistics.io/spec/ (Spec Docs)
[5]:  https://auth0.com/ (Auth0)
[6]:  https://auth0.com/docs/api-auth/dynamic-client-registration#register-your-client (Auth0 Client Registration)
[7]:  https://auth0.com/docs/api-auth/tutorials/authorization-code-grant (Authorization Code Grant)
[8]:  https://auth0.com/docs/api-auth/tutorials/implicit-grant (Implicit Grant)
[9]:  https://auth0.com/docs/api-auth/tutorials/client-credentials (Client Credentials Grant)
[10]: http://tools.ietf.org/html/rfc6749#section-5.2 (Error Parameters)
[11]: http://data.digitallinguistics.io/ (Data Explorer)
[12]: https://github.com/digitallinguistics/api/issues (Issues)
[13]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/If-Modified-Since (If-Modified-Since)
