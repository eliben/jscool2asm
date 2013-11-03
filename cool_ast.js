//------------------------------------------------------------------------------
// AST for Cool.
// NOTE: this code is auto-generated from the ASDL definition of the AST. Do
//       not edit it directly.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------

'use strict';

// ASTError is the exception type used by this module to signal errors
var ASTError = exports.ASTError = function(message) {
  this.message = message;
}

ASTError.prototype = new Error();
ASTError.prototype.constructor = ASTError;

// Some helper code used throughout the module
var _check_identifier = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object String]') {
    throw new ASTError(who + ' expects ' + what + ' to be an identifier');
  }
}

var _check_string = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object String]' ||
      v[0] !== "\"" || v[v.length - 1] !== "\"") {
    throw new ASTError(who + ' expects ' + what + ' to be a string');
  }
}

var _check_number = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Number]') {
    throw new ASTError(who + ' expects ' + what + ' to be a number');
  }
}

var _check_boolean = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Boolean]') {
    throw new ASTError(who + ' expects ' + what + ' to be a boolean');
  }
}

var _check_array = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Array]') {
    throw new ASTError(who + ' expects ' + what + ' to be a array');
  }
}

var _abstractmethod = function() {
  throw new ASTError('Abstract method called');
}

// Node is an abstract interface implemented by all the AST nodes defined here.
// This interface is required by NodeVisitor (ZZZ?) to be able to walk any AST.
var Node = exports.Node = function() {
  throw new ASTError('Node is an abstract class');
}

Node.prototype.children = _abstractmethod;
Node.attributes = [];
Node.node_type = 'Node';


//
//-------------------- AST nodes --------------------
//

//
// Case is-a Node
// Constructor(Case, [Field(identifier, name), Field(identifier, type_decl), Field(expression, expr)])
//
var Case = exports.Case = function(name, type_decl, expr, loc) {
  _check_identifier(name);
  this.name = name;

  _check_identifier(type_decl);
  this.type_decl = type_decl;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Case expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Case.prototype = Object.create(Node.prototype);
Case.prototype.constructor = Case;

Object.defineProperties(Case, {
  'attributes': {get: function() {return ['name', 'type_decl'];}},
  'node_type': {get: function() {return 'Case';}}
});

Case.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  return children;
}

//
// Class is-a Node
// Constructor(Class, [Field(identifier, name), Field(identifier, parent), Field(feature, features, seq=True), Field(identifier, filename)])
//
var Class = exports.Class = function(name, parent, features, filename, loc) {
  _check_identifier(name);
  this.name = name;

  _check_identifier(parent);
  this.parent = parent;

  _check_array(features);
  for (var i = 0; i < features.length; i++) {
    if (!(features[i] instanceof Feature)) {
      throw new ASTError('Class expects features to be an array of Feature');
    }
  }
  this.features = features;

  _check_identifier(filename);
  this.filename = filename;

  this.loc = loc;
}

Class.prototype = Object.create(Node.prototype);
Class.prototype.constructor = Class;

Object.defineProperties(Class, {
  'attributes': {get: function() {return ['name', 'parent', 'filename'];}},
  'node_type': {get: function() {return 'Class';}}
});

Class.prototype.children = function () {
  var children = [];
  for (var i = 0; i < this.features.length; i++) {
    children.push({'name': 'features[' + i.toString() + ']', 'node': this.features[i]});
  }
  return children;
}

//
// Expression is an abstract Node interface
//
var Expression = exports.Expression = function() {
  throw new ASTError('Expression is an abstract class');
}

Expression.prototype = Object.create(Node.prototype);
Expression.prototype.constructor = Expression

//
// Assign is-a Expression
// Constructor(Assign, [Field(identifier, name), Field(expression, expr)])
//
var Assign = exports.Assign = function(name, expr, loc) {
  _check_identifier(name);
  this.name = name;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Assign expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Assign.prototype = Object.create(Expression.prototype);
Assign.prototype.constructor = Assign;

Object.defineProperties(Assign, {
  'attributes': {get: function() {return ['name'];}},
  'node_type': {get: function() {return 'Assign';}}
});

Assign.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  return children;
}

