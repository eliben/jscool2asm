'use strict';

//
// Token names:
//
// Constants:
//  INT_CONST, STR_CONST, BOOL_CONST
//
// Types and identifiers:
//  TYPE, ID
//
// Punctuation and operators:
//  L_BRACE, R_BRACE, L_PAREN, R_PAREN, PLUS, MINUS, TILDE, MULTIPLY, DIVIDE,
//  EQ, GEQ, LE, LEQ, ARROW, DOT, SEMI, AT, COMMA, COLON
//
// Keywords:
//  CLASS, ELSE, FI, IF, IN, INHERITS, LET, LOOP, POOL, THEN, WHILE, CASE, ESAC,
//  OF, NEW, ISVOID, NOT, LET_STMT
//
// Comments and whitespace are skipped by the lexer - not reported as tokens.
// Strings may contain newlines escaped with '\'.
// 

var Lexer = exports.Lexer = function() {
  this.pos = 0;
  this.buf = null;
  this.buflen = 0;

  // List of errors accumulated (and recovered from) during lexing.
  this.errors = [];

  // Operator table, mapping operator -> token name
  this.optable = {
    '+':  'PLUS',
    '-':  'MINUS',
    '*':  'MULTIPLY',
    '/':  'DIVIDE',
    '{':  'L_BRACE',
    '}':  'R_BRACE',
    '(':  'L_PAREN',
    ')':  'R_PAREN',
    '~':  'TILDE',
    '@':  'AT',
    '.':  'PERIOD',
    ',':  'COMMA',
    ';':  'SEMI',
  };
}

// Initialize the Lexer's buffer. This resets the lexer's internal
// state and subsequent tokens will be returned starting with the
// beginning of the new buffer.
Lexer.prototype.input = function(buf) {
  this.pos = 0;
  this.buf = buf;
  this.buflen = buf.length;
  this.lineno = 1;
}

// Get the next token from the current buffer. A token is an object with
// the following properties:
// - name: name of the pattern that this token matched.
// - value: actual string value of the token.
// - pos: offset in the current buffer where the token starts.
// - lineno: line number.
//
// If there are no more tokens in the buffer, returns null. In case of
// an error, returns a token with name 'ERROR' and a description of the error
// as the value.
Lexer.prototype.token = function() {
  this._skipnontokens();
  if (this.pos >= this.buflen) {
    return null;
  }

  // The char at this.pos is part of a real token. Figure out which.
  var c = this.buf.charAt(this.pos);
  // Look it up in the table of operators
  var op = this.optable[c];
  if (op !== undefined) {
    return {name: op, value: c, pos: this.pos++, lineno: this.lineno};
  } else if (c === '<') {
    // Distinguish between '<', '<=',  and '<-'
    var next_c = this.buf.charAt(this.pos + 1);
    if (next_c === '-') {
      var tok = {name: 'ARROW', value: c, pos: this.pos, lineno: this.lineno};
      pos += 2;
      return tok;
    } else if (next_c === '=') {
      var tok = {name: 'LEQ', value: c, pos: this.pos, lineno: this.lineno};
      pos += 2;
      return tok;
    } else {
      // The '<' stands on its own. pos++ to look at the next char again in the
      // next token() call and figure out what token it belongs to.
      return {name: 'LE', value: c, pos: this.pos++, lineno: this.lineno};
    }
  } else if (c === '"') {
    return this._process_string();
  } else if (Lexer._isalpha(c)) {
    return this._process_identifier();
  } else if (Lexer._isdigit(c)) {
    return this._process_number();
  } else {
    this._add_error("Unknown token '" + c + "'");
    this.pos++;
  }
}

Lexer._isnewline = function(c) {
  return c === '\r' || c === '\n';
}

Lexer._isdigit = function(c) {
  return c >= '0' && c <= '9';
}

Lexer._isalpha = function(c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         c === '_';
}

Lexer._isalphanum = function(c) {
  return Lexer._isdigit(c) || Lexer._isalpha(c);
}

Lexer.prototype._add_error = function(str) {
  this.errors.push('Line ' + this.lineno.toString() + ': ' + str);
}

Lexer.prototype._skip_line_comment = function() {
  // Skip until the end of the line
  var c = this.buf.charAt(this.pos);
  while (this.pos < this.buflen && !(c === '\r' || c === '\n')) {
    c = this.buf.charAt(this.pos++);
  }
}

Lexer.prototype._skip_multiline_comment = function() {
  // Multi-line comments can be nested. nestcount keeps track of the level of
  // nesting we're currently in. Note: when this function is invoked, we're
  // inside the "toplevel" comment.
  var nestcount = 0;
  while (this.pos < this.buflen) {
    var peek = this.buf.substr(this.pos, 2);
    if (peek === '(*') {
      this.pos += 2;
      nestcount++;
    } else if (peek === '*)') {
      this.pos += 2;
      if (nestcount === 0) {
        return;
      } else {
        nestcount--;
      }
    } else {
      if (peek[0] === '\n') {
        this.lineno++;
      }
      this.pos++;
    }
  }

  this._add_error('Unterminated multi-line comment at EOF');
}

Lexer.prototype._skipnontokens = function() {
  while (this.pos < this.buflen) {
    var c = this.buf.charAt(this.pos);
    if (c == ' ' || c == '\f' || c == '\v' || c == '\t' || c == '\r') {
      this.pos++;
    } else if (c == '\n') {
      this.pos++;
      this.lineno++;
    } else if (c === '-') {
      // Maybe it's the start of a line comment?
      var next_c = this.buf.charAt(this.pos + 1);
      if (next_c === '-') {
        this.pos += 2;
        this._skip_line_comment();
      } else {
        break;
      }
    } else if (c === '(') {
      // Maybe it's the start of a multi-line comment?
      var next_c = this.buf.charAt(this.pos + 1);
      if (next_c === '*') {
        this.post += 2;
        this._skip_multiline_comment();
      } else {
        break;
      }
    } else {
      break;
    }
  }
}

//------------------------------------------------
if (module.parent === null) {
  console.log('main file');

  var lexer = new Lexer();

  lexer.input([ '  -- juby \n',
                '',
                ''].join('\n'));

  //var fs = require('fs');
  //var fileinput = fs.readFileSync('input.td', 'utf8');
  //lexer.input(fileinput);

  var NTOKS = 9;
  while (true) {
    var tok = lexer.token();
    if (tok === null) {
      break;
    } else {
      console.log(tok);
      NTOKS--;
      if (NTOKS <= 0) {
        break;
      }
    }
  }
}

