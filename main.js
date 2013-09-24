'use strict';

var lexer = require('./lexer');
var fs = require('fs');


// The main compiler driver will be here. For now just some sample driving code
// for the sub-modules.

if (module.parent === null) {
  var fileinput = fs.readFileSync('test.cl', 'utf8');
  var result = lexer.lex_all(fileinput);

  if (result.errors.length >= 1) {
    for (var i = 0; i < result.errors.length; i++) {
      console.log('ERROR', result.errors[i]);
    };
  }

  for (var i = 0; i < result.tokens.length; i++) {
    console.log(result.tokens[i]);
  };
}

