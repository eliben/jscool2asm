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
    'TILDE':    this._parse_tilde_expr,
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

// Is this a token that could start a dispatch?
Parser._is_dispatch_token = function(tok) {
  return tok.name === 'AT' || tok.name === 'DOT' || tok.name === 'L_PAREN';
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
  if (next && next.name === 'ERROR') {
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
    this._error("expected '" + tokname + "', got '" +
                this.cur_token.name + "'");
  }
}

// Throw a parse error with the given message, specifying the lineno of the
// current token.
Parser.prototype._error = function(msg) {
  throw new ParseError("Line " + this.cur_token.lineno + ": " + msg);
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
// occurs if an expression-ending token is encountered. When this argument is
// not given or is falsy (including 0), -1 is used by default.
Parser.prototype._parse_expression = function(min_prec) {
  min_prec = min_prec || -1;
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
    var id_node = new cool_ast.Obj(tok.value, tok.lineno);
    this._advance();

    // This can be a dispatch.
    if (Parser._is_dispatch_token(this.cur_token)) {
      return this._parse_dispatch(id_node);
    }

    return id_node;
  } else if (tok.name === 'NUMBER') {
    this._advance();
    return new cool_ast.IntConst(parseInt(tok.value, 10), tok.lineno);
  } else if (tok.name === 'STRING') {
    this._advance();
    return new cool_ast.StringConst(tok.value, tok.lineno);
  } else if (tok.name === 'TRUE') {
    this._advance();
    return new cool_ast.BoolConst(true, tok.lineno);
  } else if (tok.name === 'FALSE') {
    this._advance();
    return new cool_ast.BoolConst(false, tok.lineno);
  }

  this._error("Unexpected token while parsing an atom: '" + tok.name + "'");
}

Parser.prototype._parse_expr_block = function() {
  this._match('L_BRACE');
  // Parse a sequence of SEMI-separated expressions.
  var exprs = [];
  while (this.cur_token.name !== 'R_BRACE') {
    exprs.push(this._parse_expression());
    if (this.cur_token.name === 'SEMI') {
      this._advance();
    }
  }
  this._advance();
  return new cool_ast.Block(exprs, exprs[0].loc);
}

Parser.prototype._parse_parenthesized_expr = function() {
  this._match('L_PAREN');
  var expr_node = this._parse_expression();
  this._match('R_PAREN');
  return expr_node;
}

Parser.prototype._parse_if_expr = function() {

}

Parser.prototype._parse_while_expr = function() {

}

Parser.prototype._parse_isvoid_expr = function() {

}

Parser.prototype._parse_not_expr = function() {
  var not_tok = this._match('NOT');
  // NOT has to pass forward its precedence so the parsing doesn't go too far.
  var expr = this._parse_expression(Parser._operator_precedence['NOT']);
  return new cool_ast.UnaryOp('NOT', expr, not_tok.lineno);
}

Parser.prototype._parse_tilde_expr = function() {
  // The tilde binds stronger than all binary operators, so it can simply
  // parse the atom following it.
  var tilde_lineno = this.cur_token.lineno;
  this._advance();
  var negated_atom = this._parse_atom();
  return new cool_ast.UnaryOp('~', negated_atom, tilde_lineno);
}

Parser.prototype._parse_new_expr = function() {

}

Parser.prototype._parse_let_expr = function() {

}

Parser.prototype._parse_case_expr = function() {

}

// Parse a dispatch. We know that the current token begins a dispatch, and atom
// is the already parsed 'expr' child node of the dispatch.
Parser.prototype._parse_dispatch = function(atom) {
  var tok = this.cur_token;
  var type_tok = null;
  var name_tok = null;
  if (tok.name === 'AT') {
    // Static dispatch. Expect a type to follow, and then a '.'
    this._advance();
    type_tok = this._match('TYPE');
    if (this.cur_token.name === 'DOT') {
      this._error("expected a '.' after @ dispatch, got '" +
                  this.cur_token.name + "'");
    }
  }
  if (tok.name === 'DOT') {
    this._advance();
    name_tok = this._match('IDENTIFIER');
  }

  // Now we have everything preceding the arguments of the dispatch. Parse the
  // arguments into a list of expression nodes.
  this._match('L_PAREN');
  var args = [];
  while (this.cur_token.name !== 'R_PAREN') {
    args.push(this._parse_expression());
    if (this.cur_token.name === 'COMMA') {
      this._advance();
    }
  }
  // Skip the R_PAREN. We're done parsing the dispatch. Now on to building the
  // AST node representing it...
  this._advance();

  // If we have a name_tok, that's the name of the dispatch. Otherwise atom is
  // the name (but in that case, atom itself must be an identifier). If we also
  // have a type_tok, it's a static dispatch.
  if (name_tok === null) {
    if (!(atom instanceof cool_ast.Obj)) {
      this._error("bad dispatch on " + atom.constructor.node_type);
    }
    return new cool_ast.Dispatch(new cool_ast.NoExpr(), atom.name,
                                 args, atom.loc);
  } else {
    if (type_tok === null) {
      return new cool_ast.Dispatch(atom, name_tok, args, atom.loc)
    } else {
      return new cool_ast.StaticDispatch(atom, name_tok, args, atom.loc);
    }
  }
}