//
// StaticDispatch is-a Expression
// Constructor(StaticDispatch, [Field(expression, expr), Field(identifier, type_name), Field(identifier, name), Field(expression, actual, seq=True)])
//
var StaticDispatch = exports.StaticDispatch = function(expr, type_name, name, actual, loc) {
  if (!(expr instanceof Expression)) {
    throw new ASTError('StaticDispatch expects expr to be a Expression');
  }
  this.expr = expr;

  _check_identifier(type_name);
  this.type_name = type_name;

  _check_identifier(name);
  this.name = name;

  _check_array(actual);
  for (var i = 0; i < actual.length; i++) {
    if (!(actual[i] instanceof Expression)) {
      throw new ASTError('StaticDispatch expects actual to be an array of Expression');
    }
  }
  this.actual = actual;

  this.loc = loc;
}

StaticDispatch.prototype = Object.create(Expression.prototype);
StaticDispatch.prototype.constructor = StaticDispatch;

Object.defineProperties(StaticDispatch, {
  'attributes': {get: function() {return ['type_name', 'name'];}},
  'node_type': {get: function() {return 'StaticDispatch';}}
});

StaticDispatch.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  for (var i = 0; i < this.actual.length; i++) {
    children.push({'name': 'actual[' + i.toString() + ']', 'node': this.actual[i]});
  }
  return children;
}

//
// Dispatch is-a Expression
// Constructor(Dispatch, [Field(expression, expr), Field(identifier, name), Field(expression, actual, seq=True)])
//
var Dispatch = exports.Dispatch = function(expr, name, actual, loc) {
  if (!(expr instanceof Expression)) {
    throw new ASTError('Dispatch expects expr to be a Expression');
  }
  this.expr = expr;

  _check_identifier(name);
  this.name = name;

  _check_array(actual);
  for (var i = 0; i < actual.length; i++) {
    if (!(actual[i] instanceof Expression)) {
      throw new ASTError('Dispatch expects actual to be an array of Expression');
    }
  }
  this.actual = actual;

  this.loc = loc;
}

Dispatch.prototype = Object.create(Expression.prototype);
Dispatch.prototype.constructor = Dispatch;

Object.defineProperties(Dispatch, {
  'attributes': {get: function() {return ['name'];}},
  'node_type': {get: function() {return 'Dispatch';}}
});

Dispatch.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  for (var i = 0; i < this.actual.length; i++) {
    children.push({'name': 'actual[' + i.toString() + ']', 'node': this.actual[i]});
  }
  return children;
}

//
// Cond is-a Expression
// Constructor(Cond, [Field(expression, pred), Field(expression, then_exp), Field(expression, else_exp)])
//
var Cond = exports.Cond = function(pred, then_exp, else_exp, loc) {
  if (!(pred instanceof Expression)) {
    throw new ASTError('Cond expects pred to be a Expression');
  }
  this.pred = pred;

  if (!(then_exp instanceof Expression)) {
    throw new ASTError('Cond expects then_exp to be a Expression');
  }
  this.then_exp = then_exp;

  if (!(else_exp instanceof Expression)) {
    throw new ASTError('Cond expects else_exp to be a Expression');
  }
  this.else_exp = else_exp;

  this.loc = loc;
}

Cond.prototype = Object.create(Expression.prototype);
Cond.prototype.constructor = Cond;

Object.defineProperties(Cond, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Cond';}}
});

Cond.prototype.children = function () {
  var children = [];
  children.push({'name': 'pred', 'node': this.pred});
  children.push({'name': 'then_exp', 'node': this.then_exp});
  children.push({'name': 'else_exp', 'node': this.else_exp});
  return children;
}

//
// Loop is-a Expression
// Constructor(Loop, [Field(expression, pred), Field(expression, body)])
//
var Loop = exports.Loop = function(pred, body, loc) {
  if (!(pred instanceof Expression)) {
    throw new ASTError('Loop expects pred to be a Expression');
  }
  this.pred = pred;

  if (!(body instanceof Expression)) {
    throw new ASTError('Loop expects body to be a Expression');
  }
  this.body = body;

  this.loc = loc;
}

Loop.prototype = Object.create(Expression.prototype);
Loop.prototype.constructor = Loop;

Object.defineProperties(Loop, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Loop';}}
});

Loop.prototype.children = function () {
  var children = [];
  children.push({'name': 'pred', 'node': this.pred});
  children.push({'name': 'body', 'node': this.body});
  return children;
}

