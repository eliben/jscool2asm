// Unit tests for the Cool lexer

'use strict';

var assert = require('assert');
var parser = require('../parser');
var ast = require('../cool_ast')
var ast_visitor = require('../ast_visitor');


var test = function() {
  test_program();
}

var parse = function(s) {
  var p = new parser.Parser();
  return p.parse(s);
}

var test_program = function() {
  // Basic tests for program-level nodes
  var s = 'class Main\n\
            {joe() : Int {2 * 5 - 8}; }'; 
  var prog = parse(s);
  assert.equal(prog.classes.length, 1);
  assert.equal(prog.classes[0].name, 'Main');
  assert.equal(prog.classes[0].loc, 1);

  s = '\n\
      class C1\n\
      { meth : Int; att : Int}\n\
      class C2\n\
      { at1 : Int}'
  prog = parse(s);
  assert.equal(prog.classes.length, 2);
  assert.equal(prog.classes[0].name, 'C1');
  assert.equal(prog.classes[0].loc, 2);
  assert.equal(prog.classes[1].name, 'C2');
  assert.equal(prog.classes[1].loc, 4);
}

if (module.parent === null) {
  test();
}
