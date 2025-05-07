/*
 * one line to give the program's name and an idea of what it does.
 * Copyright (C) 2020  Maarten Duijndam
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

import * as error from "./jspsych-uil-error.js"
import * as browser from "./jspsych-uil-browser.js"
import * as randomization from "./jspsych-uil-randomization.js"
import * as session from "./jspsych-uil-session.js"
import * as focus from "./jspsych-uil-focus.js"
import {isOnline, getWindow} from './libs/env.js';
import {API} from "./libs/api.js";

export {
    error,
    browser,
    randomization,
    session,
    focus,
}

export {
    isOnline,
    setAccessKey,
    useAcceptationServer,
    stopIfExperimentClosed,
    saveData,
    saveJson,
    resolveServer
}



/* ********* constants *********** */

const DATA_STORE_PRODUCTION_SERVER =
    'https://experiment-datastore.lab.hum.uu.nl/api/';

const DATA_STORE_ACCEPTATION_SERVER =
    'https://experiment-datastore.acc.lab.hum.uu.nl/api/';

const CLOSED_EXPERIMENT_PAGE_LOCATION =
    'https://web-experiments.lab.hum.uu.nl/index_files/closed/';
const CRITICAL_ERROR_PAGE_LOCATION =
    'https://web-experiments.lab.hum.uu.nl/index_files/error/';

const DATA_UPLOAD_ENDPOINT = '/upload/';
const DATA_METADATA_ENDPOINT = '/metadata/';

const POST = 'POST';
const GET = 'GET';

const CONTENT_TYPE = 'Content-Type';
const CONTENT_TYPE_TEXT_PLAIN = 'text/plain';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/* ************ private variables ************* */

let _access_key = undefined;

let _acc_server = false;

let _datastore_metadata = undefined;

/* ************ private functions ************* */


function handleUploadError(args) {
    document.body.innerHTML = `
<div style="margin: 20px">
<h1>Upload Error</h1>
<p>An error was encountered while trying to upload the data from your session.</p>

<p>This could happen because your connection is down, or because of the server is unavailable.</p>
<p>Please keep this window open to prevent your data from being lost.</p>
<p>You can <a id="retry" href="#">click here to try again</a>.</p>
</div>
    `;

    document.querySelector('#retry').addEventListener('click', () => {
        document.body.innerHTML = '<div style="margin: 20px">Retrying upload...</div>';
        saveOnDataServer(args.access_key, args.server, args.data);
    });
}

/**
 * saves the data obtained from jsPsych on the webserver.
 *
 * @private
 * @param {string} access_key The key obtain while registering the dataserver
 * @param {string} server the server to which the data should be posted.
 * @param {string} data the research data to send to the datastorage server.
 */
async function saveOnDataServer(access_key, server, data) {
    let api = new API(resolveServer());

    try {
        let response = await api._post(access_key + DATA_UPLOAD_ENDPOINT, data);
        console.log("Upload status = 200 ", response);
    }
    catch (err) {
        console.error("Error while uploading status", err);
        handleUploadError({access_key, server, data});
    }
}

/**
 * Loads experiment metadata from the Datastore status API
 *
 * @private
 * @param {string} access_key The key obtain while registering the dataserver
 * @param {string} server the server to which the data should be posted.
 * @return {Promise}
 */
function getDatastoreMetadata(access_key, server) {

    if (typeof(_datastore_metadata) !== "undefined")
        // If we already have the data, return a auto-fulfilling promise
        return new Promise((resolve, _) => {resolve(_datastore_metadata);});

    let xhr = new XMLHttpRequest();

    // As this is an async call, we return a promise. That way we can
    // actually easily do stuff with the result.
    return new Promise((resolve, reject) => {
        let url = server + access_key + DATA_METADATA_ENDPOINT;
        xhr.open(GET, url);
        xhr.responseType = "json";

        xhr.onload = function() {
            if(xhr.status === 200){
                _datastore_metadata = xhr.response;
                resolve(xhr.response);
            }
            else {
                console.error("Error while uploading status = " + xhr.status);
                console.error("Response = " + xhr.response);
                reject(new Error(String(xhr.status) + ": " + String(xhr.response)));
            }
        };

        function onerror() {
            reject(new Error("UiL-OTS datastore server is unavailable"));
        }

        xhr.onerror = onerror;

        xhr.send();
    })
}

