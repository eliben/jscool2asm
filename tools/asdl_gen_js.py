import pprint
import sys

import asdl_ast
import asdl_parser

CODE_PREFACE = r''''use strict';

// ASTError is the exception type used by this module to signal errors
function ASTError(message) {
  this.message = message;
}

ASTError.prototype = new Error();
ASTError.prototype.constructor = ASTError;

// Some helper code used throughout the module
var _check_string = function(v, who, what) {
  if (Object.prototype.toString.call(myvar) !== '[object String]') {
    throw ASTError(who + ' expects ' + what + ' to be a string');
  }
}

var _check_array = function(v, who, what) {
  if (Object.prototype.toString.call(myvar) !== '[object Array]') {
    throw ASTError(who + ' expects ' + what + ' to be a array');
  }
}

var _abstractmethod = function() {
  throw ASTError('Abstract method called');
}

// Node is an abstract interface implemented by all the AST nodes defined here.
// This interface is required by NodeVisitor (ZZZ?) to be able to walk any AST.
var Node = function() {
  throw ASTError('Node is an abstract class');
}

Node.prototype.children = _abstractmethod;

//
//-------------------- AST nodes --------------------
//
'''

def die(msg):
    sys.stderr.write(msg + '\n')
    sys.exit(1)


def emit_ast(stream, ast):
    stream.write(CODE_PREFACE)
    for typename, sum in ast.types.items():
        emit_type(stream, typename, sum)


# typename will be the class name
# sum is a list of constructors for this class. There are two cases to
# handle:
# 1. The sum consists of a single constructor. In this case the class is
#    not made abstract, since we only have one implementation.
# 2. The sum has multiple constructors. In this case, the typename will
#    become an abstract class implemented by each constructor in
#    the sum.
def emit_type(stream, typename, sum):
    if len(sum.types) == 1:
        emit_single_node(stream, typename, sum.types[0])
    elif len(sum.types) > 1:
        emit_node_hierarchy(stream, typename, sum.types)
    else:
        die('ERROR in %s, no constructors in Sum' % typename)
    print(type(sum.types))
    pprint.pprint(sum.types)


def emit_single_node(stream, typename, constructor):
    pass


def emit_node_hierarchy(stream, typename, constructors):
    pass


def main():
    if len(sys.argv) < 2:
        print('Usage: %s <input ASDL>' % sys.argv[0])
        return 1
    with open(sys.argv[1]) as asdl_file:
        ast = asdl_parser.ASDLParser().parse(asdl_file.read())
        if asdl_ast.check(ast):
            emit_ast(sys.stdout, ast)
        else:
            return 1

if __name__ == '__main__':
    sys.exit(main())
