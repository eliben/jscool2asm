# [1] "The Zephyr Abstract Syntax Description Language" by Wang, et. al.
from collections import namedtuple
from enum import Enum
import re

# Types for describing tokens in an ASDL specification.
TokenKind = Enum('TokenKind', '''ConstructorId TypeId Equals Question Pipe
                                 LParen RParen Comma Asterisk LBrace RBrace''')

Token = namedtuple('Token', 'kind value lineno')

class ASDLSyntaxError(Exception):
    def __init__(self, msg, lineno=None):
        self.msg = msg
        self.lineno = lineno or '<unknown>'

    def __str__(self):
        return 'Syntax error on line %s: %s' % (self.lineno, self.msg)

def tokenize_asdl(buf):
    """ Tokenize the given buffer. Yield tokens.
    """
    buflen = len(buf)
    pos = 0
    lineno = 1

    while pos < buflen:
        m = tokenize_asdl._re_skip_whitespace.search(buf, pos)
        if not m: return
        lineno += buf.count('\n', pos, m.start())
        pos = m.start()
        c = buf[pos]
        if c.isalpha():
            # Some kind of identifier
            m = tokenize_asdl._re_nonword.search(buf, pos + 1)
            end = m.end() - 1 if m else buflen
            id = buf[pos:end]
            if c.isupper():
                yield Token(TokenKind.ConstructorId, id, lineno)
            else:
                yield Token(TokenKind.TypeId, id, lineno)
            pos = end
        elif c == '-':
            # Potential comment, if followed by another '-'
            if pos < buflen - 1 and buf[pos + 1] == '-':
                pos = buf.find('\n', pos + 1)
                if pos < 0: pos = buflen
                continue
            else:
                raise ASDLSyntaxError('Invalid operator %s' % c, lineno)
        else:
            # Operators
            op_kind = tokenize_asdl._operator_table.get(c, None)
            if op_kind:
                yield Token(op_kind, c, lineno)
            else:
                raise ASDLSyntaxError('Invalid operator %s' % c, lineno)
            pos += 1

# Immutable helper objects for tokenize_asdl.
tokenize_asdl._re_skip_whitespace = re.compile(r'\S')
tokenize_asdl._re_nonword = re.compile(r'\W')
tokenize_asdl._operator_table = {
    '=': TokenKind.Equals,      ',': TokenKind.Comma,   '?': TokenKind.Question,
    '|': TokenKind.Pipe,        '(': TokenKind.LParen,  ')': TokenKind.RParen,
    '*': TokenKind.Asterisk,    '{': TokenKind.LBrace,  '}': TokenKind.RBrace}


# The EBNF we're parsing here: Figure 1 of the paper [1]. Extended to support
# modules and attributes after a product. Words starting with Capital letters
# are terminals. Others are non-terminals. Id is either TokenId or
# ConstructorId.

# module        ::= Id Id "{" [definitions] "}"
# definitions   ::= { TypeId "=" type }
# type          ::= product | sum
# product       ::= fields [attributes fields]
# fields        ::= "(" { field, "," } field ")"
# field         ::= TypeId ["?" | "*"] [Id]
# sum           ::= constructor { "|" constructor } [attributes fields]
# constructor   ::= ConstructorId [fields]

