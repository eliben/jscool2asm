import pprint
import sys

import asdl_ast
import asdl_parser

def emit_ast(ast):
    for typename, typevalue in ast.types.items():
        print(typename)
        pprint.pprint(typevalue)

def main():
    if len(sys.argv) < 2:
        print('Usage: %s <input ASDL>' % sys.argv[0])
        return 1
    with open(sys.argv[1]) as asdl_file:
        ast = asdl_parser.ASDLParser().parse(asdl_file.read())
        if asdl_ast.check(ast):
            emit_ast(ast)
        else:
            return 1

if __name__ == '__main__':
    sys.exit(main())
