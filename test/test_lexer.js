'use strict';

var assert = require('assert');
var lexer = require('../lexer');


// Assert that lexing str produces the expected tokens, without any errors.
var assert_lexer_tokens = function(str, expected_toks) {
  var lex = new lexer.Lexer();
  lex.input(str);

  var got_toks = []
  while (true) {
    var tok = lex.token();
    if (tok === null) {
      break;
    } else {
      got_toks.push(tok);
    }
  }

  assert.deepEqual(got_toks, expected_toks);
  assert.deepEqual(lex.errors, []);
}


var test = function() {
  assert_lexer_tokens('foobar 123', [
    {"name":"IDENTIFIER","value":"foobar","pos":0,"lineno":1},
    {"name":"NUMBER","value":"123","pos":7,"lineno":1}
    ]);

  assert_lexer_tokens('\n-- comment 123\n--another 123', []);
  assert_lexer_tokens('(*\n\n*)', []);
}


if (module.parent === null) {
  test();
}

