uil namespace
=============

This page documents the functions that are available in the *uil* namespace, as
such, all functions/classes on this page should be used as follows:


..
  js:autofunction:: isOnline it's defined in libs/env but exported here...

.. js:autofunction:: setAccessKey
.. js:autofunction:: useAcceptationServer
.. js:autofunction:: stopIfExperimentClosed
.. js:autofunction:: saveData
.. js:autofunction:: saveJson
.. js:autofunction:: resolveServer

Namespaces
----------
Additionally to the functions above, a number of modules are exported as namespaces 
from uil namespace, these namespaces contain functions to some specific functionality,
these namespaces such as **random** functions and **browser** information.
You can use these namespaces by using ``uil.random.randomise(array)`` or 
``uil.browser.isMobile()``. The following namespaces are exported from ``uil``.

1. :doc:`browser` to retrieve info about the browser and device the client is workin on.
2. uil.error for some error handeling
3. uil.randomization to randomize arrays (with constrains).
4. uil.session for the dataservers session API
5. uil.focus to check whether the participant is focusing on the experiment