//
// Typcase is-a Expression
// Constructor(Typcase, [Field(expression, expr), Field(case, cases, seq=True)])
//
var Typcase = exports.Typcase = function(expr, cases, loc) {
  if (!(expr instanceof Expression)) {
    throw new ASTError('Typcase expects expr to be a Expression');
  }
  this.expr = expr;

  _check_array(cases);
  for (var i = 0; i < cases.length; i++) {
    if (!(cases[i] instanceof Case)) {
      throw new ASTError('Typcase expects cases to be an array of Case');
    }
  }
  this.cases = cases;

  this.loc = loc;
}

Typcase.prototype = Object.create(Expression.prototype);
Typcase.prototype.constructor = Typcase;

Object.defineProperties(Typcase, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Typcase';}}
});

Typcase.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  for (var i = 0; i < this.cases.length; i++) {
    children.push({'name': 'cases[' + i.toString() + ']', 'node': this.cases[i]});
  }
  return children;
}

//
// Block is-a Expression
// Constructor(Block, [Field(expression, body, seq=True)])
//
var Block = exports.Block = function(body, loc) {
  _check_array(body);
  for (var i = 0; i < body.length; i++) {
    if (!(body[i] instanceof Expression)) {
      throw new ASTError('Block expects body to be an array of Expression');
    }
  }
  this.body = body;

  this.loc = loc;
}

Block.prototype = Object.create(Expression.prototype);
Block.prototype.constructor = Block;

Object.defineProperties(Block, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Block';}}
});

Block.prototype.children = function () {
  var children = [];
  for (var i = 0; i < this.body.length; i++) {
    children.push({'name': 'body[' + i.toString() + ']', 'node': this.body[i]});
  }
  return children;
}

//
// Let is-a Expression
// Constructor(Let, [Field(letinit, init, seq=True), Field(expression, body)])
//
var Let = exports.Let = function(init, body, loc) {
  _check_array(init);
  for (var i = 0; i < init.length; i++) {
    if (!(init[i] instanceof Letinit)) {
      throw new ASTError('Let expects init to be an array of Letinit');
    }
  }
  this.init = init;

  if (!(body instanceof Expression)) {
    throw new ASTError('Let expects body to be a Expression');
  }
  this.body = body;

  this.loc = loc;
}

Let.prototype = Object.create(Expression.prototype);
Let.prototype.constructor = Let;

Object.defineProperties(Let, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Let';}}
});

Let.prototype.children = function () {
  var children = [];
  for (var i = 0; i < this.init.length; i++) {
    children.push({'name': 'init[' + i.toString() + ']', 'node': this.init[i]});
  }
  children.push({'name': 'body', 'node': this.body});
  return children;
}

//
// BinaryOp is-a Expression
// Constructor(BinaryOp, [Field(identifier, op), Field(expression, left), Field(expression, right)])
//
var BinaryOp = exports.BinaryOp = function(op, left, right, loc) {
  _check_identifier(op);
  this.op = op;

  if (!(left instanceof Expression)) {
    throw new ASTError('BinaryOp expects left to be a Expression');
  }
  this.left = left;

  if (!(right instanceof Expression)) {
    throw new ASTError('BinaryOp expects right to be a Expression');
  }
  this.right = right;

  this.loc = loc;
}

BinaryOp.prototype = Object.create(Expression.prototype);
BinaryOp.prototype.constructor = BinaryOp;

Object.defineProperties(BinaryOp, {
  'attributes': {get: function() {return ['op'];}},
  'node_type': {get: function() {return 'BinaryOp';}}
});

BinaryOp.prototype.children = function () {
  var children = [];
  children.push({'name': 'left', 'node': this.left});
  children.push({'name': 'right', 'node': this.right});
  return children;
}

