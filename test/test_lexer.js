'use strict';

var assert = require('assert');
var lexer = require('../lexer');


// Utility method to lex all tokens from a given string. Returns tokens and
// lexer errors packed into an object.
var lex_all = function(str) {
  var lex = new lexer.Lexer();
  lex.input(str);

  var toks = []
  while (true) {
    var tok = lex.token();
    if (tok === null) {
      break;
    } else {
      toks.push(tok);
    }
  }
  return {'tokens': toks, 'errors': lex.errors};
}


// Assert that lexing str produces the expected tokens, without any errors.
var assert_lexer_tokens = function(str, expected_toks) {
  var result = lex_all(str);

  assert.deepEqual(result.tokens, expected_toks);
  assert.deepEqual(result.errors, []);
}


var assert_lexer_errors = function(str, expected_errors) {
  var result = lex_all(str);

  assert.deepEqual(result.errors, expected_errors);
}


var test = function() {
  // Basic tokens
  assert_lexer_tokens('foobar 123', [
    {"name":"IDENTIFIER","value":"foobar","pos":0,"lineno":1},
    {"name":"NUMBER","value":"123","pos":7,"lineno":1}
    ]);
  assert_lexer_errors('topo %', ["Line 1: Unknown token '%'"]);
  assert_lexer_errors('topo \n$', ["Line 2: Unknown token '$'"]);

  // Comments
  assert_lexer_tokens('\n-- comment 123\n--another 123', []);
  assert_lexer_tokens('(*\n\n*)', []);

  // Strings
  assert_lexer_errors('"ffa\n2', ['Line 1: Unterminated string']);
}


if (module.parent === null) {
  test();
}

