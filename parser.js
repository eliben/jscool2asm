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

  // Dispatch table for handling expressions starting with a known token. Note
  // that the functions in this table are unbound, so they have to be called
  // with .call/.apply and provided 'this'.
  this._token_expr_dispatch = {
    'L_BRACE':  this._parse_expr_block,
    'L_PAREN':  this._parse_parenthesized_expr,
    'IF':       this._parse_if_expr,
    'WHILE':    this._parse_while_expr,
    'ISVOID':   this._parse_isvoid_expr,
    'NOT':      this._parse_not_expr,
    'NEW':      this._parse_new_expr,
    'LET':      this._parse_let_expr,
    'CASE':     this._parse_case_expr
  };
}

Parser._operator_precedence = {
  'DOT':          200,
  'AT':           190,
  'TILDE':        180,
  'ISVOID':       170,
  'MULTIPLY':     160,
  'DIVIDE':       150,
  'PLUS':         140,
  'MINUS':        130,
  'LEQ':          120,
  'LE':           110,
  'EQ':           100,
  'NOT':          90,
  'ASSIGN_ARROW': 80
}

// Parses Cool source code contained in buf and returns the full AST (Program
// node). In case of an error, throws a ParseError.
Parser.prototype.parse = function(buf) {
  this.lexer = new lexer.Lexer();
  this.lexer.input(buf);
  this._advance();

  return this._parse_program();
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

// Verify that the current token is tokname, throw error otherwise.
// If all is good, return the current token and read the next one into
// this.cur_token
Parser.prototype._match = function(tokname) {
  if (this.cur_token.name === tokname) {
    return this._advance();
  } else {
    throw new ParseError("Line " + this.cur_token.lineno + ": expected '" +
                         tokname + "', got '" + this.cur_token.name + "'");
  }
}

Parser.prototype._parse_program = function() {
  // Class nodes will be collected here
  var classes = [];

  // TODO: hah
  return this._parse_expression(-1);
}

// Parse an expression. This is a precedence-climbing parser, working in tandem
// with _parse_atom.
// min_prec: The minimal precedence upcoming binary operators should have to
// be incorporated into this expression. If a lower-precedence operator is
// encountered, this method will return the node it has built so far. The same
// occurs if an expression-ending token is encountered.
Parser.prototype._parse_expression = function(min_prec) {
  // Parse until the next binary operator
  var atom_node = this._parse_atom();

  // TODO: zz
  return atom_node;
}

// An "atom" is any part of an expression between binary operators. So it can
// be a paren-enclosed expression, a unary operator followed by an expression or
// keyword-starting expressions like 'if...fi', etc.
Parser.prototype._parse_atom = function() {
  var tok = this.cur_token;
  var token_expr_handler = this._token_expr_dispatch[tok.name];
  if (token_expr_handler !== undefined) {
    return token_expr_handler.call(this)
  }
  // It's not starting with one of the known tokens. So the next token must be
  // a valid ID or constant.
  if (tok.name === 'IDENTIFIER') {
  } else if (tok.name === 'NUMBER') {
    return new cool_ast.IntConst(parseInt(tok.value, 10), tok.lineno);
  } else if (tok.name === 'STRING') {
    return new cool_ast.StringConst(tok.value, tok.lineno);
  } else if (tok.name === 'TRUE') {
    return new cool_ast.BoolConst(true, tok.lineno);
  } else if (tok.name === 'FALSE') {
    return new cool_ast.BoolConst(false, tok.lineno);
  }
  return null;
}

Parser.prototype._parse_expr_block = function() {

}

Parser.prototype._parse_parenthesized_expr = function() {

}

Parser.prototype._parse_if_expr = function() {

}

Parser.prototype._parse_while_expr = function() {

}

Parser.prototype._parse_isvoid_expr = function() {

}

Parser.prototype._parse_not_expr = function() {

}

Parser.prototype._parse_new_expr = function() {

}

Parser.prototype._parse_let_expr = function() {

}

Parser.prototype._parse_case_expr = function() {

}
