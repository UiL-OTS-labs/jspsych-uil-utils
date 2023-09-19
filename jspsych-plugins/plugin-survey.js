let IlsSurveyPlugin = (function (jspsych) {
    "use strict";

    /**
       This plugin is intended to simplify the survey part of experiments.
       It lets you define a survey with free-form HTML and exclusion criteria based on the response data.
    */
    class IlsSurvey {
        static info = {
            name: "IlsSurveyPlugin",
            parameters: {
                /**
                   Definition of survey fields. For each field, a label and options may be provided, e.g.:
                   handedness: {label: 'Handedness', options: {right: "Right", left: "Left"}}
                   The labels have no effect on the survey form, but are used in the review screen.
                */
                fields: {
                    type: jspsych.ParameterType.OBJECT,
                    default: {},
                },
                /**
                   HTML for survey, will be internally wrapped in a <form> element
                */
                html: {
                    type: jspsych.ParameterType.HTML_STRING,
                    default: '',
                },
                /**
                   Used for defining exclusion criteria. Provided function will be called with response data
                   as sole argument. Returning true means the participant is excluded.
                */
                exclusion: {
                    type: jspsych.ParameterType.FUNCTION,
                    default: {},
                },
                /**
                   Message for excluded participants
                */
                exclusionPrompt: {
                    type: jspsych.ParameterType.HTML_STRING,
                    default: 'Unfortunately you cannot participate in this experiment because you do not meet our criteria for participants',
                },
                /**
                   Whether a review screen should be shown
                */
                review: {
                    type: jspsych.ParameterType.BOOL,
                    default: true
                },
                /**
                   Prompt for review screen
                */
                reviewPrompt: {
                    type: jspsych.ParameterType.HTML_STRING,
                    default: '<h4>Please review:</h4>',
                },
                /**
                   Label for review screen ok button
                */
                ok: {
                    type: jspsych.ParameterType.STRING,
                    default: 'Correct',
                },
                /**
                   Label for review screen cancel button
                */
                cancel: {
                    type: jspsych.ParameterType.STRING,
                    default: 'Change',
                },
            },
        };

        constructor(jsPsych) {
            this.jsPsych = jsPsych;
            this.data = {};
        }

        trial(display_element, trial) {
            this.showForm(display_element, trial);
        }

        showForm(display_element, trial, initial = {}) {
            let form = document.createElement('form');
            form.innerHTML = trial.html;
            display_element.innerHTML = '';
            display_element.append(form);

            Object.entries(initial).forEach(([key, value]) => {
                form[key].value = value;
            });

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                // collect form data into this.data
                // only entries defined in `fields` parameter will be collected
                Object.keys(trial.fields).forEach(key => {
                    this.data[key] = form[key].value;
                });

                if (trial.review) {
                    // continue to review screen
                    this.showReview(display_element, trial);
                }
                else {
                    // skip review and proceed to check exclusion
                    this.beforeFinish(display_element, trial);
                }
            });
        }

        /**
           Render form value based on `fields` definition, if relevant
        */
        fieldDisplayValue(trial, key, value) {
            let options = trial.fields[key].options;
            if (options) {
                return options[value];
            }
            return value;
        }

        fieldDisplayLabel(trial, key) {
            return trial.fields[key].label ?? key;
        }

        /**
           Display review screen
        */
        showReview(display_element, trial) {
            display_element.innerHTML = trial.reviewPrompt +
                Object.entries(this.data).map(([key, value]) =>
                    `<p><strong>${this.fieldDisplayLabel(trial, key)}</strong>: ${this.fieldDisplayValue(trial, key, value)}</p>`
                ).join('\n');

            // prepare buttons
            let ok = document.createElement('button');
            let cancel = document.createElement('button');
            ok.innerHTML = trial.ok;
            ok.className = 'jspsych-btn';
            ok.style.margin = '10px';
            cancel.innerHTML = trial.cancel;
            cancel.className = 'jspsych-btn';
            cancel.style.margin = '10px';

            ok.addEventListener('click', () => this.beforeFinish(display_element, trial));
            // clicking cancel will trigger the form again (while populating fields from this.data)
            cancel.addEventListener('click', () => this.showForm(display_element, trial, this.data));

            display_element.append(ok);
            display_element.append(cancel);
        }

        beforeFinish(display_element, trial) {
            let exclude = false;
            if (trial.exclusion) {
                // check for exclusion
                exclude = trial.exclusion(this.data);
            }

            if (exclude) {
                // show rejection screen
                display_element.innerHTML = trial.exclusionPrompt;
                this.jsPsych.endExperiment();
            }
            else {
                // survey is complete
                this.jsPsych.finishTrial(this.data);
            }
        }
    }

    return IlsSurvey;
})(jsPsychModule);
