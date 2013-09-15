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
//  EQ, LE, LEQ, ARROW, DOT, SEMI, AT, COMMA, COLON
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

Lexer.prototype._skipnontokens = function() {
  while (this.pos < this.buflen) {
    var c = this.buf.charAt(this.pos);
    if (c == ' ' || c == '\t' || c == '\r') {
      this.pos++;
    } else if (c == '\n') {
      this.pos++;
      this.lineno++;
    } else {
      break;
    }
  }
}

if (module.parent === null) {
  console.log('main file');

  var lexer = new Lexer();

  lexer.input([ '[ + \t  \n = kl 234-jab',
                '* // - + 2 kwa',
                '/&  |"homer | marge"68'].join('\n'));

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