class ASDLParser:
    def __init__(self):
        self._tokenizer = None
        self.cur_token = None

    def parse(self, buf):
        """ Parse the ASDL in the buffer and return an AST with a Module root.
        """
        self._tokenizer = tokenize_asdl(buf)
        self._advance()
        return self._parse_module()

    def _parse_module(self):
        if (self.cur_token.kind == TokenKind.TypeId and
            self.cur_token.value == 'module'
            ):
            self._advance()
        else:
            raise ASDLSyntaxError('Expected "module" (found %s)' % (
                self.cur_token.value), self.cur_token.lineno)
        name = self._match(self._id_kinds)
        self._match(TokenKind.LBrace)
        defs = self._parse_definitions()
        self._match(TokenKind.RBrace)
        return Module(name, defs)

    def _parse_definitions(self):
        defs = []
        while self.cur_token.kind == TokenKind.TypeId:
            print('@', self.cur_token.lineno)
            typename = self._advance()
            self._match(TokenKind.Equals)
            type = self._parse_type()
            defs.append(Type(typename, type))
        return defs

    def _parse_type(self):
        if self.cur_token.kind == TokenKind.LParen:
            # If we see a (, it's a product
            return self._parse_product()
        else:
            # Otherwise it's a sum. Look for ConstructorId
            sumlist = [Constructor(self._match(TokenKind.ConstructorId),
                                   self._parse_optional_fields())]
            while self.cur_token.kind  == TokenKind.Pipe:
                # More constructors
                self._advance()
                sumlist.append(Constructor(
                                self._match(TokenKind.ConstructorId),
                                self._parse_optional_fields()))
            return Sum(sumlist, self._parse_optional_attributes())

    def _parse_product(self):
        print('  parse product', self.cur_token)
        return Product(self._parse_fields(), self._parse_optional_attributes())

    def _parse_fields(self):
        print('  parse fields')
        fields = []
        self._match(TokenKind.LParen)
        while self.cur_token.kind == TokenKind.TypeId:
            typename = self._advance()
            print('    saw typename =', typename)
            is_seq, is_opt = self._parse_optional_field_quantifier()
            if self.cur_token.kind in self._id_kinds:
                id = self._advance()
                print('    got id = ', id)
            else:
                id = None
            fields.append(Field(typename, id, seq=is_seq, opt=is_opt))
            print('    added %s' % fields[-1])
            if self.cur_token.kind == TokenKind.RParen:
                break
            elif self.cur_token.kind == TokenKind.Comma:
                self._advance()
        self._match(TokenKind.RParen)
        return fields

    def _parse_optional_fields(self):
        if self.cur_token.kind == TokenKind.LParen:
            return self._parse_fields()
        else:
            return None

    def _parse_optional_attributes(self):
        if (self.cur_token.kind == TokenKind.TypeId and
            self.cur_token.value == 'attributes'
            ):
            self._advance()
            return self._parse_fields()
        else:
            return None

    def _parse_optional_field_quantifier(self):
        is_seq, is_opt = False, False
        if self.cur_token.kind == TokenKind.Asterisk:
            is_seq = True
            self._advance()
        elif self.cur_token.kind == TokenKind.Question:
            is_opt = True
            self._advance()
        return is_seq, is_opt

    def _advance(self):
        """ Return the value of the current token and read the next one into
            self.cur_token.
        """
        cur_val = None if self.cur_token is None else self.cur_token.value
        try:
            self.cur_token = next(self._tokenizer)
        except StopIteration:
            self.cur_token = None
        return cur_val

    _id_kinds = (TokenKind.ConstructorId, TokenKind.TypeId)

    def _match(self, kind):
        """ The 'match' primitive of RD parsers.
            * Verifies that the current token is of the given kind (kind can
              be a tuple, in which the kind must match one of its members).
            * Returns the value of the current token
            * Reads in the next token
        """
        if (isinstance(kind, tuple) and self.cur_token.kind in kind or
            self.cur_token.kind == kind
            ):
            value = self.cur_token.value
            self._advance()
            return value
        else:
            raise ASDLSyntaxError('Unmatched %s (found %s)' % (
                kind, self.cur_token.kind), self.cur_token.lineno)


# This AST hierarchy is used to represent the parsed ASDL file as a tree. It's
# an abstract representation of the grammar above.
# Taken from Python's Parser/asdl.py and adapted a bit for 3.4+.

builtin_types = ("identifier", "string", "bytes", "int", "object", "singleton")

class AST:
    pass # a marker class

class Module(AST):
    def __init__(self, name, dfns):
        self.name = name
        self.dfns = dfns
        self.types = {type.name: type.value for type in dfns}

    def __repr__(self):
        return "Module(%s, %s)" % (self.name, self.dfns)

class Type(AST):
    def __init__(self, name, value):
        self.name = name
        self.value = value

    def __repr__(self):
        return "Type(%s, %s)" % (self.name, self.value)

class Constructor(AST):
    def __init__(self, name, fields=None):
        self.name = name
        self.fields = fields or []

    def __repr__(self):
        return "Constructor(%s, %s)" % (self.name, self.fields)

class Field(AST):
    def __init__(self, type, name=None, seq=False, opt=False):
        self.type = type
        self.name = name
        self.seq = seq
        self.opt = opt

    def __repr__(self):
        if self.seq:
            extra = ", seq=True"
        elif self.opt:
            extra = ", opt=True"
        else:
            extra = ""
        if self.name is None:
            return "Field(%s%s)" % (self.type, extra)
        else:
            return "Field(%s, %s%s)" % (self.type, self.name, extra)

class Sum(AST):
    def __init__(self, types, attributes=None):
        self.types = types
        self.attributes = attributes or []

    def __repr__(self):
        if self.attributes:
            return "Sum(%s, %s)" % (self.types, self.attributes)
        else:
            return "Sum(%s)" % self.types

class Product(AST):
    def __init__(self, fields, attributes=None):
        self.fields = fields
        self.attributes = attributes or []

    def __repr__(self):
        if self.attributes:
            return "Product(%s, %s)" % (self.fields, self.attributes)
        else:
            return "Product(%s)" % self.fields

if __name__ == '__main__':
    buf = '''
        stm = Compound(stm, stm)
            | Assign(identifier, exp) -- comment
            -- another comment (, foo
            | attributes (int kwa, foo bar)
            --kowo     '''

    import sys
    with open(sys.argv[1]) as f:
        buf = f.read()
    p = ASDLParser()
    p.parse(buf)

    #for t in tokenize_asdl(buf):
        #print(t)

