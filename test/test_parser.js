// Unit tests for the Cool lexer

'use strict';

var assert = require('assert');
var parser = require('../parser');
var ast = require('../cool_ast')
var ast_visitor = require('../ast_visitor');

var test = function() {
  try {
    test_parseerror();
    test_program();
    test_class();
    test_method();
    test_attr();
  } catch (e) {
    if (e instanceof parser.ParseError) {
      console.log(e.message);
    } else {
      console.log(e);
    }
    console.log(e.stack);
  }
}

var parse = function(s) {
  var p = new parser.Parser();
  return p.parse(s);
}

var test_parseerror = function() {
  // Sanity check for ParseError
  try {
    throw new parser.ParseError('foobar');
  } catch (e) {
    assert.ok(e instanceof parser.ParseError);
    assert.ok(e instanceof Error);
    assert.equal(e.message, 'foobar');
    assert.equal(e.stack.indexOf('Error: foobar\n    at test_parseerror'), 0);
  }
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

var _parse_class0 = function(s) {
  return parse(s).classes[0];
}

var test_class = function() {
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

var test_method = function() {

}

// Dumps the AST of ast and compares it to s. The comparison ignores all
// whitespace in order to be more stable.
var _compare_ast_dump = function(ast, s) {
  assert.deepEqual(ast_visitor.dump_ast(ast).split(/\s+/), s.split(/\s+/));
}

var test_attr = function() {
  var cls = _parse_class0('class C {at : Int}');
  assert.equal(cls.features.length, 1);

  var attr = cls.features[0];
  assert.ok(attr instanceof ast.Attr);
  assert.equal(attr.name, 'at');
  assert.equal(attr.type_decl, 'Int');
  assert.ok(attr.init instanceof ast.NoExpr);

  // from now on we'll be using dump_ast too for easier comparisons
  _compare_ast_dump(attr, 'Attr(name=at, type_decl=Int) NoExpr()');

  // simple initializer for an attribute
  cls = _parse_class0('class C {at : Chowbaka <- 2}');
  attr = cls.features[0];
  assert.ok(attr.init instanceof ast.IntConst);
  _compare_ast_dump(attr, 'Attr(name=at, type_decl=Chowbaka) IntConst(token=2)');

  // a somewhat more complex initializer
  cls = _parse_class0('class C {at : Chowbaka <- if 2 then 3 else ((4)) fi}');
  attr = cls.features[0];
  assert.ok(attr.init instanceof ast.Cond);
  _compare_ast_dump(attr, 'Attr(name=at, type_decl=Chowbaka) ' +
                          ' Cond() IntConst(token=2) IntConst(token=3) IntConst(token=4)');
}

if (module.parent === null) {
  test();
}
