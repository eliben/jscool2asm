'use strict';

var ast_visitor = require('./ast_visitor');
var lexer = require('./lexer');
var parser = require('./parser');
var fs = require('fs');


// The main compiler driver will be here. For now just some sample driving code
// for the sub-modules.

var testdrive = function() {
  var fileinput = fs.readFileSync('cool_code_samples/test.cl', 'utf8');

  var fileinput = 'class Main {\n\
                    joe() : Int {\n\
                      2 * 5 - 8}; }';
  //var fileinput = '{(((foo(1, 2) * 4 - 5))); \n\
                   //let joe : Kooka <- 10, moe : Inr <- "google" in (choochoo);\n\
                   //if new Foo then true else (20);\n\
                   //case joe of foo : Foo => 20; joo : Joo => true;  esac\n\
                   //while ~ not 10 loop 10 pool; "je"}';
  try {
    var prsr = new parser.Parser();
    console.log('----> Parsing:');
    console.log(fileinput);
    var ast = prsr.parse(fileinput);
    console.log('----> Result:');
    console.log(ast);
    console.log('----');
    console.log(ast_visitor.dump_ast(ast, true));
  } catch (e) {
    if (e instanceof parser.ParseError) {
      console.log('Caught ParseError');
      console.log(e.message);
    } else {
      console.log('Caught some other exception');
      console.log(e);
    }
    console.log('== Stack trace ==');
    console.log(e.stack);
  }
}

if (module.parent === null) {
  testdrive();
}

