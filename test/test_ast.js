// Unit tests for the AST. Very basic smoke testing only.

'use strict';

var assert = require('assert');
var ast = require('../cool_ast');

var test = function() {
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
  assert.deepEqual(meth.attributes, ['name', 'return_type']);

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

if (module.parent === null) {
  test();
}