//
// UnaryOp is-a Expression
// Constructor(UnaryOp, [Field(identifier, op), Field(expression, expr)])
//
var UnaryOp = exports.UnaryOp = function(op, expr, loc) {
  _check_identifier(op);
  this.op = op;

  if (!(expr instanceof Expression)) {
    throw new ASTError('UnaryOp expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

UnaryOp.prototype = Object.create(Expression.prototype);
UnaryOp.prototype.constructor = UnaryOp;

Object.defineProperties(UnaryOp, {
  'attributes': {get: function() {return ['op'];}},
  'node_type': {get: function() {return 'UnaryOp';}}
});

UnaryOp.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  return children;
}

//
// IntConst is-a Expression
// Constructor(IntConst, [Field(int, token)])
//
var IntConst = exports.IntConst = function(token, loc) {
  _check_number(token);
  this.token = token;

  this.loc = loc;
}

IntConst.prototype = Object.create(Expression.prototype);
IntConst.prototype.constructor = IntConst;

Object.defineProperties(IntConst, {
  'attributes': {get: function() {return ['token'];}},
  'node_type': {get: function() {return 'IntConst';}}
});

IntConst.prototype.children = function () {
  var children = [];
  return children;
}

//
// BoolConst is-a Expression
// Constructor(BoolConst, [Field(boolean, value)])
//
var BoolConst = exports.BoolConst = function(value, loc) {
  _check_boolean(value);
  this.value = value;

  this.loc = loc;
}

BoolConst.prototype = Object.create(Expression.prototype);
BoolConst.prototype.constructor = BoolConst;

Object.defineProperties(BoolConst, {
  'attributes': {get: function() {return ['value'];}},
  'node_type': {get: function() {return 'BoolConst';}}
});

BoolConst.prototype.children = function () {
  var children = [];
  return children;
}

//
// StringConst is-a Expression
// Constructor(StringConst, [Field(string, str)])
//
var StringConst = exports.StringConst = function(str, loc) {
  _check_string(str);
  this.str = str;

  this.loc = loc;
}

StringConst.prototype = Object.create(Expression.prototype);
StringConst.prototype.constructor = StringConst;

Object.defineProperties(StringConst, {
  'attributes': {get: function() {return ['str'];}},
  'node_type': {get: function() {return 'StringConst';}}
});

StringConst.prototype.children = function () {
  var children = [];
  return children;
}

//
// New is-a Expression
// Constructor(New, [Field(identifier, type_name)])
//
var New = exports.New = function(type_name, loc) {
  _check_identifier(type_name);
  this.type_name = type_name;

  this.loc = loc;
}

New.prototype = Object.create(Expression.prototype);
New.prototype.constructor = New;

Object.defineProperties(New, {
  'attributes': {get: function() {return ['type_name'];}},
  'node_type': {get: function() {return 'New';}}
});

New.prototype.children = function () {
  var children = [];
  return children;
}

//
// IsVoid is-a Expression
// Constructor(IsVoid, [Field(expression, expr)])
//
var IsVoid = exports.IsVoid = function(expr, loc) {
  if (!(expr instanceof Expression)) {
    throw new ASTError('IsVoid expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

IsVoid.prototype = Object.create(Expression.prototype);
IsVoid.prototype.constructor = IsVoid;

Object.defineProperties(IsVoid, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'IsVoid';}}
});

IsVoid.prototype.children = function () {
  var children = [];
  children.push({'name': 'expr', 'node': this.expr});
  return children;
}

//
// NoExpr is-a Expression
// Constructor(NoExpr, [])
//
var NoExpr = exports.NoExpr = function(loc) {
  this.loc = loc;
}

NoExpr.prototype = Object.create(Expression.prototype);
NoExpr.prototype.constructor = NoExpr;

Object.defineProperties(NoExpr, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'NoExpr';}}
});

NoExpr.prototype.children = function () {
  var children = [];
  return children;
}

//
// Obj is-a Expression
// Constructor(Obj, [Field(identifier, name)])
//
var Obj = exports.Obj = function(name, loc) {
  _check_identifier(name);
  this.name = name;

  this.loc = loc;
}

Obj.prototype = Object.create(Expression.prototype);
Obj.prototype.constructor = Obj;

Object.defineProperties(Obj, {
  'attributes': {get: function() {return ['name'];}},
  'node_type': {get: function() {return 'Obj';}}
});

Obj.prototype.children = function () {
  var children = [];
  return children;
}

//
// Feature is an abstract Node interface
//
var Feature = exports.Feature = function() {
  throw new ASTError('Feature is an abstract class');
}

Feature.prototype = Object.create(Node.prototype);
Feature.prototype.constructor = Feature

