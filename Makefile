#-------------------------------------------------------------------------------
# Makefile for building the project and running tests.
#
# Eli Bendersky (eliben@gmail.com)
# This code is in the public domain
#-------------------------------------------------------------------------------

# Path to Python 3.4, which is required to run the code-generation scripts.
PY34 = py34

all: cool_ast.js

cool_ast.js: cool_ast.asdl tools/asdl_gen_js.py
	$(PY34) tools/asdl_gen_js.py $^ > $@

.PHONY: test clean

# This is our 21st-century test runner
test:
	node test/test_ast.js
	node test/test_lexer.js
	node test/test_parser.js
	@echo "-- Look above for errors. Passing tests are silent."

clean:
	rm -rf cool_ast.js


