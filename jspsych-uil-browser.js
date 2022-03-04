'use strict'
/*
 * Browser info functions for jsPsych
 * Copyright (C) 2021 Ty Mees, Utrecht University
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
    if ('browser' in uil) {
        console.warn(
            "uil.browser already exists, this is unexpected, " +
            "we'll overwrite it."
        );
    }

    uil.browser = {};

    (function (context) {

        const MOBILE_ERROR_PAGE_LOCATION =
              'https://web-experiments.lab.hum.uu.nl/index_files/mobile/';

        let _UA_parser = undefined;

        // Wait till we are sure our supporting library is loaded
        // We add an onload on the script element, as this should fire before
        // window.onload
        document.getElementById('libs/ua-parser.min.js').onload =
            _ => {
                _UA_parser = new UAParser();
            };

        /**
         * Returns an object with some preformatted device information:
         * Browser: name and version
         * Device: device name (not always retrievable)
         * OS: The name of the OS, and it's version if known
         * isMobile: true if the device is a phone
         * isTablet: true if the device is a tablet
         * isTouchCapable: true if the browser has touch controls enabled.
         *
         *
         * If this function is called before all scripts are loaded, this
         * function will return undefined. (You should always wrap your
         * experiment in an onload function anyway).
         */
        context.getBrowserInfo = function () {
            if(typeof _UA_parser === 'undefined')
                return undefined;

            return {
                browser: context.getBrowser(),
                device: context.getDevice(),
                os: context.getOS(),
                isMobile: context.isMobile(),
                isTablet: context.isTablet(),
                isTouchCapable: context.isTouchCapable(),
            };
        };

        /**
         * Returns information about the resolution of the monitor the browser
         * window currently inhabits. Please note that these values aren't
         * constant, as participants can resize or move the browser window at
         * will. It's advised to retrieve this data repeatedly in every trial
         * where resolution can be a relevant factor.
         *
         * Returns:
         *
         * actualWidth/actualHeight:
         * The actual resolution of the monitor. This will always be the entire
         * resolution.
         *
         * usableWidth/usableHeight:
         * The amount of space available to the browser. Most of the time, this
         * will correspond to the actualX. In some cases however, this will be
         * slightly lower as the OS won't make the entire screen available to
         * the browser
         *
         * usedWidth/usedHeight:
         * The size of the page itself. This does not include the user interface
         * of the browser itself (the tab/navigation bar etc), so will only
         * correspond to usableX if the browser is set to fullscreen mode.
         * Note: some browsers don't include the scrollbar in this value, some
         * do.
         *
         * pixelRatio:
         * Websites don't use actual pixels anymore when rendering, but a
         * 'scaled' pixel. Usually, the ratio is set to 1. (Meaning 1 scaled
         * pixel equals 1 actual pixel). However, when using a HDPI screen
         * (such as a Retina screen, or most mobile phones), this will be a lot
         * higher. For example, MacBook screens use a pixelRatio of 2 (meaning 1
         * scaled pixel equals 2 actual pixels).
         * In addition, the zoom feature of a browser is often implemented by
         * increasing this ratio.
         * Thus,this variable can tell you if a user is using HDPI and/or
         * is zoomed in.
         */
        context.getResolutionInfo = function () {
            let output = {
                actualWidth: -1,
                actualHeight: -1,
                usableWidth: -1,
                usableHeight: -1,
                usedWidth: -1,
                usedHeight: -1,
                pixelRatio: -1,
            }

            if (window) {
                if (window.screen) {
                    output.actualWidth =  window.screen.width;
                    output.actualHeight = window.screen.height;
                    output.usableWidth =  window.screen.availWidth;
                    output.usableHeight = window.screen.availHeight;
                }
                output.usedWidth = window.innerWidth;
                output.usedHeight = window.innerHeight;
                output.pixelRatio = window.devicePixelRatio;
            }

            return output;
        };

        /**
         * Returns the name of the browser and it's version.
         *
         * If this function is called before all scripts are loaded, this
         * function will return undefined. (You should always wrap your
         * experiment in an onload function anyway).

         * @returns {string|undefined}
         */
        context.getBrowser = function () {
            if(typeof _UA_parser === 'undefined')
                return undefined;

            let browser = _UA_parser.getBrowser();

            return `${browser.name} ${browser.version}`;
        };

        /**
         * Returns the name of the device. Only a very small information of d
         * devices will actually identify itself, mostly on mobile.
         *
         * If this function is called before all scripts are loaded, this
         * function will return undefined. (You should always wrap your
         * experiment in an onload function anyway).
         *
         * @returns {string|undefined}
         */
        context.getDevice = function () {
            if(typeof _UA_parser === 'undefined')
                return undefined;

            let device = _UA_parser.getDevice();

            let device_str = "";
            if(device.vendor)
                device_str += `${device.vendor} `;
            if(device.model)
                device_str += `${device.model} `;
            if(device.type)
                device_str += `${device.type}`;

            if(!device_str)
                device_str = "Unknown device";

            return device_str;
        };

        /**
         * Returns the OS this browser is running on. And if known, it's
         * version.
         *
         * Not all browsers are as descriptive. For example, Chrome on Ubuntu
         * will return 'Linux'. Firefox however, will return 'Ubuntu'.
         *
         * If this function is called before all scripts are loaded, this
         * function will return undefined. (You should always wrap your
         * experiment in an onload function anyway).
         *
         * @returns {string|undefined}
         */
        context.getOS = function () {
            if(typeof _UA_parser === 'undefined')
                return undefined;

            let os = _UA_parser.getOS();

            let os_str = `${os.name}`;
            if (os.version)
                os_str += ` ${os.version}`;

            return os_str;
        };

        /**
         * Returns true if this device is a smartphone
         *
         * If this function is called before all scripts are loaded, this
         * function might be inaccurate.
         *
         * NOTE: Some android tablets will also be seen as a smartphone!
         * @returns {boolean}
         */
        context.isMobile = function () {
            // Use UAParser if it's already loaded. It's more accurate
            if (typeof _UA_parser !== "undefined")
            {
                return _UA_parser.getDevice().type === 'mobile'
            }

            let check = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        /**
         * Returns true if this device is a tablet
         *
         * If this function is called before all scripts are loaded, this
         * function might be inaccurate.
         *
         * @returns {boolean}
         */
        context.isTablet = function () {
            // Use UAParser if it's already loaded. It's more accurate
            if (typeof _UA_parser !== "undefined")
            {
                let browser_type = _UA_parser.getDevice().type;
                return browser_type === 'tablet'
            }

            let check = false;
            (function (a) {
                if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
            })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        };

        /**
         * Returns true if this device is a tablet or a smartphone
         *
         * If this function is called before all scripts are loaded, this
         * function might be inaccurate.
         *
         * @returns {boolean}
         */
        context.isMobileOrTablet = function () {
            return context.isMobile() || context.isTablet();
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
        };

        function _reject(predicate, location) {
            if (predicate()) {
                window.location = location;
            }
        }

        context.rejectMobile = () => _reject(context.isMobile, MOBILE_ERROR_PAGE_LOCATION);
        context.rejectMobileOrTablet = () => _reject(context.isMobileOrTablet, MOBILE_ERROR_PAGE_LOCATION);

    })(uil.browser)
}