//
// Method is-a Feature
// Constructor(Method, [Field(identifier, name), Field(formal, formals, seq=True), Field(identifier, return_type), Field(expression, expr)])
//
var Method = exports.Method = function(name, formals, return_type, expr, loc) {
  _check_identifier(name);
  this.name = name;

  _check_array(formals);
  for (var i = 0; i < formals.length; i++) {
    if (!(formals[i] instanceof Formal)) {
      throw new ASTError('Method expects formals to be an array of Formal');
    }
  }
  this.formals = formals;

  _check_identifier(return_type);
  this.return_type = return_type;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Method expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Method.prototype = Object.create(Feature.prototype);
Method.prototype.constructor = Method;

Object.defineProperties(Method, {
  'attributes': {get: function() {return ['name', 'return_type'];}},
  'node_type': {get: function() {return 'Method';}}
});

Method.prototype.children = function () {
  var children = [];
  for (var i = 0; i < this.formals.length; i++) {
    children.push({'name': 'formals[' + i.toString() + ']', 'node': this.formals[i]});
  }
  children.push({'name': 'expr', 'node': this.expr});
  return children;
}

//
// Attr is-a Feature
// Constructor(Attr, [Field(identifier, name), Field(identifier, type_decl), Field(expression, init)])
//
var Attr = exports.Attr = function(name, type_decl, init, loc) {
  _check_identifier(name);
  this.name = name;

  _check_identifier(type_decl);
  this.type_decl = type_decl;

  if (!(init instanceof Expression)) {
    throw new ASTError('Attr expects init to be a Expression');
  }
  this.init = init;

  this.loc = loc;
}

Attr.prototype = Object.create(Feature.prototype);
Attr.prototype.constructor = Attr;

Object.defineProperties(Attr, {
  'attributes': {get: function() {return ['name', 'type_decl'];}},
  'node_type': {get: function() {return 'Attr';}}
});

Attr.prototype.children = function () {
  var children = [];
  children.push({'name': 'init', 'node': this.init});
  return children;
}

//
// Formal is-a Node
// Constructor(Formal, [Field(identifier, name), Field(identifier, type_decl)])
//
var Formal = exports.Formal = function(name, type_decl, loc) {
  _check_identifier(name);
  this.name = name;

  _check_identifier(type_decl);
  this.type_decl = type_decl;

  this.loc = loc;
}

Formal.prototype = Object.create(Node.prototype);
Formal.prototype.constructor = Formal;

Object.defineProperties(Formal, {
  'attributes': {get: function() {return ['name', 'type_decl'];}},
  'node_type': {get: function() {return 'Formal';}}
});

Formal.prototype.children = function () {
  var children = [];
  return children;
}

//
// Letinit is-a Node
// Constructor(Letinit, [Field(identifier, id), Field(identifier, type_decl), Field(expression, init)])
//
var Letinit = exports.Letinit = function(id, type_decl, init, loc) {
  _check_identifier(id);
  this.id = id;

  _check_identifier(type_decl);
  this.type_decl = type_decl;

  if (!(init instanceof Expression)) {
    throw new ASTError('Letinit expects init to be a Expression');
  }
  this.init = init;

  this.loc = loc;
}

Letinit.prototype = Object.create(Node.prototype);
Letinit.prototype.constructor = Letinit;

Object.defineProperties(Letinit, {
  'attributes': {get: function() {return ['id', 'type_decl'];}},
  'node_type': {get: function() {return 'Letinit';}}
});

Letinit.prototype.children = function () {
  var children = [];
  children.push({'name': 'init', 'node': this.init});
  return children;
}

//
// Program is-a Node
// Constructor(Program, [Field(class, classes, seq=True)])
//
var Program = exports.Program = function(classes, loc) {
  _check_array(classes);
  for (var i = 0; i < classes.length; i++) {
    if (!(classes[i] instanceof Class)) {
      throw new ASTError('Program expects classes to be an array of Class');
    }
  }
  this.classes = classes;

  this.loc = loc;
}

Program.prototype = Object.create(Node.prototype);
Program.prototype.constructor = Program;

Object.defineProperties(Program, {
  'attributes': {get: function() {return [];}},
  'node_type': {get: function() {return 'Program';}}
});

Program.prototype.children = function () {
  var children = [];
  for (var i = 0; i < this.classes.length; i++) {
    children.push({'name': 'classes[' + i.toString() + ']', 'node': this.classes[i]});
  }
  return children;
}

