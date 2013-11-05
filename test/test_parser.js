// Unit tests for the Cool lexer

'use strict';

var assert = require('assert');
var parser = require('../parser');
var ast = require('../cool_ast')
var ast_visitor = require('../ast_visitor');


var test = function() {
  test_program();
  test_class();
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

  var _make_class = function(n) {
    return 'class C' + n + '{x : Y}\n\n';
  }

  s = '';
  for (var i = 0; i < 100; i++) {
    s += _make_class(i);
  }
  prog = parse(s);
  assert.equal(prog.classes.length, 100);
  assert.equal(prog.classes[99].loc, 199);
}

var test_class = function() {
  var _parse_class0 = function(s) {
    return parse(s).classes[0];
  }

  // Class-level nodes
  var cls = _parse_class0('class C {at : Int}');
  assert.equal(cls.name, 'C');
  assert.equal(cls.parent, null);
  assert.equal(cls.features.length, 1);

  cls = _parse_class0('class C {at : Int; f : F}');
  assert.equal(cls.features.length, 2);

  cls = _parse_class0('class F inherits T {at : Int}');
  assert.equal(cls.name, 'F');
  assert.equal(cls.parent, 'T');
}

if (module.parent === null) {
  test();
}
