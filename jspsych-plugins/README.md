# jsPsych plugin directory

JsPsych allows to register custom plugins. Some plugins might become very
handy in future experiments. Plugins related to jsPsych are stored here. The
user may include them from the experiment via a link to the utils and then
the just like other jsPsychUtils.

## Current plugins

- **IlsFocusPlugin**: This is a trial where instead of presenting a trial, the
    current focus is recorded. At the first instance of the plugin the recording
    starts and at the second, you can see how well the user has focused on the
    task. The plugin spits out the statistics about how well the participant
    focused on the task.
    An example is given in example-focus-plugin.html
