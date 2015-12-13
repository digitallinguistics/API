# The DLX API
This repository contains the source code and documentation for the API that provides access to the DLX database.


## Technical Notes

* The DLX database uses [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/api/) to provide the API, and [Azure DocumentDB](https://azure.microsoft.com/en-us/services/documentdb/) to store and query resources in the database.

* The DLX API server implements the [Implicit grant type](http://tools.ietf.org/html/rfc6749#section-4.2) of the [OAuth 2.0 specification](http://tools.ietf.org/html/rfc6749) for authentication. In the future the [Authorization Code grant type](http://tools.ietf.org/html/rfc6749#section-4.1) may be implemented as well. For a simple overview of the OAuth 2.0 authentication process, see [this post](http://aaronparecki.com/articles/2012/07/29/1/oauth2-simplified) by Aaron Parecki.

* Database resources are described in [JSON Schema](http://json-schema.org/) format. For more information on JSON Schema, check out this [excellent guide](http://spacetelescope.github.io/understanding-json-schema/) from the [Space Telescope Science Institute](http://www.stsci.edu/).

* The API structure is described in [Swagger](http://swagger.io/specification/) format.


## The Database

### Database Structure
* bundles > items
* languages
* lexicons > lexicon entries
* locations
* media
* persons
* projects
* texts > phrases
* users

### Database Permissions

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

#### User Roles
- Owner
- Contributor
- Viewer


## The API

### Authentication
Some of the resources in the DLX database are publicly available, and require no special permission to access. Other resources are private, and require the user to be logged into the DLX database to access them. Any requests to create, edit, or delete resources also require the user to be logged into DLX. So before making these kinds of requests, you will need to log the user into DLX, following the steps below. The DLX API will then provide your app with an access token, which you will need to store somewhere and then include with any future requests to the DLX database. This token expires after one hour, after which time the user will need to login again. You can however reauthenticate the user in the background before the token expires, so that the user does not have to login again. So before making any request to the DLX database, it is a good idea to first check whether the access token is expired to avoid receiving a 403 error.

### Making Requests to the API

#### URI Syntax
- https://dlx.azurewebsites.net/{collection}
- https://dlx.azurewebsites.net/{collection}/{itemID}
- https://dlx.azurewebsites.net/bundles/{bundleID}/items/{itemID}
- https://dlx.azurewebsites.net/texts/{textID}/phrases/{phraseID}
- https://dlx.azurewebsites.net/lexicons/{lexiconID}/entry/{entryID}

#### HTTPS
All programmatic requests to the DLX API should use HTTPS protocol rather than HTTP.

#### Host
The hostname for requests to the DLX API should always be `dlx.azurewebsites.net`.

#### Headers
- Accept
- Authorization

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
