'use strict'

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
        class API {
            constructor(host) {
                this.host = host;
                this.headers = {};
            }

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

            get(url) {
                return this._request(url, 'GET');
            }
            post(url, data) {
                return this._request(url, 'POST', data);
            }

            sessionStart(access_key) {
                return this.post(`${access_key}/participant/`);
            }

            sessionUpload(access_key, session_id, data) {
                return this.post(`${access_key}/upload/${session_id}/`, data);
            }
        }

        var session_id = null;
        var api = new API(uil.resolveServer());

        context.isActive = function() {
            return session_id !== null;
        }

        context.start = function(access_key, callback) {
            api.sessionStart(access_key).then((data) => {
                session_id = data.uuid;
                callback(data.group_name);
            });
        };

        context.upload = function(access_key, server, data) {
            if (session_id === null) {
                throw new Error('No active session!');
            }

            api.sessionUpload(access_key, session_id, data);
        };
    })(uil.session);
}
