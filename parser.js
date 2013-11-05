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

//---- Parser: public interface

// Parses Cool source code contained in buf and returns the full AST (Program
// node). Expects to find correct top-level code (a Program, which is a sequence
// of Classes). In case of an error, throws a ParseError.
Parser.prototype.parse = function(buf) {
  this._reset(buf);
  return this._parse_program();
}

// Parser a Cool expression contained in buf and returns the AST representing
// it. This is similar to the parse method, but only handles a single
// expression. This method exists for testing & convenience.
Parser.prototype.parse_expression = function(buf) {
  this._reset(buf);
  return this._parse_expression();
}

//---- Private implementation details

// Information about operators.
Parser._operator_info = {
  'DOT':          {kind: 'binary', prec: 200, assoc: 'left'},
  'AT':           {kind: 'binary', prec: 190, assoc: 'left'},
  'TILDE':        {kind: 'unary', prec: 180, assoc: 'left'},
  'ISVOID':       {kind: 'unary', prec: 170, assoc: 'left'},
  'MULTIPLY':     {kind: 'binary', prec: 160, assoc: 'left'},
  'DIVIDE':       {kind: 'binary', prec: 150, assoc: 'left'},
  'PLUS':         {kind: 'binary', prec: 140, assoc: 'left'},
  'MINUS':        {kind: 'binary', prec: 130, assoc: 'left'},
  'LEQ':          {kind: 'binary', prec: 120, assoc: 'left'},
  'LE':           {kind: 'binary', prec: 110, assoc: 'left'},
  'EQ':           {kind: 'binary', prec: 100, assoc: 'left'},
  'NOT':          {kind: 'unary', prec: 90, assoc: 'left'},
  'ASSIGN_ARROW': {kind: 'binary', prec: 80, assoc: 'right'}
}

Parser.prototype._reset = function(buf) {
  this.lexer = new lexer.Lexer();
  this.lexer.input(buf);
  this._advance();
}

