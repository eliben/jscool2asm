'use strict';

var ast_visitor = require('./ast_visitor');
var lexer = require('./lexer');
var parser = require('./parser');
var fs = require('fs');


// The main compiler driver will be here. For now just some sample driving code
// for the sub-modules.

if (module.parent === null) {
  var fileinput = fs.readFileSync('cool_code_samples/test.cl', 'utf8');

  //var fileinput = '"hola i am dora"';
  var fileinput = '(((foo(1, 2))))';

  //var result = lexer.lex_all(fileinput);

  //if (result.errors.length >= 1) {
    //for (var i = 0; i < result.errors.length; i++) {
      //console.log('ERROR', result.errors[i]);
    //};
  //}

  //for (var i = 0; i < result.tokens.length; i++) {
    //console.log(result.tokens[i]);
  //};
  //try {
    var prsr = new parser.Parser();
    console.log('----> Parsing:');
    console.log(fileinput);
    var ast = prsr.parse(fileinput);
    console.log('----> Result:');
    console.log(ast);
    console.log(ast_visitor.dump_ast(ast, true));
  //} catch (e) {
    //if (e instanceof parser.ParseError) {
      //console.log('Caught ParseError');
      //console.log(e.message);
    //} else {
      //console.log('Caught some other exception');
      //console.log(e);
    //}
  //}
}

