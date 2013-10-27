//------------------------------------------------------------------------------
// Parser for Cool.
//
// Produces an AST from Cool source code.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------
'use strict';

// EBNF for the Cool grammar.
// Keywords and tokens are in uppercase. Operators stand for themselves. [ and ]
// are used for "optional", followed by * for "zero or more", followed by + for
// "one or more".
//
// program       ::= [class ;]+
//
// class         ::= CLASS TYPE [INHERITS TYPE] { [feature ;]∗ }
//
// feature       ::= ID ( [formal [, formal]∗] ) : TYPE { expr }
//               |   ID : TYPE [ <- expr ]
//
// formal        ::= ID : TYPE
//
// expr          ::= ID <- expr
//               |   expr [@ TYPE] . ID ( [expr [, expr]∗] )
//               |   ID ( [expr [, expr]*] )
//               |   IF expr THEN expr ELSE expr FI
//               |   WHILE expr LOOP expr POOL
//               |   { [expr ; ]+ }
//               |   LET ID : TYPE [<- expr] [, ID : TYPE [ <- expr]]* IN expr
//               |   CASE expr OF [ID : TYPE => expr ;]+ ESAC
//               |   NEW TYPE
//               |   ISVOID expr
//               |   expr + expr | expr − expr | expr ∗ expr | expr / expr
//               |   expr < expr | expr <= expr | expr = expr
//               |   ~ expr | NOT expr
//               |   ( expr )
//               |   ID | NUMBER | STRING | TRUE | FALSE
//
// Operator precedence, from highest to lowest:
//   .  @  ~  isvoid  *  /  +  -  <=  <  =  not  <-

var lexer = require('./lexer');
var cool_ast = require('./cool_ast');


// ParseError is the exception type used by this module to signal errors
var ParseError = exports.ParseError = function(message) {
  this.message = message;
}

ParseError.prototype = Object.create(Error.prototype);
ParseError.prototype.constructor = ParseError;


// Parser constructor.
var Parser = exports.Parser = function() {
  this.lexer = null;
  this.cur_token = null;
}

// Parses Cool source code contained in buf and returns the full AST (Program
// node). In case of an error, throws a ParseError.
Parser.prototype.parse = function(buf) {
  this.lexer = new lexer.Lexer();
  this.lexer.input(buf);
  this._advance();
}

// Return the current token and read the next one into this.cur_token
Parser.prototype._advance = function() {
  var cur = this.cur_token;
  var next = this.lexer.token();
  if (next.name === 'ERROR') {
    throw new ParseError(this.lexer.errors[this.lexer.errors.length - 1]);
  }
  this.cur_token = next;
  return cur;
}

Parser.prototype._parse_program = function() {
  // Class nodes will be collected here
  var classes = [];
  
}