// Is this a token that could start a dispatch?
Parser._is_dispatch_token = function(tok) {
  return tok.name === 'AT' || tok.name === 'DOT' || tok.name === 'L_PAREN';
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

// Skip the current token if it mathes tokname. Otherwise do nothing.
Parser.prototype._skip_token = function(tokname) {
  if (this.cur_token && this.cur_token.name === tokname) {
    this._advance();
  }
}

// Throw a parse error with the given message, specifying the lineno of the
// current token.
Parser.prototype._error = function(msg) {
  throw new ParseError("Line " + this.cur_token.lineno + ": " + msg);
}

// The methods below are typical recursive-descent grammar-driving parsing
// routines. The invariant assumed by each is that this.cur_token is the next
// token to parse (or null if the buffer ended).

Parser.prototype._parse_program = function() {
  // Class nodes will be collected here
  var classes = [];

  while (this.cur_token) {
    classes.push(this._parse_class());
    this._skip_token('SEMI');
  }

  return new cool_ast.Program(classes);
}

Parser.prototype._parse_class = function() {
  this._match('CLASS');
  var type_tok = this._match('TYPE');
  var parent_tok = null;
  if (this.cur_token.name === 'INHERITS') {
    this._advance();
    parent_tok = this._match('TYPE');
  }

  var features = [];
  this._match('L_BRACE');
  while (this.cur_token.name !== 'R_BRACE') {
    features.push(this._parse_feature());
    this._skip_token('SEMI');
  }
  this._advance();

  var parent_name = parent_tok ? parent_tok.value : null;
  return new cool_ast.Class(type_tok.value, parent_name, features,
                            type_tok.lineno);
}

Parser.prototype._parse_feature = function() {
  var name_tok = this._match('IDENTIFIER');
  if (this.cur_token.name === 'L_PAREN') {
    this._advance();
    var formals = [];
    while (this.cur_token.name !== 'R_PAREN') {
      var name_tok = this._match('IDENTIFIER');
      this._match('COLON');
      var type_tok = this._match('TYPE');
      formals.push(new cool_ast.Formal(name_tok.value, type_tok.value,
                                       name_tok.lineno));
      this._skip_token('COMMA');
    }
    this._advance();

    this._match('COLON');
    var return_tok = this._match('TYPE');
    this._match('L_BRACE');
    var expr = this._parse_expression();
    this._match('R_BRACE');
    return new cool_ast.Method(name_tok.value, formals, return_tok.value,
                               expr, name_tok.lineno);
  } else if (this.cur_token.name === 'COLON') {
    this._advance();
    var type_tok = this._match('TYPE');
    var init_node = new cool_ast.NoExpr();
    if (this.cur_token.name === 'ASSIGN_ARROW') {
      this._advance();
      init_node = this._parse_expression();
    }
    return new cool_ast.Attr(name_tok.value, type_toc.value, init_node,
                             name_tok.lineno);
  } else {
    this._error("expected a '(' or ':' after feature name, got '" +
                this.cur_token.name + "'");
  }
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
  var result_node = this._parse_atom();

  // Main precedence-climbing loop. Look at the next token and try to figure out
  // whether to incorporate it into the expression. If the next token is a
  // binary operator of high-enough precedence, rebuilt the result node with
  // it on top. Otherwise, return to caller that will handle this operator.
  while (true) {
    var op_tok = this.cur_token;
    if (!op_tok) {
      break;
    }
    var op_info = Parser._operator_info[op_tok.name];
    if (op_info && op_info.kind === 'binary' && op_info.prec >= min_prec) {
      this._advance();
      // Build the right-hand side of the binary expression.
      var next_min_prec = op_info.assoc === 'left' ? op_info.prec + 1 :
                                                     op_info.prec;
      var rhs = this._parse_expression(next_min_prec);
      // Build the BinaryOp node to represent the result so far
      result_node = new cool_ast.BinaryOp(op_tok.value, result_node, rhs,
                                          op_tok.lineno);
    } else {
      break;
    }
  }

  return result_node;
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
    this._skip_token('SEMI');
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
  this._match('IF');
  var pred_expr = this._parse_expression();
  this._match('THEN');
  var then_expr = this._parse_expression();
  this._match('ELSE');
  var else_expr = this._parse_expression();
  return new cool_ast.Cond(pred_expr, then_expr, else_expr, pred_expr.loc);
}

Parser.prototype._parse_while_expr = function() {
  this._match('WHILE');
  var pred_expr = this._parse_expression();
  this._match('LOOP');
  var body_expr = this._parse_expression();
  this._match('POOL');
  return new cool_ast.Loop(pred_expr, body_expr, pred_expr.loc);
}

Parser.prototype._parse_isvoid_expr = function() {
  var isvoid_tok = this._match('ISVOID');
  // ISVOID binds stronger than all binary operators, so it can simply
  // parse the atom following it.
  var atom = this._parse_atom();
  return new cool_ast.IsVoid(atom, isvoid_tok.lineno);
}

Parser.prototype._parse_not_expr = function() {
  var not_tok = this._match('NOT');
  // NOT has to pass forward its precedence so the parsing doesn't go too far.
  var expr = this._parse_expression(Parser._operator_info['NOT'].prec);
  return new cool_ast.UnaryOp('NOT', expr, not_tok.lineno);
}

Parser.prototype._parse_tilde_expr = function() {
  var tilde_tok = this._match('TILDE');
  // TILDE binds stronger than all binary operators, so it can simply
  // parse the atom following it.
  var negated_atom = this._parse_atom();
  return new cool_ast.UnaryOp('~', negated_atom, tilde_tok.lineno);
}

Parser.prototype._parse_new_expr = function() {
  var new_tok = this._match('NEW');
  var type_tok = this._match('TYPE');
  return new cool_ast.New(type_tok.value, new_tok.lineno);
}

Parser.prototype._parse_let_expr = function() {
  this._match('LET');
  var let_inits = [];
  // First collect the list of initializers into let_inits.
  while (this.cur_token.name !== 'IN') {
    var id_tok = this._match('IDENTIFIER');
    this._match('COLON');
    var type_decl_tok = this._match('TYPE');
    var init_node = new cool_ast.NoExpr();
    if (this.cur_token.name === 'ASSIGN_ARROW') {
      this._advance();
      init_node = this._parse_expression();
    }
    let_inits.push(new cool_ast.Letinit(id_tok.value, type_decl_tok.value,
                                        init_node, id_tok.lineno));

    this._skip_token('COMMA');
  }
  this._advance();

  // Now we can parse the body of the let
  var body = this._parse_expression();
  return new cool_ast.Let(let_inits, body, body.loc);
}

Parser.prototype._parse_case_expr = function() {
  this._match('CASE');
  var expr_node = this._parse_expression();
  this._match('OF');
  var cases = [];
  while (this.cur_token.name !== 'ESAC') {
    var name_tok = this._match('IDENTIFIER');
    this._match('COLON');
    var type_decl_tok = this._match('TYPE');
    this._match('CASE_ARROW');
    var expr_value_node = this._parse_expression();
    this._skip_token('SEMI');
    cases.push(new cool_ast.Case(name_tok.value, type_decl_tok.value,
                                 expr_value_node, name_tok.lineno));
  }
  this._advance();

  return new cool_ast.Typcase(expr_node, cases, expr_node.loc);
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
    this._skip_token('COMMA');
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
