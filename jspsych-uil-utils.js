"use strict";
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


/**
 * Namespace global variable called uil.
 */
var uil = {};

/**
 * populate the uil namespace with functions.
 */
(function(context) {

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

    const LIBRARIES = [
        'jspsych-uil-randomization.js',
        'libs/ua-parser.min.js', // Dependency of uil-browser
        'jspsych-uil-browser.js',
    ];
    
    // The directory this script lives in
    const SCRIPT_DIR = document.currentScript.src.split('/').slice(0, -1).join('/');

    /* ************ private variables ************* */

    let _access_key = undefined;

    let _acc_server = false;

    let _datastore_metadata = undefined;

    /* ************ private functions ************* */

    function getProtocol() {
        return window.location.protocol;
    }

    function isFileProtocol(protocol) {
        return protocol === "file:";
    }

    function isOnline(protocol) {
        return protocol === "http:" || protocol === "https:"
    }

    /**
     * saves the data obtained from jsPsych on the webserver.
     *
     * @private
     * @param {string} access_key The key obtain while registering the dataserver
     * @param {string} server the server to which the data should be posted.
     * @param {string} data the research data to send to the datastorage server.
     */
    function saveOnDataServer(access_key, server, data) {

        var xhr = new XMLHttpRequest();
        xhr.open(POST, server + access_key + DATA_UPLOAD_ENDPOINT);

        // Don't change, server only accepts plain text
        xhr.setRequestHeader(CONTENT_TYPE, CONTENT_TYPE_TEXT_PLAIN); 
        xhr.onload = function() {
            if(xhr.status === 200){
                console.log("Upload status = 200 " + xhr.response);
            }
            else {
                console.error("Error while uploading status = " + xhr.status);
                console.error("Response = " + xhr.response);
            }
        };
        xhr.send(data);
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


    /* ************ public functions ************** */

    /**
     * Saves an access key to be used with all API related functions as an default.
     *
     * Saves an access key to be used with all API related functions as an default.
     * If a default has been saved, one does not need to supply the access key anymore
     * to any function with it as a parameter.
     *
     * @param {string} access_key, the key obtain from the datastore server.
     */
    context.setAccessKey = function (access_key) {
        if (typeof(access_key) === "undefined") {
            console.error("Function argument access_key is undefined.");
            return;
        }

        _access_key = access_key.trim();
    }

    /**
     * Instructs all API methods to use the acceptation datastore server.
     *
     * Instructs all API methods to use the acceptation datastore server. This can
     * be overriden on a per-call method using the ``acc_server`` parameter;
     */
    context.useAcceptationServer = function () {
        _acc_server = true;
    }

    /**
     * This function will redirect the user away if the experiment is closed.
     *
     * This function will redirect the user to a 'experiment closed' page
     * if the experiment is closed according to the datastore. In addition,
     * if the experiment is in the 'piloting' stage, this function will
     * warn the user of this fact.
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
    context.stopIfExperimentClosed = function(
        access_key = undefined,
        acc_server = undefined,
        stop_page = CLOSED_EXPERIMENT_PAGE_LOCATION,
        error_page = CRITICAL_ERROR_PAGE_LOCATION
    )
    {
        if (typeof(access_key) === "undefined") {
            // Check if we have a pre-saved access key
            if (typeof(_access_key) === "undefined") {
                // If not, error and return
                console.error("Function argument access_key is undefined.");
                return;
            }

            // If we do, use that key
            access_key = _access_key
        }

        if (typeof(acc_server) === "undefined") {
            acc_server = _acc_server;
        }

        let is_online = isOnline(getProtocol());
        let key = access_key.trim();

        if (is_online) {
            let server = "";
            if (!acc_server)
                server = DATA_STORE_PRODUCTION_SERVER;
            else
                server = DATA_STORE_ACCEPTATION_SERVER;

            let getDatastoreMetadataResolve = function(data) {
                if (data['state'] === "Piloting") {
                    alert(
                        "Warning! This experiment is in the piloting stage. No data will " +
                        "be saved, but the experiment is still accessible."
                    );
                }
                else if (data['state'] !== "Open") {
                    window.location = stop_page;
                }
            }
            let getDatastoreMetadataReject = function (error) {
                window.location = error_page;
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
     */
    context.saveData = function (access_key, acc_server = undefined) {

        if (typeof(access_key) === "undefined") {
            // Check if we have a pre-saved access key
            if (typeof(_access_key) === "undefined") {
                // If not, error and return
                console.error("Function argument access_key is undefined.");
                return;
            }

            // If we do, use that key
            access_key = _access_key
        }

        if (typeof(acc_server) === "undefined") {
            acc_server = _acc_server;
        }

        let is_online = isOnline(getProtocol());
        let data = jsPsych.data.get().json();
        let key = access_key.trim();
        
        if (is_online) {
            let server = "";
            if (!acc_server) 
                server = DATA_STORE_PRODUCTION_SERVER;
            else
                server = DATA_STORE_ACCEPTATION_SERVER;

            saveOnDataServer(key, server, data);
        }
        else {
            jsPsych.data.displayData();
        }
    }

    /**
     * Returns true if this device is a smartphone
     *
     * NOTE: Some android tablets will also be seen as a smartphone!
     * @deprecated Use uil.browser.isMobile instead
     * @returns {boolean}
     */
    context.isMobile = function () {
        return context.browser.isMobile();
    };

    /**
     * Returns true if this device is a tablet or a smartphone
     * @deprecated Use uil.browser.isMobileOrTablet instead
     * @returns {boolean}
     */
    context.isMobileOrTablet = function () {
        return context.browser.isMobileOrTablet();
    };

    /**
     * Tries to find out if this device has touch support.
     *
     * Note: this isn't a check if the device is mobile. Some laptops are touch
     * capable too!
     *
     * Original source:
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
     *
     * Modified to only check for touch support
     *
     * @deprecated use uil.broswer.isTouchCapable instead
     * @returns {boolean} True if the browser has a touch screen
     */
    context.isTouchCapable = function () {
        return context.browser.isTouchCapable();
    }

    /* ********* file loading *********** */

    /**
     * Load in a separate sub-library.
     * @param library The name of the file to load in
     */
    context.loadLibrary = function (library) {
        var script = document.createElement('script');
        script.src = SCRIPT_DIR + '/' + library;
        // Set an ID. Used in libraries to wait till a dependency has loaded
        script.id = library;

        document.head.appendChild(script)
    }

    function loadAllLibraries() {
        LIBRARIES.forEach(library => context.loadLibrary(library))
    }

    // Load in all libraries
    loadAllLibraries()

})(uil);