/**
 * Simple check of whether the uuid seems valid.
 *
 * This test just checks whether the form of the uuid is correct, it
 * doesn't differntiate between version 1,2,3,4 or 5, nor does it
 * check the variant.
 *
 * @param {string} id The id that should match a uuid
 *
 * @returns {boolean} True if the string is formatted as a UUID, false
 * otherwise.
 */
function isUUIDFormat(id) {
    return id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
}

function validateAccessKey(access_key) {
    if (typeof(access_key) === "undefined") {
        // Check if we have a pre-saved access key
        if (typeof(_access_key) === "undefined") {
            // If not, error and return
            console.error("Function argument access_key is undefined.");
            return;
        }

        // If we do, use that key
        access_key = _access_key;
    }

    let is_online = isOnline();

    if (!isUUIDFormat(access_key)) {
        let message =
            `The access_key ${access_key} is not in a valid format. Please `+
            "make sure you have copied it correctly in your experiment. "   +
            "It should be 5 groups of characters (0-9 or a-f) with "        +
            "8, 4, 4, 4 and 12 characters per group respectively.";

        if (is_online) {
            error.scriptError(
                message
            );
        }
        else {
            console.log(message);
        }
    }

    if (access_key === NIL_UUID) {
        let message =
            `The access_key is "${NIL_UUID}", you should update it.` +
            "You can find the access_key in globals.js";
        if (is_online) { // Treat as error when online
            error.scriptError(message);
            throw new TypeError("Bad access_key");
        }
        else { // and issue a warning when testing locally
            console.log(message);
        }
    }
    return access_key;
}


/* ************ public functions ************** */

    /**
     * Saves an access key to be used with all API related functions as an default.
     *
     * Saves an access key to be used with all API related functions as an default.
     * If a default has been saved, one does not need to supply the access key anymore
     * to any function with it as a parameter.
     * This acces key will be used for all subsequent communications with the
     * dataserver. If you would like to change it, you would have to call this function
     * again, otherwise the cached variable is used instead of the ones passed to the
     * server.
     *
     * @param {string} access_key, the key obtain from the datastore server.
     */
function setAccessKey (access_key) {
    if (typeof(access_key) === "undefined") {
        console.error("Function argument access_key is undefined.");
        return;
    }

    _access_key = validateAccessKey(access_key.trim());
    return _access_key;
}

    /**
     * Instructs all API methods to use the acceptation datastore server.
     *
     * Instructs all API methods to use the acceptation datastore server. This can
     * be overriden on a per-call method using the ``acc_server`` parameter;
     */
function useAcceptationServer () {
    _acc_server = true;
}

/**
 * This function will redirect the user away if the experiment is closed.
 *
 * This function will redirect the user to a 'experiment closed' page
 * if the experiment is closed according to the datastore.
 *
 * @param {string} access_key, the key obtain from the datastore server.
 *                 Optional if key is set using setAccessKey
 * @param {bool}   acc_server, true if the data should be stored at the
 *                 "acceptation server" for testing purposes. This parameter
 *                 is only usefull when running the experiment online
 * @param {string} A page to land when the experiment is closed
 * @param {string} A page to land when the communication with the datastore
 *                 fails.
 * @memberof uil
 */
function stopIfExperimentClosed (
    access_key = undefined,
    acc_server = undefined,
    stop_page = CLOSED_EXPERIMENT_PAGE_LOCATION,
    error_page = CRITICAL_ERROR_PAGE_LOCATION
)
{
    if (_access_key) {
        access_key = _access_key;
    }
    else {
        access_key = setAccessKey(access_key);
    }

    if (typeof(acc_server) === "undefined") {
        acc_server = _acc_server;
    }

    let is_online = isOnline();
    let key = access_key;

    if (is_online) {
        let server = "";
        if (!acc_server)
            server = DATA_STORE_PRODUCTION_SERVER;
        else
            server = DATA_STORE_ACCEPTATION_SERVER;

        let getDatastoreMetadataResolve = function(data) {
            let state = data['state'];
            if (state !== "Open" && state !== "Piloting") {
                getWindow().location = stop_page;
            }
        }
        let getDatastoreMetadataReject = function (error) {
            getWindow().location = error_page;
        }

        getDatastoreMetadata(key, server).then(
            getDatastoreMetadataResolve,
            getDatastoreMetadataReject
        );
    }
}

