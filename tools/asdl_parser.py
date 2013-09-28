from collections import namedtuple
from enum import Enum
import re

TokenKind = Enum('TokenKind',
    '''ConstructorId TypeId Attributes Equals Question Pipe LParen RParen Comma
       Asterisk LBrace RBrace''')

Token = namedtuple('Token', 'kind value lineno')

class ASDLSyntaxError(Exception): pass

_operator_table = {
    '=': TokenKind.Equals,      ',': TokenKind.Comma,   '?': TokenKind.Question,
    '|': TokenKind.Pipe,        '(': TokenKind.LParen,  ')': TokenKind.RParen,
    '*': TokenKind.Asterisk,    '{': TokenKind.LBrace,  '}': TokenKind.RBrace}

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
            if id == 'attributes':
                yield Token(TokenKind.Attributes, id, lineno)
            elif c.isupper():
                yield Token(TokenKind.ConstructorId, id, lineno)
            else:
                yield Token(TokenKind.TypeId, id, lineno)
            pos = end
        elif c == '-':
            if pos < buflen - 1 and buf[pos + 1] == '-':
                # Comment. Skip until newline.
                pos = buf.find('\n', pos + 1)
                if pos < 0: pos = buflen
                continue
            else:
                raise TokenError('Invalid operator %s on line %s' % (c, lineno))
        else:
            # Operators
            op_kind = _operator_table.get(c, None)
            if op_kind:
                yield Token(op_kind, c, lineno)
            else:
                raise TokenError('Invalid operator %s on line %s' % (c, lineno))
            pos += 1


if __name__ == '__main__':
    buf = '''
        stm = Compound(stm, stm)
            | Assign(identifier, exp) -- comment
            -- another comment (, foo
            | attributes (int kwa, foo bar)
            --kowo     '''

    for t in tokenize_asdl(buf):
        print(t)

