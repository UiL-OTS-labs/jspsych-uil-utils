
focus namespace
===============

This page documents the `uil.focus` namespace/module. This namespace contains
some functions to help to see whether the participant is focussed on the experiment
or is doing other stuff. It keeps track of whether the focus is at the
current task, or the focus goes to another task for example.

classes in the focus module
===========================

.. js:autoclass:: FocusStats

   .. js:autoattribute:: FocusStats#is_active
   .. js:autoattribute:: FocusStats#cum_active
   .. js:autoattribute:: FocusStats#cum_inactive
   .. js:autoattribute:: FocusStats#num_focus
   .. js:autoattribute:: FocusStats#num_focus_lost
   .. js:autoattribute:: FocusStats#num_shows
   .. js:autoattribute:: FocusStats#num_hides

functions in the focus module
=============================
.. js:autofunction:: registerUserFocus
.. js:autofunction:: clearUserFocus
.. js:autofunction:: getStats
