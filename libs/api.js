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
     * @param {body} - any compatible Fetch body (see https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#body)
     * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
     */
    _request(url, method, body) {
        let retries = 5;
        let sleep = 500;
        let params = {
            method: method,
        };
        if (typeof(body) !== 'undefined') {
            params.body = body;
        }
        return new Promise(async (resolve, reject) => {
            let response = null;
            let error = null;
            for(let i = 0; i < retries; i++) {
                try {
                    response = await fetch(this.host + url, params);
                    break;
                }
                catch (e) {
                    // sleep for a bit
                    error = e;
                    await (new Promise(r => setTimeout(r, sleep)));
                    sleep *= 2;
                }
            }

            if (response == null) {
                // out of retries
                reject(error);
                return;
            }

            if (response.ok) {
                if (response.status == 204) {// no content
                    resolve()
                }
                else {
                    resolve(await response.json());
                }
            }
            else {
                let clone = response.clone();
                try {
                    reject(await response.json());
                }
                catch {
                    reject(await clone.text());
                }
            }
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
        let blob = new Blob([data], {type: 'text/plain'});
        return this._post(`${access_key}/upload/${session_id}/`, blob);
    }

    /**
     * Upload a binary file to the server
     * @param {string} access_key
     * @param {string} session_id
     * @param {Blob} blob
     * @param {string} filename - optional
     * @returns {Promise<void>}
     */
    uploadBinary(access_key, session_id, blob, filename) {
        // multipart encoding for file upload
        let data = new FormData();
        data.set('file', blob, filename);
        return this._post(`${access_key}/bin/${session_id}/`, data);
    }
}


export {
    API
};
