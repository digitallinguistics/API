# WARNING
This package is still under development. The version number will be incremented to v1.0.0 when this package is production-ready.

# The Digital Linguistics (DLx) API
This repository contains the source code and documentation for the DLx API, a service that allows software developers to programmatically access the DLx database. By sending requests to the API, developers can add, update, delete, or retrieve resources in the database using code. This page describes the structure of the DLx database and the resources in it, how to register your app with the API service, how to authenticate users so that they may access resources, how to properly format requests to the database, and how to handle responses from the database. To send requests to the API, you will need to programmatically construct an HTTP request and send it to the appropriate URL. Below is information explaining how to format each part of your requests to the API.

**[View the API reference documentation here.](https://api.digitallinguistics.org/doc)**

If you are writing your application using JavaScript, Node, or Python, consider using our [JavaScript SDK](https://github.com/digitallinguistics/dlx-sdk-js#readme), [Node SDK](https://github.com/digitallinguistics/dlx-sdk-node#readme), or [Python SDK](https://github.com/digitallinguistics/dlx-sdk-py#readme), which contain a number of convenient methods for interacting with the DLx API, and handle most of the details on this page.

Project milestones are named for the major functionality they add or change. Project releases are each named for a different animal in Swahili.

## I. About the Database

### Collections &amp; Resource Types
The DLx database contains several types of resources, such as texts, lexicons, and media. There are separate collections for each type of resource in the database, shown below. The DLx API allows users to perform various operations on the resources in these collections, depending on the type of resource and whether the user has permission to perform that operation. For example, a user may add a text to the `texts` collection or, if they have `Owner` permission for that text, update or delete that text.

Each item in a collection must be formatted according to the Digital Linguistics (DLx) data format specification. This is a standard format in JSON for exchanging linguistic data on the web. You can read more about this format [here](http://developer.digitallinguistics.org/spec). If the user requests to add a resource to the database that is improperly formatted, the request returns an error and the resource is not uploaded. Click on any resource type to see its DLx specification.

Some types of resources contain subitems that may also be accessed with the API. For example, texts contain phrases, so a user may request one or more phrases from a text, rather than having to request the entire text at once.

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

Public resources can sometimes become Community resources. This happens when the Owner of the resource gives up the Owner permission, but opts to leave the resource Public. When this happens, the original Owner can no longer delete the resource or set its visibility to private. The resource may now only be deleted by a DLx Administrator (or perhaps in the future, some kind of Community Moderator).

## II. How to Use the API Service

### A. Making Requests to the API

#### Authentication
Before making programmatic requests to the API, your application will need to authenticate itself and often the resource owner (the end user) with the API, and receive an access token. You must then include this access token for most kinds of requests to the database. For complete details on how to authenticate your app with the API, see the [authentication documentation](http://digitallinguistics.github.io/dlx-login/).

#### URL Syntax
Each resource and collection in the database corresponds to a different URL. Requests made to that URL can be used to perform various operations on that resource or collection. For example, the text with an ID of `17` can be retrieved by sending a GET request to https://dlx.azurewebsites.net/v1/texts/17, and a lexicon can be added to the database by sending a PUT request to https://dlx.azurewebsites.net/v1/lexicons. Below is a set of schemas showing how to format URLS for different types of operations:

* Operations on a collection: `https://dlx.azurewebsites.net/v1/{collection}`
* Operations on an item: `https://dlx.azurewebsites.net/v1/{collection}/{itemId}`
* Operations on a subitem (not available for all collections): `https://dlx.azurewebsites.net/v1/{collection}/{itemId}/{subItemType}/{subItemId}`

Some examples:
- https://dlx.azurewebsites.net/v1/texts
- https://dlx.azurewebsites.net/v1/texts/17
- https://dlx.azurewebsites.net/v1/texts/17/phrases/4

A complete list of the operations that can be performed on each type of resource and collection is available [here](https://api.digitallinguistics.org/doc).

**NB:** The API always returns JSON data in the response. If you would like to see HTML representations of the data instead, use the [Data Explorer API](http://developer.digitallinguistics.org/data).

#### Parts of the Request

* ##### Protocol
All requests to the DLx API should use HTTPS protocol rather than HTTP.

* ##### Host
The hostname for requests to the DLx API should always be `api.digitallinguistics.org`.

* ##### Headers
Certain requests to the API take optional or required headers. The following headers are used:

Header        | Description
------------- | -----------
Authorization | Required for most operations, and for accessing private resources. Should contain the access token you received from the API during authentication, in the format `bearer {access_token}`.

* ##### Path
Requests to the DLx API should include the API version number immediately after the hostname, like so: `https://api.digitallinguistics.org/v1/`. The rest of the path should follow the URL syntax outlined above. The current version of the API is `v1`.

* ##### Querystring
Many requests to the API take optional or required querystring parameters. These are added to the end of the URL following a `?`, in the format `{parameter}={value}`. For example, the URL https://api.digitallinguistics.org/v1/texts?ids=1,2,17,43,44,62 will retrieve texts with IDs 1, 2, 17, 43, 44, and 62 from the database. Be sure to encode the querystring as a URI component (using a method such as JavaScript's `encodeURIComponent`) to avoid errors due to spaces or special characters. For a complete list of which query parameters are accepted for which types of requests, visit the [API documentation](https://api.digitallinguistics.org/doc).

* ##### Body
The body of the request should contain any resources to be uploaded to the database, in the [DLx JSON data format](http://digitallinguistics.github.io/dlx-spec/).

### B. Handling Responses from the API
If the request is successful, the API will return a response with a `2xx` status and a JSON object in the response body.

Unsuccessful requests will return a response with a `4xx` or `5xx` status, as well as a JSON object in the response body containing additional details about the error. A `WWW-Authenticate` header may also be included for invalid authorization requests.

The response body may contain the following attributes:

Attribute           | Description
------------------- | -----------
`data`              | (2xx responses only) an array containing the requested data for successful requests
`error_description` | (4xx or 5xx responses only) a more specific error message for help in debugging unsuccessful requests
`error`             | (4xx or 5xx responses only) a generic error message for unsuccessful requests
`included`          | (2xx responses only) in the future, this attribute may be used to include related resources with the response
`status`            | (all responses) contains the HTTP status code (as numeric)

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

* The DLx database uses [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/api/) to provide the API, and [Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) to store and query resources in the database.

* The API server is written in [Node](https://nodejs.org/en/) using the [Express](http://expressjs.com/) web framework.

* The DLx API server implements the Authorization Code, Implicit, and Client Credentials grant types of the [OAuth 2.0 specification](http://tools.ietf.org/html/rfc6749). For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki.

* Database resources are described in [JSON Schema](http://json-schema.org/) format. For more information on JSON Schema, check out this [excellent guide](http://spacetelescope.github.io/understanding-json-schema/) from the [Space Telescope Science Institute](http://www.stsci.edu/).

* The API structure is described using the [Swagger](http://swagger.io/specification/) format for describing APIs.

* The API uses [JSON Web Tokens (JWT)](http://jwt.io/) for its access tokens.

* Unit testing is done using [Jasmine](http://jasmine.github.io/). To run the tests in the repository, enter `npm test` in the command line.
