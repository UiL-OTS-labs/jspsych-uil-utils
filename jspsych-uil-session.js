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

import {resolveServer} from "./jspsych-uil-utils.js";
import {API} from "./libs/api.js";

export {
    isActive,
    start,
    upload,
    subjectId
};


var session_id = null;
var subject_id = null;

/**
 * Used to check if a session has already started
 * @returns {boolean}
 */
function isActive () {
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
function start (access_key, callback) {
    let api = new API(resolveServer());
    api.sessionStart(access_key).then((data) => {
        session_id = data.uuid;
        subject_id = data.subject_id;
        callback(data.group_name);
    });
}

/**
 * Uploads data to the server and finalizes a session
 *
 * @param {string} access_key - Access key for the experiment
 * @param {string} data - Data to be sent to the server, in plain text
 *
 * @returns {Promise<Object>} a promise that contains the parsed JSON returned from the server
 */
function upload (access_key, data) {
    let api = new API(resolveServer());
    if (session_id === null) {
        throw new Error('No active session!');
    }

    return api.sessionUpload(access_key, session_id, data);
}

/**
 * Obtain an subject_id from the the dataserver
 *
 * @returns the subject_id from the data store.
 */
function subjectId () {
    if (session_id === null) {
        throw new Error('No active session')
    }

    return subject_id;
}
