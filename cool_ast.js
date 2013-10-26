//------------------------------------------------------------------------------
// AST for COOL.
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
var _check_string = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object String]') {
    throw new ASTError(who + ' expects ' + what + ' to be a string');
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

//
//-------------------- AST nodes --------------------
//

//
// Case is-a Node
// Constructor(Case, [Field(identifier, name), Field(identifier, type_decl), Field(expression, expr)])
//
var Case = exports.Case = function(name, type_decl, expr, loc) {
  _check_string(name);
  this.name = name;

  _check_string(type_decl);
  this.type_decl = type_decl;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Case expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Case.prototype = Object.create(Node.prototype);
Case.prototype.constructor = Case;

Object.defineProperty(Case.prototype, 'attributes', {
  get: function() {return ['name', 'type_decl'];}
});

//
// Class is-a Node
// Constructor(Class, [Field(identifier, name), Field(identifier, parent), Field(feature, features, seq=True), Field(identifier, filename)])
//
var Class = exports.Class = function(name, parent, features, filename, loc) {
  _check_string(name);
  this.name = name;

  _check_string(parent);
  this.parent = parent;

  _check_array(features);
  for (var i = 0; i < features.length; i++) {
    if (!(features[i] instanceof Feature)) {
      throw new ASTError('Class expects features to be an array of Feature');
    }
  }
  this.features = features;

  _check_string(filename);
  this.filename = filename;

  this.loc = loc;
}

Class.prototype = Object.create(Node.prototype);
Class.prototype.constructor = Class;

Object.defineProperty(Class.prototype, 'attributes', {
  get: function() {return ['name', 'parent', 'filename'];}
});

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
  _check_string(name);
  this.name = name;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Assign expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Assign.prototype = Object.create(Expression.prototype);
Assign.prototype.constructor = Assign;

Object.defineProperty(Assign.prototype, 'attributes', {
  get: function() {return ['name'];}
});

//
// StaticDispatch is-a Expression
// Constructor(StaticDispatch, [Field(expression, expr), Field(identifier, type_name), Field(identifier, name), Field(expression, actual)])
//
var StaticDispatch = exports.StaticDispatch = function(expr, type_name, name, actual, loc) {
  if (!(expr instanceof Expression)) {
    throw new ASTError('StaticDispatch expects expr to be a Expression');
  }
  this.expr = expr;

  _check_string(type_name);
  this.type_name = type_name;

  _check_string(name);
  this.name = name;

  if (!(actual instanceof Expression)) {
    throw new ASTError('StaticDispatch expects actual to be a Expression');
  }
  this.actual = actual;

  this.loc = loc;
}

StaticDispatch.prototype = Object.create(Expression.prototype);
StaticDispatch.prototype.constructor = StaticDispatch;

Object.defineProperty(StaticDispatch.prototype, 'attributes', {
  get: function() {return ['type_name', 'name'];}
});

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

Object.defineProperty(Cond.prototype, 'attributes', {
  get: function() {return [];}
});

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

Object.defineProperty(Loop.prototype, 'attributes', {
  get: function() {return [];}
});

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

Object.defineProperty(Typcase.prototype, 'attributes', {
  get: function() {return [];}
});

//
// Block is-a Expression
// Constructor(Block, [Field(expression, body)])
//
var Block = exports.Block = function(body, loc) {
  if (!(body instanceof Expression)) {
    throw new ASTError('Block expects body to be a Expression');
  }
  this.body = body;

  this.loc = loc;
}

Block.prototype = Object.create(Expression.prototype);
Block.prototype.constructor = Block;

Object.defineProperty(Block.prototype, 'attributes', {
  get: function() {return [];}
});

//
// Let is-a Expression
// Constructor(Let, [Field(identifier, id), Field(identifier, type_decl), Field(expression, init), Field(expression, body)])
//
var Let = exports.Let = function(id, type_decl, init, body, loc) {
  _check_string(id);
  this.id = id;

  _check_string(type_decl);
  this.type_decl = type_decl;

  if (!(init instanceof Expression)) {
    throw new ASTError('Let expects init to be a Expression');
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

Object.defineProperty(Let.prototype, 'attributes', {
  get: function() {return ['id', 'type_decl'];}
});

//
// BinaryOp is-a Expression
// Constructor(BinaryOp, [Field(identifier, op), Field(expression, left), Field(expression, right)])
//
var BinaryOp = exports.BinaryOp = function(op, left, right, loc) {
  _check_string(op);
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

Object.defineProperty(BinaryOp.prototype, 'attributes', {
  get: function() {return ['op'];}
});

//
// UnaryOp is-a Expression
// Constructor(UnaryOp, [Field(identifier, op), Field(expression, expr)])
//
var UnaryOp = exports.UnaryOp = function(op, expr, loc) {
  _check_string(op);
  this.op = op;

  if (!(expr instanceof Expression)) {
    throw new ASTError('UnaryOp expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

UnaryOp.prototype = Object.create(Expression.prototype);
UnaryOp.prototype.constructor = UnaryOp;

Object.defineProperty(UnaryOp.prototype, 'attributes', {
  get: function() {return ['op'];}
});

//
// IntConst is-a Expression
// Constructor(IntConst, [Field(identifier, token)])
//
var IntConst = exports.IntConst = function(token, loc) {
  _check_string(token);
  this.token = token;

  this.loc = loc;
}

IntConst.prototype = Object.create(Expression.prototype);
IntConst.prototype.constructor = IntConst;

Object.defineProperty(IntConst.prototype, 'attributes', {
  get: function() {return ['token'];}
});

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

Object.defineProperty(BoolConst.prototype, 'attributes', {
  get: function() {return ['value'];}
});

//
// StringConst is-a Expression
// Constructor(StringConst, [Field(identifier, token)])
//
var StringConst = exports.StringConst = function(token, loc) {
  _check_string(token);
  this.token = token;

  this.loc = loc;
}

StringConst.prototype = Object.create(Expression.prototype);
StringConst.prototype.constructor = StringConst;

Object.defineProperty(StringConst.prototype, 'attributes', {
  get: function() {return ['token'];}
});

//
// New is-a Expression
// Constructor(New, [Field(identifier, type_name)])
//
var New = exports.New = function(type_name, loc) {
  _check_string(type_name);
  this.type_name = type_name;

  this.loc = loc;
}

New.prototype = Object.create(Expression.prototype);
New.prototype.constructor = New;

Object.defineProperty(New.prototype, 'attributes', {
  get: function() {return ['type_name'];}
});

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

Object.defineProperty(IsVoid.prototype, 'attributes', {
  get: function() {return [];}
});

//
// NoExpr is-a Expression
// Constructor(NoExpr, [])
//
var NoExpr = exports.NoExpr = function(loc) {
  this.loc = loc;
}

NoExpr.prototype = Object.create(Expression.prototype);
NoExpr.prototype.constructor = NoExpr;

Object.defineProperty(NoExpr.prototype, 'attributes', {
  get: function() {return [];}
});

//
// Obj is-a Expression
// Constructor(Obj, [Field(identifier, name)])
//
var Obj = exports.Obj = function(name, loc) {
  _check_string(name);
  this.name = name;

  this.loc = loc;
}

Obj.prototype = Object.create(Expression.prototype);
Obj.prototype.constructor = Obj;

Object.defineProperty(Obj.prototype, 'attributes', {
  get: function() {return ['name'];}
});

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
  _check_string(name);
  this.name = name;

  _check_array(formals);
  for (var i = 0; i < formals.length; i++) {
    if (!(formals[i] instanceof Formal)) {
      throw new ASTError('Method expects formals to be an array of Formal');
    }
  }
  this.formals = formals;

  _check_string(return_type);
  this.return_type = return_type;

  if (!(expr instanceof Expression)) {
    throw new ASTError('Method expects expr to be a Expression');
  }
  this.expr = expr;

  this.loc = loc;
}

Method.prototype = Object.create(Feature.prototype);
Method.prototype.constructor = Method;

Object.defineProperty(Method.prototype, 'attributes', {
  get: function() {return ['name', 'return_type'];}
});

//
// Attr is-a Feature
// Constructor(Attr, [Field(identifier, name), Field(identifier, type_decl), Field(expression, init)])
//
var Attr = exports.Attr = function(name, type_decl, init, loc) {
  _check_string(name);
  this.name = name;

  _check_string(type_decl);
  this.type_decl = type_decl;

  if (!(init instanceof Expression)) {
    throw new ASTError('Attr expects init to be a Expression');
  }
  this.init = init;

  this.loc = loc;
}

Attr.prototype = Object.create(Feature.prototype);
Attr.prototype.constructor = Attr;

Object.defineProperty(Attr.prototype, 'attributes', {
  get: function() {return ['name', 'type_decl'];}
});

//
// Formal is-a Node
// Constructor(Formal, [Field(identifier, name), Field(identifier, type_decl)])
//
var Formal = exports.Formal = function(name, type_decl, loc) {
  _check_string(name);
  this.name = name;

  _check_string(type_decl);
  this.type_decl = type_decl;

  this.loc = loc;
}

Formal.prototype = Object.create(Node.prototype);
Formal.prototype.constructor = Formal;

Object.defineProperty(Formal.prototype, 'attributes', {
  get: function() {return ['name', 'type_decl'];}
});

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

Object.defineProperty(Program.prototype, 'attributes', {
  get: function() {return [];}
});

