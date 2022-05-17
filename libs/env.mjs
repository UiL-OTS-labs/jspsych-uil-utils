export {isOnline, getWindow};

function getHostname() {
    return $window.location.hostname;
}

function getProtocol() {
    return $window.location.protocol;
}


function isOnline(
    protocol = getProtocol(),
    hostname = getHostname()
) {
    let prot_online = protocol === "http:" || protocol === "https:";
    let host_online = hostname !== "localhost" && hostname !== "127.0.0.1" ;
    return prot_online && host_online;
}


// set up a proxy object for the browser's window, so that it is possible
// to later override it with mocks when testing
Object.defineProperty(window,
    '$window',
    {
        configurable: true,
        get() {
            return window;
        }
    });


function getWindow() {
    return $window;
}
