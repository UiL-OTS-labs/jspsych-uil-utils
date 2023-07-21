// import * as focus from ../jspsych-uil-focus.js
var IlsFocusPlugin = (function (jspsych) {
    "use strict";

    const info = {
        name: "IlsFocusPlugin",
        parameters: {
            clear : {
                type: jspsych.ParameterType.BOOLEAN,
                default: false,
            },
        },
    };

    /**
     * **Ils focus plugin**
     *
     * A plugin to run as trial that extracts how much time the
     * participant spends in the browser and browser tab. This might
     * prove a useful measure to how well a participant attended the task
     * versus other tasks.
     *
     * @author Maarten Duijndam
     */
    class IlsFocusPlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }

        trial(display_element, trial) {

            uil.focus.registerUserFocus(); // make sure it is active.

            console.assert(typeof trial.clear === 'boolean');

            // data saving
            var trial_data = {
                focus_stats : uil.focus.getStats(),
            };

            if (trial.clear === true) {
                uil.focus.clearUserFocus();
                uil.focus.registerUserFocus(); // Re enable it.
            }

            // end trial
            this.jsPsych.finishTrial(trial_data);
        }
    }
    IlsFocusPlugin.info = info;

    return IlsFocusPlugin;
})(jsPsychModule);
