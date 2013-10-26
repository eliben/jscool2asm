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

var _check_boolean = function(v, who, what) {
  if (Object.prototype.toString.call(myvar) !== '[object Boolean]') {
    throw ASTError(who + ' expects ' + what + ' to be a boolean');
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
    for typename, sum in sorted(ast.types.items()):
        emit_ast_type(stream, typename, sum)


# typename will be the class name
# sum is a list of constructors for this class. There are two cases to
# handle:
# 1. The sum consists of a single constructor. In this case the class is
#    not made abstract, since we only have one implementation.
# 2. The sum has multiple constructors. In this case, the typename will
#    become an abstract class implemented by each constructor in
#    the sum.
def emit_ast_type(stream, typename, sum):
    if len(sum.types) == 1:
        emit_single_node(stream, typename, sum.types[0])
    elif len(sum.types) > 1:
        emit_node_hierarchy(stream, typename, sum.types)
    else:
        die('ERROR in %s, no constructors in Sum' % typename)


def emit_class(stream, classname, parentname, constructor):
    def emit(s=''):
        stream.write((s or '') + '\n')
    emit('//')
    emit('// %s is-a %s' % (classname, parentname))
    emit('// %s' % str(constructor))
    emit('//')
    argnames = [field.name for field in constructor.fields] + ['loc']
    emit('var %s = function(%s) {' % (classname, ', '.join(argnames)))

    # Names of fields that are attributes (non-Nodes)
    attrs = []

    # Now type-checking and assignment of each constructor argument
    for field in constructor.fields:
        if field.seq:
            emit('  _check_array(%s);' % field.name)
            emit('  for (var i = 0; i < %s.length; i++) {' % field.name)
            emit('    if (!(%s[i] instanceof %s)) {' % (
                field.name, field.type.capitalize()))
            emit("      throw ASTError('%s expects %s to be an array of %s');" % (
                classname, field.name, field.type.capitalize()))
            emit('    }')
            emit('  }')
        elif field.type == 'identifier':
            emit('  _check_string(%s);' % field.name)
            attrs.append(field.name)
        elif field.type == 'boolean':
            emit('  _check_boolean(%s);' % field.name)
            attrs.append(field.name)
        else:
            emit('  if (!(%s instanceof %s)) {' % (
                field.name, field.type.capitalize()))
            emit("    throw ASTError('%s expects %s to be a %s');" % (
                classname, field.name, field.type.capitalize()))
            emit('  }')
        emit('  this.%s = %s;' % (field.name, field.name))
        emit()
    emit('  this.loc = loc;')
    emit('}')
    emit()

    emit('%s.prototype = Object.create(%s.prototype);' % (
        classname, parentname))
    emit('%s.prototype.constructor = %s;' % (classname, classname))
    emit()

    emit("Object.defineProperty(%s.prototype, 'attributes', {" % classname)
    emit("  get: function() {return %s;}" % attrs)
    emit("});")
    emit()


def emit_single_node(stream, typename, constructor):
    if typename.lower() != constructor.name.lower():
        print('Warning: Constructor name mismatch in single node : %s vs %s' %
                (typename, constructor.name))
    classname = typename.capitalize()
    emit_class(stream, classname, 'Node', constructor)


def emit_node_hierarchy(stream, typename, constructors):
    def emit(s=''):
        stream.write((s or '') + '\n')
    # Create the node for typename as the abstract base class for this
    # hierarchy, and then emit each constructor with this class as a parent.
    classname = typename.capitalize()
    emit('//')
    emit('// %s is an abstract Node interface' % classname)
    emit('//')
    emit('var %s = function() {' % classname)
    emit("  throw ASTError('%s is an abstract class');" % classname)
    emit('}')
    emit()
    emit('%s.prototype = Object.create(Node.prototype);' % classname)
    emit('%s.prototype.constructor = %s' % (classname, classname))
    emit()

    for constructor in constructors:
        emit_class(stream, constructor.name, classname, constructor)


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