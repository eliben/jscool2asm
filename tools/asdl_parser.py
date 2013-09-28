# [1] "The Zephyr Abstract Syntax Description Language" by Wang, et. al.
from collections import namedtuple
from enum import Enum
import re

TokenKind = Enum('TokenKind',
    '''ConstructorId TypeId 
       Attributes Module
       Equals Question Pipe LParen RParen Comma Asterisk LBrace RBrace''')

Token = namedtuple('Token', 'kind value lineno')

class ASDLSyntaxError(Exception):
    def __init__(self, msg, lineno=None):
        self.msg = msg
        self.lineno = lineno or '<unknown>'

    def __str__(self):
        return 'Syntax error on line %s: %s' % (self.lineno, self.msg)

_operator_table = {
    '=': TokenKind.Equals,      ',': TokenKind.Comma,   '?': TokenKind.Question,
    '|': TokenKind.Pipe,        '(': TokenKind.LParen,  ')': TokenKind.RParen,
    '*': TokenKind.Asterisk,    '{': TokenKind.LBrace,  '}': TokenKind.RBrace}

_keyword_table = {
    'attributes': TokenKind.Attributes, 'module': TokenKind.Module}

_re_nonword = re.compile(r'\W')
_re_skip_whitespace = re.compile(r'\S')


def tokenize_asdl(buf):
    """ Tokenize the given buffer. Yield tokens.
    """
    buflen = len(buf)
    pos = 0
    lineno = 1

    while pos < buflen:
        m = _re_skip_whitespace.search(buf, pos)
        if not m: return
        lineno += buf.count('\n', pos, m.start())
        pos = m.start()
        c = buf[pos]
        if c.isalpha():
            # Some kind of identifier
            m = _re_nonword.search(buf, pos + 1)
            end = m.end() - 1 if m else buflen
            id = buf[pos:end]
            keyword = _keyword_table.get(id, None)
            if keyword:
                yield Token(keyword, id, lineno)
            elif c.isupper():
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
            op_kind = _operator_table.get(c, None)
            if op_kind:
                yield Token(op_kind, c, lineno)
            else:
                raise ASDLSyntaxError('Invalid operator %s' % c, lineno)
            pos += 1

# The EBNF we're parsing here: Figure 1 of the paper [1]. Extended to support
# "modules". Words starting with Capital letters are terminals. Others are
# non-terminals. Id is either TokenId or ConstructorId.
#
# module        ::= Id Id "{" [definitions] "}"
# definitions   ::= { TypeId "=" type
# type          ::= product | sum
# product       ::= fields
# fields        ::= "(" { field, "," } field ")"
# field         ::= TypeId ["?" | "*"] [Id]
# sum           ::= constructor { "|" constructor } [Attributes fields]
# constructor   ::= ConstructorId [fields]

class ASDLParser:
    def __init__(self):
        self._tokenizer = None

    def parse(self, buf):
        """ Parse the ASDL in the buffer and return an AST with a Module root.
        """
        self._tokenizer = tokenize_asdl(buf)
        while True:
            self._get_next_token()
            print(self.cur_token)
            if self.cur_token is None:
                print('--done--')
                return

    def _get_next_token(self):
        try:
            self.cur_token = next(self._tokenizer)
        except StopIteration:
            self.cur_token = None
        # propagate ASDLSyntaxError from the tokenizer up

    def _match(self, kind):
        """ The 'match' primitive of RD parsers.
            * Verifies that the current token is of the given kind
            * Returns the value of the current token
            * Reads in the next token
        """
        if self.cur_token.kind == kind:
            val = self.cur_token.val
            self._get_next_token()
            return val
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
        self.types = {} # maps type name to value (from dfns)
        for type in dfns:
            self.types[type.name.value] = type.value

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
        if self.attributes is None:
            return "Sum(%s)" % self.types
        else:
            return "Sum(%s, %s)" % (self.types, self.attributes)

class Product(AST):
    def __init__(self, fields, attributes=None):
        self.fields = fields
        self.attributes = attributes or []

    def __repr__(self):
        if self.attributes is None:
            return "Product(%s)" % self.fields
        else:
            return "Product(%s, %s)" % (self.fields, self.attributes)

if __name__ == '__main__':
    buf = '''
        stm = Compound(stm, stm)
            | Assign(identifier, exp) -- comment
            -- another comment (, foo
            | attributes (int kwa, foo bar)
            --kowo     '''

    import sys
    buf = open(sys.argv[1]).read()
    p = ASDLParser()
    p.parse(buf)

    #for t in tokenize_asdl(buf):
        #print(t)

