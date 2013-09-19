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
// The expected tokens is an array of objects. These objects must have .name
// and .value attributes. Optionally, they can also have .lineno and .pos - if
// these exist they will be compared to the actual tokens.
var assert_lexer_tokens = function(str, expected_toks) {
  var result = lex_all(str);
  if (result.tokens.length !== expected_toks.length) {
    assert.deepEqual(result.tokens, expected_toks);
  }

  for (var i = 0; i < result.tokens.length; ++i) {
    var exp_tok = expected_toks[i];
    var result_tok = result.tokens[i];

    assert.equal(exp_tok.name, result_tok.name);
    assert.equal(exp_tok.value, result_tok.value);
    if (exp_tok.hasOwnProperty('pos')) {
      assert.equal(exp_tok.pos, result_tok.pos);
    }
    if (exp_tok.hasOwnProperty('lineno')) {
      assert.equal(exp_tok.lineno, result_tok.lineno);
    }
  }

  assert.deepEqual(result.errors, []);
}


var assert_lexer_errors = function(str, expected_errors) {
  var result = lex_all(str);

  assert.deepEqual(result.errors, expected_errors);
}


var test = function() {
  // Basic tokens
  assert_lexer_tokens('foobar 123', [
    {"name":"IDENTIFIER","value":"foobar"},
    {"name":"NUMBER","value":"123"}
    ]);
  assert_lexer_errors('topo %', ["Line 1: Unknown token '%'"]);
  assert_lexer_errors('topo \n$', ["Line 2: Unknown token '$'"]);

  // Operators
  assert_lexer_tokens('+ - * / ~ < <= = ( ) => <- ;', [
    { name: 'PLUS', value: '+', pos: 0, lineno: 1 },
    { name: 'MINUS', value: '-', pos: 2, lineno: 1 },
    { name: 'MULTIPLY', value: '*', pos: 4, lineno: 1 },
    { name: 'DIVIDE', value: '/', pos: 6, lineno: 1 },
    { name: 'TILDE', value: '~', pos: 8, lineno: 1 },
    { name: 'LE', value: '<', pos: 10, lineno: 1 },
    { name: 'LEQ', value: '<=', pos: 12, lineno: 1 },
    { name: 'EQ', value: '=', pos: 15, lineno: 1 },
    { name: 'L_PAREN', value: '(', pos: 17, lineno: 1 },
    { name: 'R_PAREN', value: ')', pos: 19, lineno: 1 },
    { name: 'CASE_ARROW', value: '=>', pos: 21, lineno: 1 },
    { name: 'ASSIGN_ARROW', value: '<-', pos: 24, lineno: 1 },
    { name: 'SEMI', value: ';', pos: 27, lineno: 1 }])

  // Comments
  assert_lexer_tokens('\n-- comment 123\n--another 123', []);
  assert_lexer_tokens('(*\n\n*)', []);

  // Strings
  assert_lexer_errors('"ffa\n2', ['Line 1: Unterminated string']);
}


if (module.parent === null) {
  test();
}

