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
  var s = 'class Main\n\
            {joe() : Int {2 * 5 - 8}; }'; 
  var prog = parse(s);
  assert.equal(prog.classes[0].name, 'Main');
}

if (module.parent === null) {
  test();
}