/**
 * Saves data to the uilots data server or displays the data.
 *
 * Saves data to the uilots data server or displays the data
 * in the browser window. When the experiment is hosted via an http(s)://
 * server the data will be send to the data server, otherwise this function
 * assumes that you are testing your experiment on your own pc via
 * the file protocol.
 *
 * @param {string} access_key, the key obtain from the datastore server.
 *                 Optional if key is set using setAccessKey
 * @param {bool}   acc_server, true if the data should be stored at the
 *                 "acceptation server" for testing purposes. This parameter
 *                 is only usefull when running the experiment online
 * @memberof uil
 * @deprecated use saveJson() instead.
 *
 * @returns {Promise| Promise<Object>} a promise that resolves when then
 * upload is transferred. In case the saveOnDataServer path is chosen, it might also
 * be "resolved" when the "retry" screen is displayed. When testing offline a
 * resolved Promise is returned
 */
function saveData (access_key, acc_server = undefined) {

    if (_access_key) {
        access_key = _access_key;
    }
    else {
        access_key = setAccessKey(access_key);
    }

    if (typeof(access_key) === "undefined") {
        console.error("Unable to save without a valid access_key");
        return Promise.reject(new Error("Unable to save without a valid access_key"));
    }

    let data = jsPsych.data.get().json();
    let key = access_key;
    let is_online = isOnline();
    let server = resolveServer(acc_server);

    if (is_online) {
        if (session.isActive()) {
            return session.upload(key, data);
        }
        else {
            return saveOnDataServer(key, server, data);
        }
    }
    else {
        jsPsych.data.displayData();
        return Promise.resolve();
    }
}

/**
 * Saves a json formatted string the uilots data server or displays the data.
 *
 * Saves data to the uilots data server or displays the data
 * in the browser window. When the experiment is hosted via an http(s)://
 * server the data will be send to the data server, otherwise this function
 * assumes that you are testing your experiment on your own pc via
 * the file protocol and will just display the json.
 *
 * @param {string} json a json formatted string.
 * @param {string} access_key, the key obtain from the datastore server.
 *                 Optional if key is set using setAccessKey
 * @param {bool}   acc_server, true if the data should be stored at the
 *                 "acceptation server" for testing purposes. This parameter
 *                 is only usefull when running the experiment online
 * @memberof uil
 *
 * @returns {Promise| Promise<Object>} a promise that resolves when then
 * upload is transferred. In case the saveOnDataServer (no active session) path is 
 * chosen, it might also be "resolved" when the "retry" screen is displayed. When 
 * testing offline a resolved Promise is returned.
 */
function saveJson (json, access_key, acc_server = undefined) {

    if (_access_key) {
        access_key = _access_key;
    }
    else {
        access_key = setAccessKey(access_key);
    }

    if (typeof(access_key) === "undefined") {
        console.error("Unable to save without a valid access_key");
        return;
    }
    let key = access_key;
    let is_online = isOnline();
    let server = resolveServer(acc_server);

    if (is_online) {
        if (session.isActive()) {
            return session.upload(key, json);
        }
        else {
            return saveOnDataServer(key, server, json);
        }
    }
    else {
        // show the data in prettyfied format
        json = JSON.stringify(JSON.parse(json), null, 4);
        // Add preformatted json content.
        let pre_element = document.createElement("pre");
        pre_element.innerText = json;

        let content = `<!doctype html><html><body><h1>Experiment Data (debug version)</h1>${pre_element.outerHTML}</body></html>`;
        let url = URL.createObjectURL(new Blob([content], {type: 'text/html;charset=utf-8'}));
        window.open(url);
        return Promise.resolve();
    }
}


/**
 * Figures out which server we should be talking to
 */
function resolveServer (acc_server = undefined) {
    if (typeof(acc_server) === "undefined") {
        acc_server = _acc_server;
    }

    if (!acc_server)
        return DATA_STORE_PRODUCTION_SERVER;
    else
        return DATA_STORE_ACCEPTATION_SERVER;
}
