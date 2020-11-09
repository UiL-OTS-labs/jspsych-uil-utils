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

    const DATA_UPLOAD_DIR = '/upload/';

    const POST = 'POST';

    const CONTENT_TYPE = 'Content-Type';
    const CONTENT_TYPE_TEXT_PLAIN = 'text/plain';

    const LIBRARIES = ['jspsych-uil-randomisation.js']
    
    // The directory this script lives in
    const SCRIPT_DIR = document.currentScript.src.split('/').slice(0, -1).join('/');


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
        xhr.open(POST, server + access_key + DATA_UPLOAD_DIR);

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


    /* ************ public functions ************** */

    /**
     * Saves data to the uilots data server or displays the data.
     *
     * Saves data to the uilots data server or displays the data 
     * in the browser window. When the experiment is hosted via an http(s)://
     * server the data will be send to the data server, otherwise this function
     * assumes that you are testing your experiment on your own pc via
     * the file protocol.
     *
     * @param {string} access_key, the key obtain from the datastore server
     * @param {bool}   acc_server, true if the data should be stored at the
     *                 "acceptation server" for testing purposes. This parameter
     *                 is only usefull when running the experiment online
     * @memberof uil
     */
    context.saveData = function (access_key, acc_server=false) {

        if (typeof(access_key) === undefined) {
            console.error("Function argument access_key is undefined.");
            return;
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
     * @returns {boolean}
     */
    context.isMobile = function () {
        let check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
    };

    /**
     * Returns true if this device is a tablet or a smartphone
     * @returns {boolean}
     */
    context.isMobileOrTablet = function () {
        let check = false;
        (function (a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
        })(navigator.userAgent || navigator.vendor || window.opera);
        return check;
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
     * @returns {boolean} True if the browser has a touch screen
     */
    context.isTouchCapable = function () {
        let has_touchscreen = false;
        // (ms)maxTouchPoints refers to the amount of fingers that can be
        // registered on a screen
        if ("maxTouchPoints" in navigator) {
            has_touchscreen = navigator.maxTouchPoints > 0;
        } else if ("msMaxTouchPoints" in navigator) {
            has_touchscreen = navigator.msMaxTouchPoints > 0;
        } else {
            // pointer:coarse indicates the pointer isn't accurate, which mostly
            // corresponds to touch
            let media_query = window.matchMedia && matchMedia(
                "(pointer:coarse)"
            );
            if (media_query && media_query.media === "(pointer:coarse)") {
                // Double negation to cast media_query.matches to a bool
                // (I think)
                has_touchscreen = !!media_query.matches;
            }
        }

        return has_touchscreen
    }

    /* ********* file loading *********** */

    /**
     * Load in a separate sub-library.
     * @param library The name of the file to load in
     */
    context.loadLibrary = function (library) {
        console.log(SCRIPT_DIR, library, document.currentScript)
        var script = document.createElement('script');
        script.src = SCRIPT_DIR + '/' + library;

        document.head.appendChild(script)
    }

    function loadAllLibraries() {
        LIBRARIES.forEach(library => context.loadLibrary(library))
    }

    // Load in all libraries
    loadAllLibraries()

})(uil);
