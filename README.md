# jspsych-uil-utils
A small set of utilities that can be reused throughout jsPsych style experiments.

# Introduction
In the lab we are moving research online. We use javascript in combination with
the jsPsych library: https://www.jspsych.org/ . jsPsych offers great functions
to present stimuli to the participant at their web capable device.

This library intends to add some small utility functions that can be used
throughout multiple experiments. For example in order to use the best sound
library with jsPsych we can add a function that uses the best api given the
protocol used inside of the browser file:// vs https:// or http:// .

All functions are inside a "namespace" called 'uil'. In such way that we can
directly see that it comes from our library.

For the students using our this library it might be convenient to test their
experiment using the file:// protocol, since most if not all jsPscych
documentation uses this in examples. So we choose old style modularization
instead of:

    <script type="module"/>

# Usage
the main file jspsych-uil-utils.js should be included after jsPsych, since
it might depend on variables defined in jsPsych.

The next example is taken from the uilots visual lexical descision with visual
prime boiler plate :

```html
<html>
    <head>
        <title>My experiment title</title>
        <script src="https://web-experiments.lab.hum.uu.nl/jspsych/6.1.0/jspsych.js"></script>
        <script src="https://web-experiments.lab.hum.uu.nl/jspsych/6.1.0/plugins/jspsych-html-keyboard-response.js"></script>
        <script src="https://web-experiments.lab.hum.uu.nl/jspsych/6.1.0/plugins/jspsych-html-button-response.js"></script>
        <link href="https://web-experiments.lab.hum.uu.nl/jspsych/6.1.0/css/jspsych.css" rel="stylesheet" type="text/css"/>

        <!-- Uil OTS libraries -->
        <script type="module" src="https://web-experiments.lab.hum.uu.nl/jspsych-uil-utils/0.3/jspsych-uil-utils-import.js"></script>

        <!-- Uil OTS scripts -->
        <script src="stimuli.js"></script>
        <script src="globals.js"></script>
        <script src="instructions.js"></script>
    </head>
    <body>
    </body>
    <script>
        
/* Create timeline */

jsPsych.init(
    {
        timeline: timeline,
        on_finish : function () {
            uil.saveData(ACCESS_KEY);
            // or to save to the acceptation server:
            // uil.saveData(ACCESS_KEY, true);
    }
);

    </script>
</html>
```
