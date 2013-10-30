#-------------------------------------------------------------------------------
# Generator of JavaScript AST-definition code from ASDL.
#
# Eli Bendersky (eliben@gmail.com)
# This code is in the public domain
#-------------------------------------------------------------------------------
import pprint
import sys

import asdl_ast
import asdl_parser

CODE_PREFACE = r'''
//------------------------------------------------------------------------------
// AST for Cool.
// NOTE: this code is auto-generated from the ASDL definition of the AST. Do
//       not edit it directly.
//
// Eli Bendersky (eliben@gmail.com)
// This code is in the public domain
//------------------------------------------------------------------------------

'use strict';

// ASTError is the exception type used by this module to signal errors
var ASTError = exports.ASTError = function(message) {
  this.message = message;
}

ASTError.prototype = new Error();
ASTError.prototype.constructor = ASTError;

// Some helper code used throughout the module
var _check_identifier = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object String]') {
    throw new ASTError(who + ' expects ' + what + ' to be an identifier');
  }
}

var _check_string = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object String]' ||
      v[0] !== "\"" || v[v.length - 1] !== "\"") {
    throw new ASTError(who + ' expects ' + what + ' to be a string');
  }
}

var _check_number = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Number]') {
    throw new ASTError(who + ' expects ' + what + ' to be a number');
  }
}

var _check_boolean = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Boolean]') {
    throw new ASTError(who + ' expects ' + what + ' to be a boolean');
  }
}

var _check_array = function(v, who, what) {
  if (Object.prototype.toString.call(v) !== '[object Array]') {
    throw new ASTError(who + ' expects ' + what + ' to be a array');
  }
}

var _abstractmethod = function() {
  throw new ASTError('Abstract method called');
}

// Node is an abstract interface implemented by all the AST nodes defined here.
// This interface is required by NodeVisitor (ZZZ?) to be able to walk any AST.
var Node = exports.Node = function() {
  throw new ASTError('Node is an abstract class');
}

Node.prototype.children = _abstractmethod;
Node.attributes = [];
Node.node_type = 'Node';


//
//-------------------- AST nodes --------------------
//

'''.lstrip()

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
    emit('var %s = exports.%s = function(%s) {' % (
        classname, classname, ', '.join(argnames)))

    # Names of fields that are attributes (non-Nodes)
    attrs = []

    # Now type-checking and assignment of each constructor argument
    for field in constructor.fields:
        if field.seq:
            emit('  _check_array(%s);' % field.name)
            emit('  for (var i = 0; i < %s.length; i++) {' % field.name)
            emit('    if (!(%s[i] instanceof %s)) {' % (
                field.name, field.type.capitalize()))
            emit("      throw new ASTError('%s expects %s to be an array of %s');" % (
                classname, field.name, field.type.capitalize()))
            emit('    }')
            emit('  }')
        elif field.type == 'identifier':
            emit('  _check_identifier(%s);' % field.name)
            attrs.append(field.name)
        elif field.type == 'string':
            emit('  _check_string(%s);' % field.name)
            attrs.append(field.name)
        elif field.type == 'boolean':
            emit('  _check_boolean(%s);' % field.name)
            attrs.append(field.name)
        elif field.type == 'int':
            emit('  _check_number(%s);' % field.name)
            attrs.append(field.name)
        else:
            emit('  if (!(%s instanceof %s)) {' % (
                field.name, field.type.capitalize()))
            emit("    throw new ASTError('%s expects %s to be a %s');" % (
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

    emit("Object.defineProperties(%s, {" % classname)
    emit("  'attributes': {get: function() {return %s;}}," % attrs)
    emit("  'node_type': {get: function() {return '%s';}}" % classname)
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
    emit('var %s = exports.%s = function() {' % (classname, classname))
    emit("  throw new ASTError('%s is an abstract class');" % classname)
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
