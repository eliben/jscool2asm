// Unit tests for the AST. Very basic smoke testing only.

'use strict';

var assert = require('assert');
var ast = require('../cool_ast');
var ast_visitor = require('../ast_visitor');


var test = function() {
  basic_tests();
  error_tests();
  visitor_tests();
}

var error_tests = function() {
  var obj = new ast.Obj('foo', 100);
  var form = new ast.Formal('oshu', 'java');
  // Failure tests - trigger some errors ASTs constructors can catch.
  assert.throws(
    function() {
      // number instead of string
      var obj2 = new ast.Obj(42, 42);
    },
    ast.ASTError);

  assert.throws(
    function() {
      // form instead of [form]
      var meth2 = new ast.Method('fibo', form, 'int', obj);
    },
    ast.ASTError);

  assert.throws(
    function() {
      // [obj] instead of [form]
      var meth2 = new ast.Method('fibo', [obj], 'int', obj);
    },
    ast.ASTError);

  assert.throws(
    function() {
      // form instead of obj
      var meth2 = new ast.Method('fibo', [form], 'int', form);
    },
    ast.ASTError);
}

var basic_tests = function() {
  // Success tests - objects created successfully, etc.
  var obj = new ast.Obj('foo', 100);
  assert(obj instanceof ast.Expression);
  assert(obj instanceof ast.Node);
  assert.equal(obj.name, 'foo');
  assert.equal(obj.loc, 100);

  var form = new ast.Formal('oshu', 'java');
  assert(form instanceof ast.Formal);
  assert(form instanceof ast.Node);
  assert.equal(form.name, 'oshu');
  assert.equal(form.type_decl, 'java');

  var meth = new ast.Method('fibo', [form], 'int', obj);
  assert(meth instanceof ast.Feature);
  assert(meth instanceof ast.Node);
  assert.deepEqual(meth.constructor.attributes, ['name', 'return_type']);
  assert.equal(meth.constructor.node_type, 'Method');
  var children = meth.children();
  assert.equal(children[0].name, 'formals[0]');
  assert.equal(children[0].node, form);
}

// Used for testing NodeVisitor
var CustomVisitor = function() {
  this.stuff = [];
}

CustomVisitor.prototype = Object.create(ast_visitor.NodeVisitor.prototype);
CustomVisitor.constructor = CustomVisitor;

CustomVisitor.prototype.visit_Attr = function(node) {
  this.stuff.push(['attr', node.name]);
  this.visit_children(node);
}

CustomVisitor.prototype.visit_New = function(node) {
  this.stuff.push(['new', node.type_name]);
}

var visitor_tests = function() {
  var attr1 = new ast.Attr('attr1', 'f', new ast.New('int'));
  var attr2 = new ast.Attr('attr2', 'ff', new ast.NoExpr());
  var cls = new ast.Class('c', 'p', [attr1, attr2], 'f');

  var cv = new CustomVisitor();
  cv.visit(cls);
  assert.deepEqual(cv.stuff,
      [['attr', 'attr1'], ['new', 'int'], ['attr', 'attr2']]);
}

if (module.parent === null) {
  test();
}
