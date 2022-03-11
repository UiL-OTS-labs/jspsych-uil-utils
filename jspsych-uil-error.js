'use strict'

if (typeof uil === 'undefined') {
    console.error("UiL Main library not loaded! " +
        "Refusing to load uil.error");
}
else {
    if ('error' in uil) {
        console.warn("uil.error already exists, this is unexpected, " +
                     "we'll overwrite it.");
    }

    uil.error = {};

    (function (context) {
        context.redirect = function(message) {
            let encoded = btoa(message);
            window.location.href = 'https://web-experiments.lab.hum.uu.nl/index_files/error/?msg=' + encoded;
        };

        context.alert = function(message) {
            let bg = document.createElement('div');
            bg.style.position = 'fixed';
            bg.style.top = '0';
            bg.style.width = '100%';
            bg.style.height = '100vh';
            bg.style.background = 'rgba(0, 0, 0, 0.2)';

            let dialog = document.createElement('div');
            dialog.style.background = '#fff';
            dialog.style.color = '#333';
            dialog.style.border = '1px solid #d90000';
            dialog.style.margin = '30vh auto 0 auto';
            dialog.style.textAlign = 'center';
            dialog.style.width = '50%';
            dialog.style.paddingBottom = '15px';

            let heading = document.createElement('h2');
            heading.innerText = 'Error';
            dialog.innerHTML = message;
            dialog.prepend(heading);

            bg.append(dialog);
            document.body.append(bg);
        };

        context.registerHandler = function() {
            let handler = context.alert;
            if (uil.isOnline()) {
                handler = context.redirect;
            }

            window.addEventListener('error',  (msgOrEvent, source, line, col, err) => {
                let message = msgOrEvent;
                if (typeof msgOrEvent.message !== 'undefined') {
                    message = msgOrEvent.message;
                }
                handler(message);
            });
            window.addEventListener('unhandledrejection', function (e) {
                handler(e.reason.message);
            });
        };
    })(uil.error);

    uil.error.registerHandler();
}
