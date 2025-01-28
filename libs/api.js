/**
 * Class for handling all requests to the server
 */
class API {
    /**
     * Initializes the api connection
     * @param {string} host - base URL for all requests (should include https://)
     */
    constructor(host) {
        this.host = host;
    }

    /**
     * Performs a request
     * @param {string} url - URL for the request, relative to the base URL used when initializing the API class
     * @param {string} method - HTTP method (e.g. GET/POS)
     * @param {string} data - Data to be sent to the server, in plain text
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    _request(url, method, data) {
        let params = {
            method: method,
        };
        if (typeof(data) !== 'undefined') {
            params.body = new Blob([data], {type: 'text/plain'});
        }
        return new Promise((resolve, reject) => {
            fetch(this.host + url, params).then((response) => {
                response.json().then(resolve).catch(reject);
            }).catch(reject);
        });
    }

    /**
     * Performs an HTTP GET request
     * @param {string} url - URL for the request, relative to the base URL used when initializing the API class
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    _get(url) {
        return this._request(url, 'GET');
    }

    /**
     * Performs an HTTP POST request
     * @param {string} url - URL for the request, relative to the base URL used when initializing the API class
     * @param {string} data - Data to be sent to the server, in plain text
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    _post(url, data) {
        return this._request(url, 'POST', data);
    }

    /**
     * Start a new participant session on the server
     * @param {string} access_key - Access key for the experiment
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    sessionStart(access_key) {
        return this._post(`${access_key}/participant/`);
    }

    /**
     * Start a new participant session on the server
     * @param {string} access_key - Access key for the experiment
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    sessionUpload(access_key, session_id, data) {
        return this._post(`${access_key}/upload/${session_id}/`, data);
    }
}


export {
    API
};
