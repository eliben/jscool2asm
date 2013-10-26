// Unit tests for the AST. Very basic smoke testing only.

'use strict';

var assert = require('assert');
var ast = require('../cool_ast');

var test = function() {
  var obj = new ast.Obj('foo', 100);
}

if (module.parent === null) {
  test();
}
