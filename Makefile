#-------------------------------------------------------------------------------
# Makefile for building the project - some of the code is auto-generated.
#
# Eli Bendersky (eliben@gmail.com)
# This code is in the public domain
#-------------------------------------------------------------------------------

# Path to Python 3.4, which is required to run the code-generation scripts.
PY34 = py34

all: cool_ast.js

cool_ast.js: cool_ast.asdl
	$(PY34) tools/asdl_gen_js.py $^ > $@

clean:
	rm -rf cool_ast.js


