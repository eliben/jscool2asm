// Unit tests for the Cool parser

'use strict';

var assert = require('assert');
var parser = require('../parser');
var ast = require('../cool_ast')
var ast_visitor = require('../ast_visitor');
var utils = require('../utils');

var test = function() {
  test_parseerror();
  test_program();
  test_class();
  test_method();
  test_attr();
  test_expressions();
}

var parse = function(s) {
  var p = new parser.Parser();
  return p.parse(s);
}

var parse_expr = function(s) {
  var p = new parser.Parser();
  return p.parse_expression(s);
}

// Dumps the AST of ast and compares it to s. The comparison ignores all
// whitespace in order to be more stable.
var _compare_ast_dump = function(ast, s) {
  assert.deepEqual(ast_visitor.dump_ast(ast).split(/\s+/), s.split(/\s+/));
}

// Helper method for parsing s an returning the first class node.
var _parse_class0 = function(s) {
  return parse(s).classes[0];
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

  // A relatively complete class with multiple attributes and methods. Taken
  // from the Cool samples directory (lambda calculus program)
  cls = _parse_class0(utils.MultiString(function() {/***
class LambdaListNE inherits LambdaList {
  lam : Lambda;
  num : Int;
  env : VarList;
  rest : LambdaList;
  isNil() : Bool { false };
  headE() : VarList { env };
  headC() : Lambda { lam };
  headN() : Int { num };
  tail()  : LambdaList { rest };
  init(e : VarList, l : Lambda, n : Int, r : LambdaList) : LambdaListNE {
    {
      env <- e;
      lam <- l;
      num <- n;
      rest <- r;
      self;
    }
  };
};
***/}));
  assert.equal(cls.name, 'LambdaListNE');
  assert.equal(cls.parent, 'LambdaList');
  assert.equal(cls.features.length, 10);

  // Define a custom visitor to look at the features
  var ClsVisitor = function() {
    this.num_attrs = this.num_methods = this.num_formals = 0;
    this.decltypes = [];
  }

  ClsVisitor.prototype = Object.create(ast_visitor.NodeVisitor.prototype);
  ClsVisitor.constructor = ClsVisitor;

  ClsVisitor.prototype.visit_Attr = function(node) {
    this.num_attrs += 1;
    this.decltypes.push(node.type_decl);
  }

  ClsVisitor.prototype.visit_Method = function(node) {
    this.num_methods += 1;
    this.decltypes.push(node.return_type);
    this.visit_children(node);
  }

  ClsVisitor.prototype.visit_Formal = function(node) {
    this.num_formals += 1;
    this.decltypes.push(node.type_decl);
  }

  var cv = new ClsVisitor();
  cv.visit(cls);
  assert.equal(cv.num_formals, 4);
  assert.equal(cv.num_attrs, 4);
  assert.equal(cv.num_methods, 6);
  assert.deepEqual(cv.decltypes, [
      'Lambda', 'Int', 'VarList', 'LambdaList', 'Bool', 'VarList', 'Lambda',
      'Int', 'LambdaList', 'LambdaListNE', 'VarList', 'Lambda', 'Int',
      'LambdaList']);
}

var test_method = function() {
  var cls = _parse_class0('class C {foo() : Int {1}}');
  var meth = cls.features[0];
  assert.ok(meth instanceof ast.Method);
  _compare_ast_dump(meth, 'Method(name=foo, return_type=Int) IntConst(token=1)');

  cls = _parse_class0('class C {foo(to : Int) : FType {2}}');
  meth = cls.features[0];
  assert.equal(meth.formals.length, 1);
  _compare_ast_dump(meth, 'Method(name=foo, return_type=FType)' +
                          ' Formal(name=to, type_decl=Int) IntConst(token=2)');

  cls = _parse_class0('class C {foo(x : Int, y : Bool) : SELF_TYPE {' +
                      ' {1; 2}}}');
  meth = cls.features[0];
  assert.equal(meth.return_type, 'SELF_TYPE');
  assert.equal(meth.formals.length, 2);
  _compare_ast_dump(meth.formals[0], 'Formal(name=x, type_decl=Int)');
  _compare_ast_dump(meth.formals[1], 'Formal(name=y, type_decl=Bool)');
  _compare_ast_dump(meth.expr, 'Block() IntConst(token=1) IntConst(token=2)');
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

var test_expressions = function() {
  test_expr_basic_atoms();
  test_expr_blocks();
  test_expr_dispatch();
  test_expr_misc();
}

var test_expr_basic_atoms = function() {
  var e = parse_expr('foo');
  _compare_ast_dump(e, 'Obj(name=foo)');

  e = parse_expr('40');
  _compare_ast_dump(e, 'IntConst(token=40)');

  e = parse_expr('false');
  _compare_ast_dump(e, 'BoolConst(value=false)');

  e = parse_expr('true');
  _compare_ast_dump(e, 'BoolConst(value=true)');

  e = parse_expr('(a)');
  _compare_ast_dump(e, 'Obj(name=a)');

  e = parse_expr('"a string"');
  assert.ok(e instanceof ast.StringConst);
  assert.equal(e.str, '"a string"');

  //console.log(ast_visitor.dump_ast(e));
}

var test_expr_blocks = function() {
  var e = parse_expr('{1; 2; 3;}');
  _compare_ast_dump(e, 'Block() IntConst(token=1) IntConst(token=2) IntConst(token=3)');

  e = parse_expr('{foo;}');
  _compare_ast_dump(e, 'Block() Obj(name=foo)');
}

var test_expr_dispatch = function() {
  var e = parse_expr('foo(bar)');
  _compare_ast_dump(e, 'Dispatch(name=foo) NoExpr() Obj(name=bar)');

  e = parse_expr('joe.foo(bar)');
  _compare_ast_dump(e, 'Dispatch(name=foo) Obj(name=joe) Obj(name=bar)');
}

// Miscellaneous expression tests for bugs that come up, etc.
var test_expr_misc = function() {
  var e = parse_expr('out_string("((new Closure")');
  assert.ok(e instanceof ast.Dispatch);
  assert.equal(e.name, 'out_string');
  assert.equal(e.actual[0].str, '"((new Closure"');

  e = parse_expr('{out_string("((new Closure");}');
  assert.ok(e instanceof ast.Block);
  assert.equal(e.body.length, 1);
  assert.equal(e.body[0].name, 'out_string');

  e = parse_expr('new Foo');
  _compare_ast_dump(e, 'New(type_name=Foo)');
}

if (module.parent === null) {
  test();
}
