'use strict';

// ASTError is the exception type used by this module to signal errors
function ASTError(message) {
  this.message = message;
}

ASTError.prototype = new Error();
ASTError.prototype.constructor = ASTError;

// Some helper code used throughout the module
var _check_string = function(v, who, what) {
  if (Object.prototype.toString.call(myvar) !== '[object String]') {
    throw ASTError(who + ' expects ' + what + ' to be a string');
  }
}

var _check_array = function(v, who, what) {
  if (Object.prototype.toString.call(myvar) !== '[object Array]') {
    throw ASTError(who + ' expects ' + what + ' to be a array');
  }
}

var _abstractmethod = function() {
  throw ASTError('Abstract method called');
}

// Node is an abstract interface implemented by all the AST nodes defined here.
// This interface is required by NodeVisitor (ZZZ?) to be able to walk any AST.
var Node = function() {
  throw ASTError('Node is an abstract class');
}

Node.prototype.children = _abstractmethod;

//
//-------------------- AST nodes --------------------
//

var Expression = function() {
  throw ASTError('Expression is an abstract class');
}

Expression.prototype = Object.create(Node.prototype);
Expression.prototype.constructor = Expression;

var Feature = function() {
  throw ASTError('Feature is an abstract class');
}

Feature.prototype = Object.create(Node.prototype);
Feature.prototype.constructor = Feature;

//
// Method is-a Feature.
// Its ASDL definition is:
// Method(identifier name, formal* formals, identifier return_type, expression expr)
//
var Method = function(name, formals, return_type, expr, loc) {
  _check_string(name);
  this.name = name;

  _check_array(formals);
  for (var i = 0; i < formals.length; i++) {
    if (!(formals[i] instanceof Formal)) {
      throw ASTError('Method expects formals to be an array of Formal');
    }
  }
  this.formals = formals;

  _check_string(return_type);
  this.return_type = return_type;

  if (!(expr instanceof Expression)) {
    throw ASTError('Method expects expr to be a Expression');
  }
  this.expr = expr;
  this.loc = loc;
}

Method.prototype = Object.create(Feature.prototype);
Method.prototype.constructor = Method;

Object.defineProperty(Method.prototype, 'attributes', {
  get: function() {return ['name', 'return_type'];}
});

Method.prototype.children = function() {
  var nodelist = [];
  nodelist.push.apply(nodelist, this.formals);
  nodelist.push(this.expr);
  return nodelist;
}

