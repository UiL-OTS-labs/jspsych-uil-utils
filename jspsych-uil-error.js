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

    const ERR_DIALOG_ID = 'uil_error_dialog';

    function redirect(message) {
        let encoded = btoa(message);
        window.location.href = 'https://web-experiments.lab.hum.uu.nl/index_files/error/?msg=' + encoded;
    }

    function createErrorDialog() {
        let bg = document.createElement('div');
        bg.style.position = 'fixed';
        bg.style.top = '0';
        bg.style.width = '100%';
        bg.style.height = '100vh';
        bg.style.background = 'rgba(0, 0, 0, 0.2)';

        let dialog = document.createElement('div');
        dialog.id = ERR_DIALOG_ID;
        dialog.style.background = '#fff';
        dialog.style.color = '#333';
        dialog.style.border = '1px solid #d90000';
        dialog.style.margin = '30vh auto 0 auto';
        dialog.style.textAlign = 'center';
        dialog.style.width = '50%';
        dialog.style.padding = '15px';

        let heading = document.createElement('h2');
        heading.innerText = 'Error';
        dialog.prepend(heading);

        bg.append(dialog);
        if (document.body === null) {
            window.addEventListener('load', () => document.body.append(bg));
        }
        else {
            document.body.append(bg);
        }
        return dialog;
    }

    let _dialog = null;

    (function (context) {

        context.alert = function(message, source, line) {
            let dialog = _dialog;
            if (_dialog === null) {
                _dialog = createErrorDialog();
                dialog = _dialog;
            }

            let p = document.createElement('p');
            if (typeof source !== 'undefined' && typeof line !== 'undefined') {
                message = `${message} <small>(${source}:${line})</small>`;
            }
            p.innerHTML = message;
            p.style.textAlign = 'left';
            dialog.append(p);
        };

        function registerHandler() {
            let handler = context.alert;
            if (uil.isOnline()) {
                handler = redirect;
            }

            window.addEventListener('error',  (event) => {
                let message = event.message;
                let path = event.filename.split('/');
                let source = path[path.length-1];
                handler(message, source, event.lineno);
            });
            window.addEventListener('unhandledrejection', function (e) {
                handler(e.reason.message);
            });
        };

        registerHandler();

    })(uil.error);
}
