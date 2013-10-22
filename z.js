'use strict';

function ASTError(message) {
  this.message = message;
}

ASTError.prototype = new Error();
ASTError.prototype.constructor = ASTError;

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

var Node = function() {
}

var Expression = function() {
}

Expression.prototype = Object.create(Node.prototype);
Expression.prototype.constructor = Expression;

var Feature = function() {
}

Feature.prototype = Object.create(Node.prototype);
Feature.prototype.constructor = Feature;

// Method is a subclass of Feature
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

Method.prototype.children = function() {
  var nodelist = [];
  nodelist.push.apply(nodelist, this.formals);
  nodelist.push(this.expr);
  return nodelist;
}

