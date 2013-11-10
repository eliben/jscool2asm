// Unit tests for the Cool lexer

'use strict';

var assert = require('assert');
var lexer = require('../lexer');

// Assert that lexing str produces the expected tokens, without any errors.
// The expected tokens is an array of objects. These objects must have .name
// and .value attributes. Optionally, they can also have .lineno and .pos - if
// these exist they will be compared to the actual tokens.
var assert_lexer_tokens = function(str, expected_toks) {
  var result = lexer.lex_all(str);
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
  var result = lexer.lex_all(str);

  assert.deepEqual(result.errors, expected_errors);
}


var test = function() {
  // Basic tokens
  assert_lexer_tokens('foobar 123', [
    {"name":"IDENTIFIER","value":"foobar"},
    {"name":"NUMBER","value":"123"}]);
  assert_lexer_errors('topo %', ["Line 1: Unknown token '%'"]);
  assert_lexer_errors('topo \n$', ["Line 2: Unknown token '$'"]);
  assert_lexer_errors('joe $\n %', [
    'Line 1: Unknown token \'$\'',
    'Line 2: Unknown token \'%\'']);

  // Keywords, types and identifiers
  assert_lexer_tokens('Type id, if B2434', [
    { name: 'TYPE', value: 'Type'},
    { name: 'IDENTIFIER', value: 'id'},
    { name: 'COMMA', value: ','},
    { name: 'IF', value: 'if'},
    { name: 'TYPE', value: 'B2434'}]);

  assert_lexer_tokens('esac Esac OF of', [
    { name: 'ESAC', value: 'esac'},
    { name: 'TYPE', value: 'Esac'},
    { name: 'TYPE', value: 'OF'},
    { name: 'OF', value: 'of'}]);

  // Operators
  assert_lexer_tokens('+ - * / ~ < <= = ( ) => <- ; { } , . @', [
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
    { name: 'SEMI', value: ';', pos: 27, lineno: 1 },
    { name: 'L_BRACE', value: '{', pos: 29, lineno: 1 },
    { name: 'R_BRACE', value: '}', pos: 31, lineno: 1 },
    { name: 'COMMA', value: ',', pos: 33, lineno: 1 },
    { name: 'PERIOD', value: '.', pos: 35, lineno: 1 },
    { name: 'AT', value: '@', pos: 37, lineno: 1 }]);

  // Strings
  assert_lexer_tokens('out "inside" out', [
    { name: 'IDENTIFIER', value: 'out'},
    { name: 'STRING', value: '"inside"'},
    { name: 'IDENTIFIER', value: 'out'}]);

  assert_lexer_tokens('x "in a string \\\nand next line" too', [
    { name: 'IDENTIFIER', value: 'x', pos: 0, lineno: 1},
    { name: 'STRING', value: '"in a string \\\nand next line"', pos: 2, lineno: 1},
    { name: 'IDENTIFIER', value: 'too', pos: 32, lineno: 2 }]);

  assert_lexer_tokens('x "here is a \\" quote in a string"', [
    { name: 'IDENTIFIER', value: 'x', pos: 0, lineno: 1},
    { name: 'STRING', value: '"here is a \\" quote in a string"'}]);

  assert_lexer_errors('"ffa\n2', ['Line 1: Unterminated string']);
  assert_lexer_errors('x "in a string \nand next line" too', [
    'Line 1: Unescaped newline inside a string']);

  // Comments
  assert_lexer_tokens('\n-- comment 123\n--another 123', []);
  assert_lexer_tokens('(*\n\n*)', []);
  assert_lexer_errors('(*\n\n', ['Line 3: Unterminated multi-line comment at EOF']);
  assert_lexer_tokens('id (* \n in comment (* nested *) \n *) out', [
    { name: 'IDENTIFIER', value: 'id', lineno: 1 },
    { name: 'IDENTIFIER', value: 'out', lineno: 3 }]);
}


if (module.parent === null) {
  test();
}
