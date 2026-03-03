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
                    default: undefined,
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

        injectStyle(display_element) {
            display_element.classList.add('ils');
            let style = document.createElement('style');
            style.innerHTML += `
                .ils {
                    .info {
                        display: none;
                        font-size: .8em;
                        width: 30%;
                    }
                    .info-toggle {
                        cursor: pointer;
			width: 20px;
			height: 20px;
			display: inline-block;
			background: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTguNDMzIiBoZWlnaHQ9IjE4LjQzMyIgdmlld0JveD0iMCAwIDUgNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiPjxjaXJjbGUgY3g9IjIuNDM4NSIgY3k9IjIuNDM4NSIgcj0iMi4xNzQiIHN0cm9rZS13aWR0aD0iLjUyOTIiLz48cGF0aCBkPSJNMi40Mzg1IDMuNzkzVjIuMDI3NE0yLjQzODUgMS41NDI2di0uNDMzMSIgc3Ryb2tlLXdpZHRoPSIuNDc2MyIvPjwvZz48L3N2Zz4K") no-repeat;
                    }
                    .info-toggle.clicked + .info {
                        &:before {
                            content: '';
                            border-bottom: 8px solid transparent;
                            border-right: 8px solid #eee;
                            border-top:  8px solid transparent;
                            border-left: 8px solid transparent;
                            width: 0;
                            height: 0;
                            margin-left: -24px;
                            margin-top: -4px;
                            display: block;
                            background: none;
                            position: absolute;
                        }
                        display: inline;
                        position: absolute;
                        padding: 10px;
                        margin-left: 10px;
                        background: #eee;
                        border-radius: 10px;
                    }
                }
            `;

            display_element.append(style);
            display_element.querySelectorAll('.info-toggle').forEach(
                toggle => toggle.addEventListener('click', event => {
                    event.stopPropagation();
		    // hide any other tooltip that might be open
		    display_element.querySelectorAll('.info-toggle.clicked').forEach(
			toggle => toggle.classList.remove('clicked'));
                    toggle.classList.toggle('clicked')
                })
            );

            document.body.addEventListener('click', () => {
                display_element.querySelectorAll('.info-toggle.clicked').forEach(
                    toggle => toggle.classList.remove('clicked'));
            });
        }

        showForm(display_element, trial, initial = {}) {
            let form = document.createElement('form');
            form.innerHTML = trial.html;
            display_element.innerHTML = '';
            display_element.append(form);
            this.injectStyle(display_element);

            Object.entries(initial).forEach(([key, value]) => {
                form[key].value = value;
            });

            form.addEventListener('submit', (event) => {
                event.preventDefault();
                // collect form data into this.data
                // only entries defined in `fields` parameter will be collected
                Object.keys(trial.fields).forEach(key => {
		    if (!(key in form)) {
			throw new Error(`Missing value for field ${key}`);
		    }
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
                this.jsPsych.endExperiment(trial.exclusionPrompt);
            }
            else {
                // survey is complete
                this.jsPsych.finishTrial(this.data);
            }
        }
    }

    return IlsSurvey;
})(jsPsychModule);
