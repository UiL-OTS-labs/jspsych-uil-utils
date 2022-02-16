'use strict'
/*
 * Session management for jsPsych and UiL-OTS datastore
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

if (typeof uil === 'undefined')
    console.error("UiL Main library not loaded! " +
                  "Refusing to load browser info functions");
else
{
    if ('session' in uil) {
        console.warn(
            "uil.session already exists, this is unexpected, " +
                "we'll overwrite it."
        );
    }

    uil.session = {};

    (function (context) {
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

        var session_id = null;
        var subject_id = null;

        var api = new API(uil.resolveServer());

        /**
         * Used to check if a session has already started
         * @returns {boolean}
         */
        context.isActive = function() {
            return session_id !== null;
        }

        /**
         * @callback sessionCallback
         * @param {string} group_name - The name of the target group the participant was assigned to
         */

        /**
         * Starts a new participant session on the server
         * @param {string} access_key - Access key for the experiment
         * @param {sessionCallback} callback - Callback function that receives information about the session
         */
        context.start = function(access_key, callback) {
            api.sessionStart(access_key).then((data) => {
                session_id = data.uuid;
                subject_id = data.subject_id;
                callback(data.group_name);
            });
        };

        /**
         * Uploades data to the server and finalizes a session
         * @param {string} access_key - Access key for the experiment
         * @param {string} data - Data to be sent to the server, in plain text
         */
        context.upload = function(access_key, data) {
            if (session_id === null) {
                throw new Error('No active session!');
            }

            api.sessionUpload(access_key, session_id, data);
        };

        /**
         * Obtain an subject_id from the the dataserver
         *
         * @returns the subject_id from the data store.
         */
        context.subjectId = function() {
            if (session_id === null) {
                throw new Error('No active session')
            }

            return subject_id;
        }
    })(uil.session);
}
