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
// The grammar was rewritten a bit to aid expression parsing.
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
//               |   atom [@ TYPE] . ID ( [expr [, expr]∗] )
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
// atom          ::= ID | ( expr )
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

  this._keyword_expr_dispatch = {
    'IF':     this._parse_if_expr,
    'WHILE':  this._parse_while_expr,
    'ISVOID': this._parse_isvoid_expr,
    'NEW':    this._parse_new_expr,
    'LET':    this._parse_let_expr,
    'CASE':   this._parse_case_expr
  };
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

// Parse an expression. This is a precedence-climbing parser, working in tandem
// with _parse_atom.
// min_prec: The minimal precedence upcoming binary operators should have to
// be incorporated into this expression. If a lower-precedence operator is
// encountered, this method will return the node it has built so far. The same
// occurs if an expression-ending token is encountered.
Parser.prototype._parse_expression = function(min_prec) {

}

Parser.prototype._parse_atom = function() {
  
}

Parser.prototype._parse_if_expr = function() {
  
}

Parser.prototype._parse_while_expr = function() {
  
}

Parser.prototype._parse_isvoid_expr = function() {
  
}

Parser.prototype._parse_new_expr = function() {
  
}

Parser.prototype._parse_let_expr = function() {
  
}

Parser.prototype._parse_case_expr = function() {
  
}
