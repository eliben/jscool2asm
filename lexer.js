'use strict';

//
// Token names:
//
// Constants:
//  NUMBER, STRING
//
// Types and identifiers:
//  TYPE, IDENTIFIER
//
// Punctuation and operators:
//  L_BRACE, R_BRACE, L_PAREN, R_PAREN, PLUS, MINUS, TILDE, MULTIPLY, DIVIDE,
//  EQ, CASE_ARROW, LE, LEQ, ASSIGN_ARROW, DOT, SEMI, AT, COMMA, COLON
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
// an error, returns a token with name 'ERROR' and adds an error string to the
// errors attribute.
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
    return this._maketoken(op, c, this.pos++);
  } else if (c === '<') {
    // Distinguish between '<', '<=',  and '<-'
    var next_c = this.buf.charAt(this.pos + 1);
    if (next_c === '-') {
      var tok = this._maketoken('ASSIGN_ARROW', c);
      this.pos += 2;
      return tok;
    } else if (next_c === '=') {
      var tok = this._maketoken('LEQ', c);
      this.pos += 2;
      return tok;
    } else {
      // The '<' stands on its own. pos++ to look at the next char again in the
      // next token() call and figure out what token it belongs to.
      return this._maketoken('LE', c, this.pos++);
    }
  } else if (c === '=') {
    // Distinguish between '=>' and '='
    var next_c = this.buf.charAt(this.pos + 1);
    if (next_c === '>') {
      var tok = this._maketoken('CASE_ARROW', c);
      this.pos += 2;
      return tok;
    } else {
      // The '=' stands on tis own.
      return this._maketoken('EQ', c, this.pos++);
    }
  } else if (c === '"') {
    return this._process_string();
  } else if (Lexer._isalpha(c)) {
    return this._process_identifier();
  } else if (Lexer._isdigit(c)) {
    return this._process_number();
  } else {
    this._add_error("Unknown token '" + c + "'");
    return this._maketoken('ERROR', '', this.pos++);
  }
}

// Creates a new token with the given name, value and pos. lineno is added
// automatically. pos is optional: if not provided, this.pos is used.
Lexer.prototype._maketoken = function(name, value, pos) {
  var realpos = (typeof pos === "undefined") ? this.pos : pos;
  return {name: name, value: value, pos: realpos, lineno: this.lineno};
}

Lexer._isdigit = function(c) {
  return c >= '0' && c <= '9';
}

Lexer._isalpha = function(c) {
  return (c >= 'a' && c <= 'z') ||
         (c >= 'A' && c <= 'Z') ||
         c === '_';
}

Lexer._isuppercase = function(c) {
  return (c >= 'A' && c <= 'Z');
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
        this.pos += 2;
        this._skip_multiline_comment();
      } else {
        break;
      }
    } else {
      break;
    }
  }
}

Lexer.prototype._process_number = function() {
  var endpos = this.pos + 1;
  while (endpos < this.buflen &&
         Lexer._isdigit(this.buf.charAt(endpos))) {
    endpos++;
  }

  var tok = this._maketoken('NUMBER', this.buf.substring(this.pos, endpos));
  this.pos = endpos;
  return tok;
}

Lexer.prototype._process_identifier = function() {
  var endpos = this.pos + 1;
  while (endpos < this.buflen &&
         Lexer._isalphanum(this.buf.charAt(endpos))) {
    endpos++;
  }

  // Distinguish between types (identifiers starting with uppercase letters)
  // and other identifiers.
  var toktype = Lexer._isuppercase(this.buf.charAt(this.pos)) ? 'TYPE' :
                                                                'IDENTIFIER';
  var tok = this._maketoken(toktype, this.buf.substring(this.pos, endpos));
  this.pos = endpos;
  return tok;
}

Lexer.prototype._process_string = function() {
  // this.pos points at the opening quote. Find the ending quote.
  var end_index = this.buf.indexOf('"', this.pos + 1);

  if (end_index === -1) {
    this._add_error('Unterminated string');
    return null;
  } else {
    // Look for newlines inside the string and make sure they are escaped.
    var nindex = this.pos + 1;
    while ((nindex = this.buf.indexOf('\n', nindex)) > 0) {
      if (nindex > end_index) {
        break;
      }
      if (this.buf.charAt(nindex - 1) !== '\\') {
        // Invalid unescaped newline inside a string.
        this._add_error('Unescaped newline inside a string');
      }
      this.lineno++;
      nindex++;
    }
  }
  var tok = this._maketoken('STRING',
                            this.buf.substring(this.pos, end_index + 1));
  this.pos = end_index + 1;
  return tok;
}

//------------------------------------------------
if (module.parent === null) {
  console.log('main file');

  var lexer = new Lexer();

  lexer.input([
      'maxtron 100p  -- juby',
      ' and now "a string"',
      'hoe+moped* <- <= < => (* huhu(* *) \t 2',
      '*) krisa 123 Joba'].join('\n'));

  //var fs = require('fs');
  //var fileinput = fs.readFileSync('input.td', 'utf8');
  //lexer.input(fileinput);

  var NTOKS = 9999;
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
  console.log('ERRORS:');
  console.log(lexer.errors);
}

