# The Digital Linguistics (DLx) API
This repository contains the source code and documentation for the DLx API, a service that allows software developers to programmatically access the DLx database. By sending requests to the API, developers can add, update, delete, or retrieve resources in the database using code. This page describes the structure of the DLx database and the resources in it, how to register your app with the API service, how to authenticate users so that they may access resources, how to properly format requests to the database, and how to handle responses from the database. To send requests to the API, you will need to programmatically construct an HTTP request and send it to the appropriate URL. Below is information explaining how to format each part of your requests to the API.

**[View the API reference documentation here.](https://app.swaggerhub.com/api/DLx/dlx/)**

If you are writing your application using JavaScript, Node, or Python, consider using our [JavaScript SDK](https://github.com/digitallinguistics/dlx-api-js#readme), [Node SDK](https://github.com/digitallinguistics/dlx-api-node#readme), or [Python SDK](https://github.com/digitallinguistics/dlx-api-py#readme), which contain a number of convenient methods for interacting with the DLx API, and handle most of the details on this page.

## I. About the Database

### Collections &amp; Resource Types
The DLx database contains several types of resources, such as texts, lexicons, and media. There are separate collections for each type of resource in the database, shown below. The DLx API allows users to perform various operations on the resources in these collections, depending on the type of resource and whether the user has permission to perform that operation. For example, a user may add a text to the `texts` collection or, if they have `Owner` permission for that text, update or delete that text.

Each item in a collection must be formatted according to the Digital Linguistics (DLx) data format specification. This is a standard format in JSON for exchanging linguistic data on the web. You can read more about this format [here](http://digitallinguistics.github.io/dlx-spec/). If the user requests to add a resource to the database that is improperly formatted, the request returns an error and the resource is not uploaded. Click on any resource type to see its DLx specification.

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
Each resource and collection in the database corresponds to a different URL. Requests made to that URL can be used to perform various operations on that resource or collection. For example, the text with an ID of `17` can be retrieved by sending a GET request to `https://api.digitallinguistics.io/v1/texts/17`, and a lexicon can be added to the database by sending a PUT request to `https://api.digitallinguistics.io/v1/lexicons`. The following table shows the URL format for each type of resource, where items in {brackets} are variables that should be replaced with IDs. In the first row of the table, `{bundle}` would be replaced with the bundle's ID, so the URL might look like `https://api.digitallinguistics.io/v1/bundles/167`.

Resource    | URL Format
----------- | ----------
Language    | `https://api.digitallinguistics.io/v1/languages/{language}`
Lexicon     | `https://api.digitallinguistics.io/v1/lexicons/{lexicon}`
Lexeme      | `https://api.digitallinguistics.io/v1/lexemes/{lexeme}`
Location    | `https://api.digitallinguistics.io/v1/locations/{location}`
Media       | `https://api.digitallinguistics.io/v1/media/{mediaItem}`
Orthography | `https://api.digitallinguistics.io/v1/orthographies/{orthography}`
Person      | `https://api.digitallinguistics.io/v1/persons/{person}`
Text        | `https://api.digitallinguistics.io/v1/texts/{text}`

##### General Operations

###### Operations on Collections
You can add, update, or retrieve multiple items at once by making requests to a collection. The following operations are available on most collections (see the full [API reference documentation](https://app.swaggerhub.com/api/DLx/dlx/0.1.0) for exceptions).

Request Format                                             | Operation
---------------------------------------------------------- | ---------
`DELETE https://api.digitallinguistics.io/v1/{collection}` | Delete items from the collection (an `ids` parameter in the querystring is required). **NOT YET SUPPORTED**
`GET https://api.digitallinguistics.io/v1/{collection}`    | Retrieve items from the collection (an `ids` parameter in the querystring is required).
`PUT https://api.digitallinguistics.io/v1/{collection}`    | Upsert (add/update) a resource to the collection.

###### Operations on Permissions **NOT YET SUPPORTED**
To add or delete permissions for an object, simply make a POST or DELETE request to the resource URL with `/permissions` appended to the end. For example, to add a new permission for a text with the ID `17`, you would make a PUT request to `https://api.digitallinguistics.io/v1/texts/17/permissions`.

###### Operations on Subitems **NOT YET SUPPORTED**
Certain resources contain subitems or references to other resources. These can often be accessed by appending additional segments to the URL. For example, to retrieve all the media items in a bundle, you would make a GET request to `https://api.digitallinguistics.io/v1/bundles/{bundle}/media`. To retrieve a specific phrase from a text, you would make a GET request to `https://api.digitallinguistics.io/v1/texts/17/phrases/12`. In general, the format for performing operations on collections of subitems or individual subitems is as follows:

* Operations on collections of subitems: `https://api.digitallinguistics.io/v1/{collection}/{item}/{subitems}`
* Operations on individual subitems: `https://api.digitallinguistics.io/v1/{collection}/{item}/{subitems}/{subitem}`

A complete list of the operations that can be performed on each type of resource and collection is available [here](https://app.swaggerhub.com/api/DLx/dlx/).

**NB:** The API always returns JSON data in the response. If you would like to see HTML representations of the data instead, use the [Data Explorer](http://data.digitallinguistics.io/).

#### Parts of the Request

* ##### Protocol
All requests to the DLx API should use HTTPS protocol rather than HTTP.

* ##### Host
The hostname for requests to the DLx API should always be `api.digitallinguistics.io`.

* ##### Headers
Every request to the API requires an Authorization header, which should contain the access token you received from `login.digitallinguistics.io` during authentication, in the format `Bearer {access_token}`.

* ##### Path
Requests to the DLx API may include the API version number immediately after the hostname, like so: `https://api.digitallinguistics.io/v1/`. The rest of the path should follow the URL syntax outlined above. The current version of the API is `v1`. If the version number is omitted, the service defaults to the latest version of the API.

* ##### Querystring
Many requests to the API take optional or required querystring parameters. These are added to the end of the URL following a `?`, in the format `{parameter}={value}`. For example, the URL `https://api.digitallinguistics.io/v1/texts?ids=1,2,17,43,44,62` will retrieve texts with IDs 1, 2, 17, 43, 44, and 62 from the database. Be sure to encode the querystring as a URI component (using a method such as JavaScript's `encodeURIComponent`) to avoid errors due to spaces or special characters. For a complete list of which query parameters are accepted for which types of requests, visit the [API documentation](https://app.swaggerhub.com/api/DLx/dlx/).

* ##### Body
The body of the request should contain any resources to be uploaded to the database, in the [DLx JSON data format](http://digitallinguistics.github.io/dlx-spec/).

### B. Handling Responses from the API
If the request is successful, the API will return a response with a `2xx` status and JSON data in the response body.

Unsuccessful requests will return a response with a `4xx` or `5xx` status, as well as a JSON object in the response body containing additional details about the error. A `WWW-Authenticate` header may also be included for invalid authorization requests.

An error response body may contain the following attributes:

Attribute           | Description
------------------- | -----------
`status`            | the HTTP status code (as numeric)
`error`             | a generic error code
`error_description` | a more specific error message for help in debugging unsuccessful requests

#### Response Headers &amp; Status Codes
The following status codes are used in responses from the API. Your application should be prepared to handle any of these response types.

Status | Description
------ | -----------
200    | Operation successful.
201    | Upsert successful.
204    | Delete operation successful.
207    | Some resources unauthorized or not found.
400    | Bad request. The request URL, headers, or body are invalid.
401    | `Authorization` header missing or invalid.
403    | Unauthorized. (Insufficient user permissions.)
404    | Not found.
405    | Method not allowed.
409    | Data conflict.
419    | Authorization token expired.
500    | Internal server error. [Open an issue.](https://github.com/digitallinguistics/dlx-api/issues)
