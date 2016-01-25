const config = require('./config');

const r = {

  /**
   * Converts various types of data and error objects or strings to the standard Dlx response format
   * @param  {any} data   A data object, error object, or error_description string.
   * @param  {(number|string)} [status=500] A status code. Defaults to 500.
   * @return {object}        Returns a standard DLx response object.
   */
  convert (data, status) {
    status = +status || +data.status || +data.code || +data.statusCode || +data.errorCode || 500;
    data = data.data || data.error_description || data.details || data || '';
    return this.json(data, status);
  },

  /**
   * Takes a data object or error message and an HTTP status an returns a standard DLx response object
   * @param  {any} [data]                     If present, a valid data response or error_description.
   * @param  {(number|string)} status         A valid HTTP status.
   * @return {object}                         Returns a standard DLx response object.
   */
  json (data, status) {
    const res = { status: +status };
    if (res.status < 400) { res.data = data; }
    else {
      res.error_description = data;
      const err500 = `Internal server error. Please open an issue on GitHub: ${config.package.bugs.url}`;
      switch (res.status) {
        case 400: res.error = 'Bad request. The request URL, headers, or body are invalid.'; break;
        case 401: res.error = 'Authorization header missing or invalid.'; break;
        case 403: res.error = 'Unauthorized.'; break;
        case 404: res.error = 'Not found.'; break;
        case 405: res.error = 'Method not allowed.'; break;
        case 419: res.error = 'Authorization token expired.'; break;
        case 500: res.error = err500; break;
        default: res.error = err500;
      }
      if (data.error) { res.error = data.error; }
    }
    return res;
  },

  /**
   * Takes data and/or response objects in various formats, as well as the Node/Express response object, and uses it to return a properly-formatted DLx response object to the client.
   * @param {any} [data]                    A data response or error_description.
   * @param {(number|string)} [status]      An HTTP response code.
   * @param {object} response               A Node/Express server response.
   */
  res (data, status, res) {
    const response = this.convert(data, status);
    res.status(response.status).json(response);
  }

};

global.r = r;
