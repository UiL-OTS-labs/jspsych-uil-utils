# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "jspsych-uil-utils"
copyright = "2025, Ilslab"
author = "Ilslab"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx_js",
    "sphinx_rtd_theme",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinx_rtd_theme"
html_static_path = ["_static"]

# # -- To configure stuff for JSDoc -------------------------------------------------

# setup path to javascript source
js_source_path = "../"

# # We might need to uncomment the following for typescript (when necessary)
# # js_language = 'typescript'

# # As the utils is primarily a javascript library we use "js" as default domain
# # this would remain the same when using typescript
# primary_domain = "js"
